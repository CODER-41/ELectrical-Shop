"""Maintenance mode middleware."""
from functools import wraps
from flask import jsonify, request
from app.models.settings import SystemSettings


def check_maintenance_mode():
    """Check if maintenance mode is enabled."""
    return SystemSettings.get_setting('maintenance_mode', default=False)


def maintenance_mode_check(f):
    """Decorator to block access during maintenance mode (except for admins)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip check for admin routes
        if request.path.startswith('/api/admin') or request.path.startswith('/api/auth/login'):
            return f(*args, **kwargs)
        
        # Check maintenance mode
        if check_maintenance_mode():
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            from app.models.user import User
            
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    user = User.query.get(user_id)
                    if user and user.role == 'admin':
                        return f(*args, **kwargs)
            except:
                pass
            
            return jsonify({
                'success': False,
                'error': 'System is under maintenance. Please try again later.',
                'maintenance_mode': True
            }), 503
        
        return f(*args, **kwargs)
    
    return decorated_function
