import os
import secrets
import pyotp
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.models import db
from app.models.user import User, UserRole, CustomerProfile, SupplierProfile, AuthProvider
from app.models.session import Session
from app.utils.validation import (
    validate_email,
    validate_phone_number,
    validate_password,
    validate_required_fields
)
from app.utils.responses import success_response, error_response, validation_error_response
from app.services.email_service import send_email, send_otp_email, send_welcome_email
from app.services.google_oauth_service import google_oauth_service
from app.models.otp import OTP

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@validate_required_fields(['email', 'password', 'role'])

def register():
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    if not validate_email(email):
        return validation_error_response({'email': 'Invalid email format'})
    
    if User.query.filter_by(email=email).first():
        return error_response('Email already exists', 409)
    
    password = data.get('password')
    is_valid, message = validate_password(password)
    if not is_valid:
        return validation_error_response({'password': message})
    
    role = data.get('role', '').lower()
    if role not in ['customer', 'supplier']:
        return validation_error_response({'role': 'Invalid role. Must be customer or supplier'})

    try:
        user = User(
            email=email,
            role=UserRole.CUSTOMER if role == 'customer' else UserRole.SUPPLIER,
        )
        user.set_password(password)

        if role == 'customer':
            required_customer_fields = ['first_name', 'last_name', 'phone_number']
            missing_fields = [field for field in required_customer_fields if not data.get(field)]
            if missing_fields:
                return validation_error_response({
                    'profile': f'Missing customer fields: {", ".join(missing_fields)}'
                })
            
            phone_number = data.get('phone_number', '').strip()
            if not validate_phone_number(phone_number):
                return validation_error_response({'phone_number': 'Invalid phone number format'})
            
            profile = CustomerProfile(
                user=user,
                first_name=data.get('first_name', '').strip(),
                last_name=data.get('last_name', '').strip(),
                phone_number=phone_number,
                mpesa_number=data.get('mpesa_number', '').strip() if data.get('mpesa_number') else None
            )
        
        else:
            required_supplier_fields = ['business_name', 'contact_person', 'phone_number', 'mpesa_number']
            missing_fields = [field for field in required_supplier_fields if not data.get(field)]
            if missing_fields:
                return validation_error_response({
                    'profile': f'Missing supplier fields: {", ".join(missing_fields)}'
                })
            
            phone_number = data.get('phone_number', '').strip()
            mpesa_number = data.get('mpesa_number', '').strip()

            if not validate_phone_number(phone_number):
                return validation_error_response({'phone_number': 'Invalid phone number format'})
            
            if not validate_phone_number(mpesa_number):
                return validation_error_response({'mpesa_number': 'Invalid mpesa number format'})
            
            profile = SupplierProfile(
                user=user,
                business_name=data.get('business_name', '').strip(),
                business_registration_number=data.get('business_registration_number', '').strip() if data.get('business_registration_number') else None,
                contact_person=data.get('contact_person', '').strip(),
                phone_number=phone_number,
                mpesa_number=mpesa_number,
                payout_method=data.get('payout_method', 'phone').strip()
            )

        db.session.add(user)
        db.session.add(profile)
        db.session.commit()

        # Send OTP for email verification
        try:
            otp = OTP.create_otp(email, purpose='verification')
            send_otp_email(email, otp.code, purpose='verification')
        except Exception as e:
            current_app.logger.error(f'Failed to send OTP: {str(e)}')

        return success_response(
            data=user.to_dict(include_profile=True),
            message=f'{role.capitalize()} registered successfully. Please check your email for the verification code.',
            status_code=201
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Registration failed: {str(e)}', 500)


@auth_bp.route('/send-otp', methods=['POST'])
@validate_required_fields(['email'])
def send_otp():
    """Send or resend OTP to email."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        purpose = data.get('purpose', 'verification')

        if not validate_email(email):
            return validation_error_response({'email': 'Invalid email format'})

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if purpose == 'verification':
            if not user:
                return error_response('Email not registered', 404)
            if user.is_verified:
                return error_response('Email is already verified', 400)

        elif purpose == 'password_reset':
            if not user:
                # Don't reveal if email exists for security
                return success_response(
                    message='If the email exists, an OTP has been sent.'
                )

        # Create and send OTP
        otp = OTP.create_otp(email, purpose=purpose)
        send_otp_email(email, otp.code, purpose=purpose)

        return success_response(
            message='OTP sent successfully. Please check your email.',
            data={'email': email, 'expires_in_minutes': 10}
        )

    except Exception as e:
        return error_response(f'Failed to send OTP: {str(e)}', 500)


@auth_bp.route('/verify-otp', methods=['POST'])
@validate_required_fields(['email', 'otp'])
def verify_otp():
    """Verify OTP code."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        code = data.get('otp', '').strip()
        purpose = data.get('purpose', 'verification')

        if not validate_email(email):
            return validation_error_response({'email': 'Invalid email format'})

        if not code or len(code) != 6:
            return validation_error_response({'otp': 'OTP must be 6 digits'})

        # Verify OTP
        success, message = OTP.verify_otp(email, code, purpose)

        if not success:
            return error_response(message, 400)

        # If verification OTP, mark user as verified
        if purpose == 'verification':
            user = User.query.filter_by(email=email).first()
            if user:
                user.is_verified = True
                db.session.commit()

                # Send welcome email
                first_name = 'there'
                if user.customer_profile:
                    first_name = user.customer_profile.first_name
                elif user.supplier_profile:
                    first_name = user.supplier_profile.contact_person

                try:
                    send_welcome_email(email, first_name)
                except Exception as e:
                    current_app.logger.error(f'Failed to send welcome email: {str(e)}')

        # For password reset, return a reset token
        if purpose == 'password_reset':
            reset_token = secrets.token_urlsafe(32)
            # Store reset token temporarily (you could use Redis or DB)
            # For simplicity, we'll use a new OTP entry
            user = User.query.filter_by(email=email).first()
            if user:
                return success_response(
                    message='OTP verified. You can now reset your password.',
                    data={'reset_token': reset_token, 'email': email}
                )

        return success_response(
            message='Email verified successfully!',
            data={'verified': True}
        )

    except Exception as e:
        return error_response(f'Failed to verify OTP: {str(e)}', 500)


@auth_bp.route('/login', methods=['POST'])
@validate_required_fields(['email', 'password'])
def login():
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password =  data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return error_response('Invalid email or password', 401)
    
    if not user.is_active:
        return error_response('Account is deactivated. Please contact support.', 401)
    
    if user.role == UserRole.SUPPLIER and user.supplier_profile:
        if not user.supplier_profile.is_approved:
            return error_response('Your supplier account is pending approval. Please wait for admin approval.', 403)


    try:
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')

        expires_at = datetime.utcnow() + timedelta(minutes = 15)

        session = Session(
            user_id = user.id,
            token = access_token,
            refresh_token = refresh_token,
            ip_address = ip_address,
            user_agent = user_agent,
            expires_at = expires_at
        ) 
        user.last_login = datetime.utcnow()
        db.session.add(session)
        db.session.commit()

        return success_response(
            data = {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token-type': 'Bearer',
                'expires_in': 900, # 15 minutes in seconds
                'user': user.to_dict(include_profile=True) 
            },
            message='Login successful',
            status_code=200
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Login failed: {str(e)}', 500)
    
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        user_id = get_jwt_identity()

        user = User.query.get(user_id)
        if not user or not user.is_active:
            return error_response('User not found or inactive', 404)
        
        access_token = create_access_token(identity=user_id)

        session = Session.query.filter_by(user_id = user_id).order_by(Session.created_at.desc()).first()
        if session:
            session.token = access_token
            session.expires_at = datetime.utcnow() + timedelta(minutes = 15)
            db.session.commit()
        
        return success_response(
            data = {
                'access_token': access_token,
                'token-type': 'Bearer',
                'expires_in': 900, 
            },
            message = 'Token refreshed successfully',
            status_code = 200
        )
    except Exception as e:
        return error_response(f'Refresh failed: {str(e)}', 500)
    

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        return success_response(data=user.to_dict(include_profile=True))

    except Exception as e:
        return error_response(f'Failed to fetch user: {str(e)}', 500)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and invalidate session."""
    try:
        user_id = get_jwt_identity()
        jti = get_jwt()['jti']

        # Delete user's sessions
        Session.query.filter_by(user_id=user_id).delete()
        db.session.commit()

        return success_response(message='Logged out successfully')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Logout failed: {str(e)}', 500)


@auth_bp.route('/forgot-password', methods=['POST'])
@validate_required_fields(['email'])
def forgot_password():
    """Request password reset email."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not validate_email(email):
            return validation_error_response({'email': 'Invalid email format'})

        user = User.query.filter_by(email=email).first()

        # Always return success to prevent email enumeration
        if not user:
            return success_response(
                message='If an account with that email exists, we have sent a password reset link.'
            )

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)

        # Store in user (we'd need to add these fields, for now use session)
        # For MVP, we'll store token in a session entry
        session = Session(
            user_id=user.id,
            token=reset_token,
            refresh_token='password_reset',  # Mark as password reset token
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            expires_at=reset_expiry
        )
        db.session.add(session)
        db.session.commit()

        # Send reset email
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        reset_url = f'{frontend_url}/reset-password?token={reset_token}'

        text_body = f"""
        Hi,

        You requested a password reset for your Electronics Shop account.

        Click here to reset your password: {reset_url}

        This link will expire in 1 hour.

        If you didn't request this, please ignore this email.

        Thanks,
        Electronics Shop Team
        """

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                <h1>Password Reset</h1>
            </div>

            <div style="padding: 20px;">
                <p>Hi,</p>
                <p>You requested a password reset for your Electronics Shop account.</p>

                <div style="margin: 30px 0; text-align: center;">
                    <a href="{reset_url}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    This link will expire in 1 hour.
                </p>

                <p style="color: #6b7280; font-size: 14px;">
                    If you didn't request this, please ignore this email.
                </p>
            </div>

            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>&copy; 2026 Electronics Shop. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        send_email('Password Reset - Electronics Shop', email, text_body, html_body)

        return success_response(
            message='If an account with that email exists, we have sent a password reset link.'
        )

    except Exception as e:
        current_app.logger.error(f'Forgot password error: {str(e)}')
        return error_response(f'Failed to process request: {str(e)}', 500)


@auth_bp.route('/reset-password', methods=['POST'])
@validate_required_fields(['token', 'password'])
def reset_password():
    """Reset password with token."""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')

        # Validate password
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return validation_error_response({'password': message})

        # Find session with reset token
        session = Session.query.filter_by(
            token=token,
            refresh_token='password_reset'
        ).first()

        if not session:
            return error_response('Invalid or expired reset token', 400)

        if session.expires_at < datetime.now(timezone.utc):
            db.session.delete(session)
            db.session.commit()
            return error_response('Reset token has expired', 400)

        # Get user and update password
        user = User.query.get(session.user_id)
        if not user:
            return error_response('User not found', 404)

        user.set_password(new_password)

        # Delete the reset session
        db.session.delete(session)

        # Also delete all other sessions (force re-login)
        Session.query.filter_by(user_id=user.id).delete()

        db.session.commit()

        return success_response(message='Password reset successfully. Please login with your new password.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Password reset failed: {str(e)}', 500)


@auth_bp.route('/verify-email', methods=['POST'])
@validate_required_fields(['token'])
def verify_email():
    """Verify email address with token."""
    try:
        data = request.get_json()
        token = data.get('token')

        # Find session with verification token
        session = Session.query.filter_by(
            token=token,
            refresh_token='email_verification'
        ).first()

        if not session:
            return error_response('Invalid or expired verification token', 400)

        if session.expires_at < datetime.now(timezone.utc):
            db.session.delete(session)
            db.session.commit()
            return error_response('Verification token has expired', 400)

        # Get user and verify email
        user = User.query.get(session.user_id)
        if not user:
            return error_response('User not found', 404)

        user.is_verified = True

        # Delete the verification session
        db.session.delete(session)
        db.session.commit()

        return success_response(message='Email verified successfully.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Email verification failed: {str(e)}', 500)


@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
def resend_verification():
    """Resend email verification."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if user.is_verified:
            return error_response('Email is already verified', 400)

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        verification_expiry = datetime.now(timezone.utc) + timedelta(hours=24)

        # Store in session
        session = Session(
            user_id=user.id,
            token=verification_token,
            refresh_token='email_verification',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            expires_at=verification_expiry
        )
        db.session.add(session)
        db.session.commit()

        # Send verification email
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        verify_url = f'{frontend_url}/verify-email?token={verification_token}'

        text_body = f"""
        Hi,

        Please verify your email address for Electronics Shop.

        Click here to verify: {verify_url}

        This link will expire in 24 hours.

        Thanks,
        Electronics Shop Team
        """

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                <h1>Verify Your Email</h1>
            </div>

            <div style="padding: 20px;">
                <p>Hi,</p>
                <p>Please verify your email address to complete your registration.</p>

                <div style="margin: 30px 0; text-align: center;">
                    <a href="{verify_url}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Verify Email
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    This link will expire in 24 hours.
                </p>
            </div>

            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>&copy; 2026 Electronics Shop. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        send_email('Verify Your Email - Electronics Shop', user.email, text_body, html_body)

        return success_response(message='Verification email sent.')

    except Exception as e:
        return error_response(f'Failed to send verification email: {str(e)}', 500)


@auth_bp.route('/enable-2fa', methods=['POST'])
@jwt_required()
def enable_2fa():
    """Enable two-factor authentication."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if user.two_fa_enabled:
            return error_response('2FA is already enabled', 400)

        # Generate TOTP secret
        secret = pyotp.random_base32()
        user.two_fa_secret = secret

        # Generate provisioning URI for authenticator app
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name='Electronics Shop'
        )

        db.session.commit()

        return success_response(
            data={
                'secret': secret,
                'provisioning_uri': provisioning_uri
            },
            message='Scan the QR code with your authenticator app, then verify with a code.'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to enable 2FA: {str(e)}', 500)


@auth_bp.route('/verify-2fa', methods=['POST'])
@jwt_required()
@validate_required_fields(['code'])
def verify_2fa():
    """Verify 2FA code and enable 2FA."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        if not user:
            return error_response('User not found', 404)

        if not user.two_fa_secret:
            return error_response('Please enable 2FA first', 400)

        if user.two_fa_enabled:
            return error_response('2FA is already enabled', 400)

        code = data.get('code')
        totp = pyotp.TOTP(user.two_fa_secret)

        if not totp.verify(code):
            return error_response('Invalid verification code', 400)

        user.two_fa_enabled = True
        db.session.commit()

        return success_response(message='Two-factor authentication enabled successfully.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to verify 2FA: {str(e)}', 500)


@auth_bp.route('/disable-2fa', methods=['POST'])
@jwt_required()
@validate_required_fields(['code'])
def disable_2fa():
    """Disable two-factor authentication."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        if not user:
            return error_response('User not found', 404)

        if not user.two_fa_enabled:
            return error_response('2FA is not enabled', 400)

        code = data.get('code')
        totp = pyotp.TOTP(user.two_fa_secret)

        if not totp.verify(code):
            return error_response('Invalid verification code', 400)

        user.two_fa_enabled = False
        user.two_fa_secret = None
        db.session.commit()

        return success_response(message='Two-factor authentication disabled.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to disable 2FA: {str(e)}', 500)


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@validate_required_fields(['current_password', 'new_password'])
def change_password():
    """Change password for authenticated user."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        if not user:
            return error_response('User not found', 404)

        # Verify current password
        if not user.check_password(data['current_password']):
            return error_response('Current password is incorrect', 400)

        # Validate new password
        is_valid, message = validate_password(data['new_password'])
        if not is_valid:
            return validation_error_response({'new_password': message})

        # Check if new password is different
        if data['current_password'] == data['new_password']:
            return error_response('New password must be different from current password', 400)

        # Update password
        user.set_password(data['new_password'])

        # Invalidate all sessions except current
        current_token = get_jwt()['jti']
        # Delete all sessions for this user
        Session.query.filter_by(user_id=user.id).delete()

        db.session.commit()

        return success_response(message='Password changed successfully. Please login again.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to change password: {str(e)}', 500)


# ==================== Google OAuth Routes ====================

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """
    Initiate Google OAuth flow.
    Redirects user to Google's consent page.
    """
    if not google_oauth_service.is_configured():
        return error_response('Google OAuth is not configured', 501)

    result = google_oauth_service.get_authorization_url()

    if not result['success']:
        return error_response(result['error'], 500)

    # Store state in session for CSRF protection (using a simple approach)
    # In production, you might want to use server-side sessions
    return success_response(
        data={
            'authorization_url': result['authorization_url'],
            'state': result['state']
        },
        message='Redirect to the authorization URL to continue'
    )


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """
    Handle Google OAuth callback.
    Exchanges code for tokens and creates/logs in user.
    """
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    callback_url = f'{frontend_url}/auth/callback'

    current_app.logger.info(f'Google OAuth callback received - Code: {code is not None}, State: {state}, Error: {error}')

    # Handle OAuth errors from Google
    if error:
        current_app.logger.error(f'Google OAuth error: {error}')
        return redirect(f'{callback_url}?error={error}')

    if not code:
        current_app.logger.error('No authorization code received')
        return redirect(f'{callback_url}?error=no_code')

    # Exchange code for tokens
    current_app.logger.info('Exchanging authorization code for tokens')
    token_result = google_oauth_service.exchange_code_for_tokens(code)
    if not token_result['success']:
        current_app.logger.error(f'Token exchange failed: {token_result.get("error")}')
        return redirect(f'{callback_url}?error=token_exchange_failed')

    # Get user info
    current_app.logger.info('Fetching user info from Google')
    user_info = google_oauth_service.get_user_info(token_result['access_token'])
    if not user_info['success']:
        current_app.logger.error(f'Failed to get user info: {user_info.get("error")}')
        return redirect(f'{callback_url}?error=user_info_failed')

    current_app.logger.info(f'User info received: {user_info["email"]}')

    try:
        # Check if user exists by Google ID
        user = User.query.filter_by(google_id=user_info['google_id']).first()

        if not user:
            # Check if user exists by email
            user = User.query.filter_by(email=user_info['email']).first()

            if user:
                # Link Google account to existing user
                current_app.logger.info(f'Linking Google account to existing user: {user.email}')
                user.google_id = user_info['google_id']
                user.auth_provider = AuthProvider.GOOGLE
                if user_info.get('picture'):
                    user.profile_picture = user_info['picture']
                if user_info.get('email_verified'):
                    user.is_verified = True
            else:
                # Create new user
                current_app.logger.info(f'Creating new user: {user_info["email"]}')
                user = User(
                    email=user_info['email'],
                    role=UserRole.CUSTOMER,
                    auth_provider=AuthProvider.GOOGLE,
                    google_id=user_info['google_id'],
                    profile_picture=user_info.get('picture'),
                    is_verified=user_info.get('email_verified', False)
                )
                db.session.add(user)
                db.session.flush()  # Get user ID

                # Create customer profile
                profile = CustomerProfile(
                    user=user,
                    first_name=user_info.get('given_name', ''),
                    last_name=user_info.get('family_name', ''),
                    phone_number=''  # Will need to be updated later
                )
                db.session.add(profile)

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        current_app.logger.info(f'User authentication successful: {user.email}')

        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        # Create session
        session = Session(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()

        current_app.logger.info(f'OAuth flow completed successfully for user: {user.email}')

        # Redirect to frontend with tokens
        # Note: In production, consider using httpOnly cookies instead of URL params
        from urllib.parse import urlencode
        
        redirect_params = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': str(user.id),
            'success': 'true'
        }
        
        redirect_url = f'{callback_url}?{urlencode(redirect_params)}'
        
        current_app.logger.info(f'Redirecting to: {redirect_url}')
        return redirect(redirect_url)

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Google OAuth callback error: {str(e)}', exc_info=True)
        return redirect(f'{callback_url}?error=server_error')


@auth_bp.route('/google/token', methods=['POST'])
def google_token_auth():
    """
    Authenticate with Google ID token (for frontend-initiated auth).
    The frontend gets the ID token directly from Google Sign-In and sends it here.

    Expected payload:
    {
        "id_token": "google-id-token",
        "role": "customer"  // Optional, defaults to customer
    }
    """
    try:
        data = request.get_json()
        id_token = data.get('id_token')

        if not id_token:
            return error_response('ID token is required', 400)

        # Verify the ID token
        result = google_oauth_service.verify_id_token(id_token)
        if not result['success']:
            return error_response(result['error'], 401)

        # Check if user exists by Google ID
        user = User.query.filter_by(google_id=result['google_id']).first()

        if not user:
            # Check if user exists by email
            user = User.query.filter_by(email=result['email']).first()

            if user:
                # Link Google account to existing user
                user.google_id = result['google_id']
                user.auth_provider = AuthProvider.GOOGLE
                if result.get('picture'):
                    user.profile_picture = result['picture']
                if result.get('email_verified'):
                    user.is_verified = True
            else:
                # Create new user
                role = data.get('role', 'customer').lower()
                if role not in ['customer', 'supplier']:
                    role = 'customer'

                user = User(
                    email=result['email'],
                    role=UserRole.CUSTOMER if role == 'customer' else UserRole.SUPPLIER,
                    auth_provider=AuthProvider.GOOGLE,
                    google_id=result['google_id'],
                    profile_picture=result.get('picture'),
                    is_verified=result.get('email_verified', False)
                )
                db.session.add(user)
                db.session.flush()

                # Create profile based on role
                if role == 'customer':
                    profile = CustomerProfile(
                        user=user,
                        first_name=result.get('given_name', ''),
                        last_name=result.get('family_name', ''),
                        phone_number=''  # Will need to be updated later
                    )
                    db.session.add(profile)
                # Note: Supplier profile requires more info, handled separately

        # Update last login
        user.last_login = datetime.now(timezone.utc)

        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        # Create session
        session = Session(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()

        # Check if profile is incomplete
        profile_incomplete = False
        if user.role == UserRole.CUSTOMER and user.customer_profile:
            if not user.customer_profile.phone_number:
                profile_incomplete = True
        elif user.role == UserRole.SUPPLIER and not user.supplier_profile:
            profile_incomplete = True

        return success_response(
            data={
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict(include_profile=True),
                'profile_incomplete': profile_incomplete
            },
            message='Google authentication successful'
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Google token auth error: {str(e)}')
        return error_response(f'Authentication failed: {str(e)}', 500)


@auth_bp.route('/set-password', methods=['POST'])
@jwt_required()
@validate_required_fields(['password'])
def set_password():
    """
    Set password for OAuth users who don't have one.
    This allows OAuth users to also login with email/password.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        if not user:
            return error_response('User not found', 404)

        if user.has_password():
            return error_response('Password already set. Use change-password instead.', 400)

        # Validate password
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return validation_error_response({'password': message})

        # Set password
        user.set_password(data['password'])
        db.session.commit()

        return success_response(message='Password set successfully. You can now login with email and password.')

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to set password: {str(e)}', 500)


@auth_bp.route('/complete-profile', methods=['POST'])
@jwt_required()
def complete_profile():
    """
    Complete profile for OAuth users with incomplete profiles.

    Expected payload for customer:
    {
        "phone_number": "254XXXXXXXXX",
        "mpesa_number": "254XXXXXXXXX"  // Optional
    }

    Expected payload for supplier (if no profile exists):
    {
        "business_name": "...",
        "contact_person": "...",
        "phone_number": "254XXXXXXXXX",
        "mpesa_number": "254XXXXXXXXX",
        "payout_method": "phone"  // Optional
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        if not user:
            return error_response('User not found', 404)

        if user.role == UserRole.CUSTOMER:
            if not user.customer_profile:
                return error_response('Customer profile not found', 404)

            phone_number = data.get('phone_number', '').strip()
            if phone_number:
                if not validate_phone_number(phone_number):
                    return validation_error_response({'phone_number': 'Invalid phone number format'})
                user.customer_profile.phone_number = phone_number

            if data.get('mpesa_number'):
                mpesa_number = data['mpesa_number'].strip()
                if not validate_phone_number(mpesa_number):
                    return validation_error_response({'mpesa_number': 'Invalid M-Pesa number format'})
                user.customer_profile.mpesa_number = mpesa_number

            if data.get('first_name'):
                user.customer_profile.first_name = data['first_name'].strip()

            if data.get('last_name'):
                user.customer_profile.last_name = data['last_name'].strip()

        elif user.role == UserRole.SUPPLIER:
            if not user.supplier_profile:
                # Create supplier profile
                required_fields = ['business_name', 'contact_person', 'phone_number', 'mpesa_number']
                missing = [f for f in required_fields if not data.get(f)]
                if missing:
                    return validation_error_response({
                        'profile': f'Missing required fields: {", ".join(missing)}'
                    })

                phone_number = data['phone_number'].strip()
                mpesa_number = data['mpesa_number'].strip()

                if not validate_phone_number(phone_number):
                    return validation_error_response({'phone_number': 'Invalid phone number format'})
                if not validate_phone_number(mpesa_number):
                    return validation_error_response({'mpesa_number': 'Invalid M-Pesa number format'})

                profile = SupplierProfile(
                    user=user,
                    business_name=data['business_name'].strip(),
                    business_registration_number=data.get('business_registration_number', '').strip() or None,
                    contact_person=data['contact_person'].strip(),
                    phone_number=phone_number,
                    mpesa_number=mpesa_number,
                    payout_method=data.get('payout_method', 'phone').strip()
                )
                db.session.add(profile)
            else:
                # Update existing supplier profile
                if data.get('phone_number'):
                    phone_number = data['phone_number'].strip()
                    if not validate_phone_number(phone_number):
                        return validation_error_response({'phone_number': 'Invalid phone number format'})
                    user.supplier_profile.phone_number = phone_number

                if data.get('mpesa_number'):
                    mpesa_number = data['mpesa_number'].strip()
                    if not validate_phone_number(mpesa_number):
                        return validation_error_response({'mpesa_number': 'Invalid M-Pesa number format'})
                    user.supplier_profile.mpesa_number = mpesa_number

        db.session.commit()

        return success_response(
            data=user.to_dict(include_profile=True),
            message='Profile updated successfully'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update profile: {str(e)}', 500)

