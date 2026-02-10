#!/usr/bin/env python3
"""
Script to fix supplier profiles by adding missing columns to existing records.
"""

from app import create_app
from app.models import db
from app.models.user import SupplierProfile, PaymentPhoneChangeStatus
from decimal import Decimal

app = create_app()

with app.app_context():
    print("Fixing supplier profiles...")
    
    # Get all supplier profiles
    suppliers = SupplierProfile.query.all()
    print(f"Found {len(suppliers)} supplier profiles")
    
    for supplier in suppliers:
        # Set default values for new columns if they are None
        if supplier.payment_phone_pending is None:
            supplier.payment_phone_pending = None
        if supplier.payment_phone_change_status is None:
            supplier.payment_phone_change_status = None
        if supplier.payment_phone_change_requested_at is None:
            supplier.payment_phone_change_requested_at = None   5555
        if supplier.payment_phone_change_reviewed_at is None:
            supplier.payment_phone_change_reviewed_at = None
        if supplier.payment_phone_change_reviewed_by is None:
            supplier.payment_phone_change_reviewed_by = None
        if supplier.payment_phone_change_reason is None:
            supplier.payment_phone_change_reason = None
        
        print(f"  Fixed: {supplier.business_name}")
    
    db.session.commit()
    print("Supplier profiles fixed successfully!")