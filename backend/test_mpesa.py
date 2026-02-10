#!/usr/bin/env python3
"""
Test M-Pesa Daraja API integration
"""

from app import create_app
from app.services.mpesa_service import mpesa_service

app = create_app()

with app.app_context():
    print("=" * 50)
    print("Testing M-Pesa Daraja Integration")
    print("=" * 50)
    
    # Test 1: Get Access Token
    print("\n1. Testing Access Token...")
    try:
        token = mpesa_service.get_access_token()
        print(f"✓ Access Token: {token[:20]}...")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Validate Phone Number
    print("\n2. Testing Phone Validation...")
    test_phones = ['0712345678', '254712345678', '712345678']
    for phone in test_phones:
        is_valid, result = mpesa_service.validate_phone_number(phone)
        status = "✓" if is_valid else "✗"
        print(f"{status} {phone} -> {result}")
    
    # Test 3: STK Push (Uncomment to test with real phone)
    print("\n3. STK Push Test (commented out)")
    print("   To test, uncomment lines below and use your phone number")
    
    # Uncomment to test real STK Push
    # try:
    #     result = mpesa_service.initiate_stk_push(
    #         phone_number='254712345678',  # Replace with your number
    #         amount=1,  # Test with 1 KES
    #         account_reference='TEST001',
    #         transaction_desc='Test payment'
    #     )
    #     print(f"✓ STK Push Result: {result}")
    # except Exception as e:
    #     print(f"✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Test Complete!")
    print("=" * 50)
