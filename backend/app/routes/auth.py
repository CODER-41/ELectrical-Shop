
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.models import db
from app.models.user import User, UserRole, CustomerProfile, SupplierProfile
from app.models.session import Session
from app.utils.validation import (
    validate_email,
    validate_phone_number,
    validate_password,
    validate_required_fields
)
from app.utils.responses import success_response, error_response, validation_error_response

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

        return success_response(
            data = user.to_dict(include_profile=True),
            message=f'{role.capitalize()} registered successfully. Please verify your email.',
            status_code=201
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Registration failed: {str(e)}', 500)
