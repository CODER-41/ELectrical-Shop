#!/usr/bin/env python3
"""
Simple M-Pesa STK Push Test
Tests M-Pesa integration directly without needing to login
"""

import sys
sys.path.insert(0, '/home/simon/ELectrical-Shop/backend')

from app.services.mpesa_service import mpesa_service

print("=" * 60)
print("M-PESA STK PUSH TEST - SANDBOX")
print("=" * 60)

# Test 1: Get Access Token
print("\n1️⃣ Testing Access Token...")
token = mpesa_service.get_access_token()
if token:
    print(f"✅ Access Token: {token[:20]}...")
else:
    print("❌ Failed to get access token")
    exit(1)

# Test 2: Validate Phone Number
print("\n2️⃣ Testing Phone Validation...")
phone = "254708374149"
is_valid, formatted = mpesa_service.validate_phone_number(phone)
print(f"Phone: {phone}")
print(f"Valid: {is_valid}")
print(f"Formatted: {formatted}")

# Test 3: Initiate STK Push
print("\n3️⃣ Initiating STK Push...")
result = mpesa_service.initiate_stk_push(
    phone_number="254708374149",
    amount=1.0,
    account_reference="TEST001",
    transaction_desc="Test Payment"
)

print("\n📱 STK Push Result:")
print(f"Success: {result.get('success')}")
if result.get('success'):
    print(f"✅ Checkout Request ID: {result.get('checkout_request_id')}")
    print(f"✅ Merchant Request ID: {result.get('merchant_request_id')}")
    print(f"✅ Message: {result.get('customer_message')}")
    
    print("\n⏱️  Waiting for callback...")
    print("Check your backend logs for callback in ~30 seconds")
    print("Or check ngrok dashboard at: http://127.0.0.1:4040")
else:
    print(f"❌ Error: {result.get('error')}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
