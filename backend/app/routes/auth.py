
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