"""
Google OAuth service for authentication.
"""

import os
import requests
from flask import current_app


class GoogleOAuthService:
    """Service for Google OAuth authentication."""

    # Google OAuth endpoints
    GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
    GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

    # Required scopes
    SCOPES = [
        'openid',
        'email',
        'profile'
    ]

    @staticmethod
    def get_client_id():
        """Get Google OAuth client ID."""
        return os.getenv('GOOGLE_CLIENT_ID')

    @staticmethod
    def get_client_secret():
        """Get Google OAuth client secret."""
        return os.getenv('GOOGLE_CLIENT_SECRET')

    @staticmethod
    def get_redirect_uri():
        """Get OAuth redirect URI."""
        backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
        return f'{backend_url}/api/auth/google/callback'

    @classmethod
    def is_configured(cls):
        """Check if Google OAuth is properly configured."""
        return bool(cls.get_client_id() and cls.get_client_secret())

    @classmethod
    def get_authorization_url(cls, state=None):
        """
        Generate Google OAuth authorization URL.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            dict with authorization URL and state
        """
        if not cls.is_configured():
            return {
                'success': False,
                'error': 'Google OAuth is not configured'
            }

        import secrets
        state = state or secrets.token_urlsafe(32)

        params = {
            'client_id': cls.get_client_id(),
            'redirect_uri': cls.get_redirect_uri(),
            'response_type': 'code',
            'scope': ' '.join(cls.SCOPES),
            'access_type': 'offline',
            'state': state,
            'prompt': 'select_account'  # Always show account picker
        }

        # Build URL
        query_string = '&'.join(f'{k}={v}' for k, v in params.items())
        auth_url = f'{cls.GOOGLE_AUTH_URL}?{query_string}'

        return {
            'success': True,
            'authorization_url': auth_url,
            'state': state
        }

    @classmethod
    def exchange_code_for_tokens(cls, code):
        """
        Exchange authorization code for access tokens.

        Args:
            code: Authorization code from Google

        Returns:
            dict with tokens or error
        """
        if not cls.is_configured():
            return {
                'success': False,
                'error': 'Google OAuth is not configured'
            }

        try:
            response = requests.post(
                cls.GOOGLE_TOKEN_URL,
                data={
                    'client_id': cls.get_client_id(),
                    'client_secret': cls.get_client_secret(),
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': cls.get_redirect_uri()
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )

            if response.status_code != 200:
                current_app.logger.error(f'Google token exchange failed: {response.text}')
                return {
                    'success': False,
                    'error': 'Failed to exchange authorization code'
                }

            tokens = response.json()
            return {
                'success': True,
                'access_token': tokens.get('access_token'),
                'refresh_token': tokens.get('refresh_token'),
                'id_token': tokens.get('id_token'),
                'expires_in': tokens.get('expires_in')
            }

        except Exception as e:
            current_app.logger.error(f'Google token exchange error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }

    @classmethod
    def get_user_info(cls, access_token):
        """
        Get user info from Google using access token.

        Args:
            access_token: Google OAuth access token

        Returns:
            dict with user info or error
        """
        try:
            response = requests.get(
                cls.GOOGLE_USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'}
            )

            if response.status_code != 200:
                current_app.logger.error(f'Google userinfo failed: {response.text}')
                return {
                    'success': False,
                    'error': 'Failed to get user info from Google'
                }

            user_info = response.json()
            return {
                'success': True,
                'google_id': user_info.get('id'),
                'email': user_info.get('email'),
                'email_verified': user_info.get('verified_email', False),
                'name': user_info.get('name'),
                'given_name': user_info.get('given_name'),
                'family_name': user_info.get('family_name'),
                'picture': user_info.get('picture')
            }

        except Exception as e:
            current_app.logger.error(f'Google userinfo error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }

    @classmethod
    def verify_id_token(cls, id_token):
        """
        Verify Google ID token (for frontend direct auth).

        Args:
            id_token: Google ID token from frontend

        Returns:
            dict with user info or error
        """
        try:
            # Verify token with Google's tokeninfo endpoint
            response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}'
            )

            if response.status_code != 200:
                return {
                    'success': False,
                    'error': 'Invalid ID token'
                }

            token_info = response.json()

            # Verify the token was issued for our app
            if token_info.get('aud') != cls.get_client_id():
                return {
                    'success': False,
                    'error': 'Token was not issued for this application'
                }

            return {
                'success': True,
                'google_id': token_info.get('sub'),
                'email': token_info.get('email'),
                'email_verified': token_info.get('email_verified') == 'true',
                'name': token_info.get('name'),
                'given_name': token_info.get('given_name'),
                'family_name': token_info.get('family_name'),
                'picture': token_info.get('picture')
            }

        except Exception as e:
            current_app.logger.error(f'Google token verification error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }


# Initialize service instance
google_oauth_service = GoogleOAuthService()
