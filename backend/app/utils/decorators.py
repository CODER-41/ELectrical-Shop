"""
Role-based access control decorators.
"""

from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User, UserRole
from app.utils.responses import error_response


def role_required(*allowed_roles):
    """
    Decorator factory for role-based access control.

    Usage:
        @role_required(UserRole.ADMIN, UserRole.FINANCE_ADMIN)
        def admin_only_route():
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return error_response('User not found', 404)

            if not user.is_active:
                return error_response('Account is deactivated', 403)

            if user.role not in allowed_roles:
                return error_response('You do not have permission to access this resource', 403)

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """
    Decorator for admin-only routes.
    Allows: ADMIN
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role != UserRole.ADMIN:
            return error_response('Admin access required', 403)

        return fn(*args, **kwargs)
    return wrapper


def admin_or_manager_required(fn):
    """
    Decorator for admin and manager routes.
    Allows: ADMIN, PRODUCT_MANAGER, FINANCE_ADMIN, SUPPORT_ADMIN
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        admin_roles = [
            UserRole.ADMIN,
            UserRole.PRODUCT_MANAGER,
            UserRole.FINANCE_ADMIN,
            UserRole.SUPPORT_ADMIN
        ]

        if user.role not in admin_roles:
            return error_response('Admin or manager access required', 403)

        return fn(*args, **kwargs)
    return wrapper


def supplier_required(fn):
    """
    Decorator for supplier-only routes.
    Allows: SUPPLIER (must be approved)
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role != UserRole.SUPPLIER:
            return error_response('Supplier access required', 403)

        if not user.supplier_profile or not user.supplier_profile.is_approved:
            return error_response('Supplier account not approved', 403)

        return fn(*args, **kwargs)
    return wrapper


def supplier_or_admin_required(fn):
    """
    Decorator for routes accessible by suppliers and admins.
    Allows: SUPPLIER (approved), ADMIN, PRODUCT_MANAGER
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        admin_roles = [UserRole.ADMIN, UserRole.PRODUCT_MANAGER]

        if user.role == UserRole.SUPPLIER:
            if not user.supplier_profile or not user.supplier_profile.is_approved:
                return error_response('Supplier account not approved', 403)
            return fn(*args, **kwargs)

        if user.role in admin_roles:
            return fn(*args, **kwargs)

        return error_response('Supplier or admin access required', 403)
    return wrapper


def customer_required(fn):
    """
    Decorator for customer-only routes.
    Allows: CUSTOMER
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role != UserRole.CUSTOMER:
            return error_response('Customer access required', 403)

        return fn(*args, **kwargs)
    return wrapper


def verified_required(fn):
    """
    Decorator for routes requiring email verification.
    Can be combined with other decorators.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_verified:
            return error_response('Email verification required', 403)

        return fn(*args, **kwargs)
    return wrapper


def finance_admin_required(fn):
    """
    Decorator for finance admin routes.
    Allows: ADMIN, FINANCE_ADMIN
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role not in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]:
            return error_response('Finance admin access required', 403)

        return fn(*args, **kwargs)
    return wrapper


def support_admin_required(fn):
    """
    Decorator for support admin routes.
    Allows: ADMIN, SUPPORT_ADMIN
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role not in [UserRole.ADMIN, UserRole.SUPPORT_ADMIN]:
            return error_response('Support admin access required', 403)

        return fn(*args, **kwargs)
    return wrapper


def product_manager_required(fn):
    """
    Decorator for product manager routes.
    Allows: ADMIN, PRODUCT_MANAGER
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if not user.is_active:
            return error_response('Account is deactivated', 403)

        if user.role not in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER]:
            return error_response('Product manager access required', 403)

        return fn(*args, **kwargs)
    return wrapper
