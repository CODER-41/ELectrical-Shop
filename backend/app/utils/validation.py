import re
from functools import wraps
from flask import request, jsonify


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone_number(phone):
    """Validate Kenyan phone number format."""

    pattern = r'^(\+?254|0)[17]\d{8}$'
    return re.match(pattern, phone) is not None


def validate_password(password):
    """
    Validate password strength.
    Requirements: 
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    return True, "Password is valid"


def validate_required_fields(required_fields):
    """Decorator to validate required fields in request JSON."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            data = request.get_json()
            missing_fields = [
                field for field in required_fields if field not in data or not data[field]]

            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400

            return f(*args, **kwargs)
        return decorated_function
    return decorator
