#!/usr/bin/env python3
"""Test M-Pesa STK Push payment"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000/api"
ORDER_ID = "364b745e-68fb-42fb-9a05-d5868e7a1723"
PHONE_NUMBER = "254708374149"

# You need a valid JWT token - login first
def login():
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "simeonjoro@gmail.com",  # Your email
        "password": "your_password"  # Your password
    })
    if response.status_code == 200:
        return response.json()['data']['access_token']
    else:
        print(f"Login failed: {response.text}")
        return None

def initiate_mpesa_payment(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "order_id": ORDER_ID,
        "phone_number": PHONE_NUMBER
    }
    
    print(f"\n🚀 Initiating M-Pesa payment...")
    print(f"Order ID: {ORDER_ID}")
    print(f"Phone: {PHONE_NUMBER}")
    
    response = requests.post(
        f"{BASE_URL}/payments/mpesa/initiate",
        json=payload,
        headers=headers
    )
    
    print(f"\n📱 Response Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()

def check_payment_status(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/payments/status/{ORDER_ID}",
        headers=headers
    )
    
    print(f"\n✅ Payment Status: {response.status_code}")
    print(f"Status: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    print("=" * 60)
    print("M-PESA PAYMENT TEST - SANDBOX MODE")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1️⃣ Logging in...")
    token = login()
    
    if not token:
        print("❌ Cannot proceed without token")
        exit(1)
    
    print("✅ Login successful")
    
    # Step 2: Initiate payment
    print("\n2️⃣ Initiating M-Pesa payment...")
    result = initiate_mpesa_payment(token)
    
    # Step 3: Check status
    print("\n3️⃣ Checking payment status...")
    check_payment_status(token)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
