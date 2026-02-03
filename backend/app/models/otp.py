"""
OTP model for email verification and password reset.
"""

import uuid
import random
import string
from datetime import datetime, timedelta
from app.models import db


class OTP(db.Model):
    """OTP model for storing verification codes."""

    __tablename__ = 'otps'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)  # verification, password_reset
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @staticmethod
    def generate_code():
        """Generate a 6-digit OTP code."""
        return ''.join(random.choices(string.digits, k=6))

    @classmethod
    def create_otp(cls, email, purpose='verification', expiry_minutes=10):
        """Create a new OTP for the given email."""
        # Invalidate any existing OTPs for this email and purpose
        cls.query.filter_by(
            email=email.lower(),
            purpose=purpose,
            is_used=False
        ).update({'is_used': True})

        # Create new OTP
        otp = cls(
            email=email.lower(),
            code=cls.generate_code(),
            purpose=purpose,
            expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes)
        )

        db.session.add(otp)
        db.session.commit()

        return otp

    @classmethod
    def verify_otp(cls, email, code, purpose='verification'):
        """
        Verify an OTP code.
        Returns: (success: bool, message: str)
        """
        otp = cls.query.filter_by(
            email=email.lower(),
            purpose=purpose,
            is_used=False
        ).order_by(cls.created_at.desc()).first()

        if not otp:
            return False, 'No OTP found. Please request a new one.'

        # Check if expired
        if datetime.utcnow() > otp.expires_at:
            otp.is_used = True
            db.session.commit()
            return False, 'OTP has expired. Please request a new one.'

        # Check attempts (max 5)
        if otp.attempts >= 5:
            otp.is_used = True
            db.session.commit()
            return False, 'Too many failed attempts. Please request a new OTP.'

        # Verify code
        if otp.code != code:
            otp.attempts += 1
            db.session.commit()
            remaining = 5 - otp.attempts
            return False, f'Invalid OTP. {remaining} attempts remaining.'

        # Success - mark as used
        otp.is_used = True
        db.session.commit()

        return True, 'OTP verified successfully.'

    @classmethod
    def cleanup_expired(cls):
        """Remove expired OTPs (call periodically)."""
        cls.query.filter(
            cls.expires_at < datetime.utcnow()
        ).delete()
        db.session.commit()

    def to_dict(self):
        """Convert to dictionary (for debugging, never expose code)."""
        return {
            'id': self.id,
            'email': self.email,
            'purpose': self.purpose,
            'is_used': self.is_used,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
