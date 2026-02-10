#!/usr/bin/env python3
"""
Test script to verify M-Pesa callback URL accessibility and simulate callbacks.
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_callback_url_accessibility():
    """Test if the callback URL is accessible from the internet."""
    callback_url = os.getenv('MPESA_CALLBACK_URL')
    
    if not callback_url:
        print("❌ MPESA_CALLBACK_URL not set in .env file")
        return False
    
    print(f"📡 Testing callback URL: {callback_url}")
    
    try:
        # Try to reach the callback endpoint
        response = requests.get(callback_url.replace('/mpesa/callback', '/health'), timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Callback URL is accessible! Health check passed.")
            return True
        else:
            print(f"⚠️  Callback URL responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to callback URL. Is ngrok running?")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Callback URL timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing callback URL: {str(e)}")
        return False


def simulate_successful_callback(checkout_request_id):
    """Simulate a successful M-Pesa callback."""
    callback_url = os.getenv('MPESA_CALLBACK_URL')
    
    if not callback_url:
        print("❌ MPESA_CALLBACK_URL not set")
        return
    
    # Sample successful callback payload
    payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {
                            "Name": "Amount",
                            "Value": 1.00
                        },
                        {
                            "Name": "MpesaReceiptNumber",
                            "Value": "TEST123456"
                        },
                        {
                            "Name": "TransactionDate",
                            "Value": 20231201120000
                        },
                        {
                            "Name": "PhoneNumber",
                            "Value": 254712345678
                        }
                    ]
                }
            }
        }
    }
    
    print(f"\n📤 Simulating successful callback to: {callback_url}")
    print(f"   CheckoutRequestID: {checkout_request_id}")
    
    try:
        response = requests.post(callback_url, json=payload, timeout=10)
        print(f"✅ Callback sent! Response: {response.status_code}")
        print(f"   Response body: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Failed to send callback: {str(e)}")
        return False


def check_environment():
    """Check if all required M-Pesa environment variables are set."""
    required_vars = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_SHORTCODE',
        'MPESA_PASSKEY',
        'MPESA_CALLBACK_URL'
    ]
    
    print("\n🔍 Checking M-Pesa environment variables:")
    all_set = True
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'KEY' in var or 'SECRET' in var or 'PASS' in var:
                display_value = value[:8] + '...' if len(value) > 8 else '***'
            else:
                display_value = value
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: NOT SET")
            all_set = False
    
    return all_set


def main():
    print("=" * 60)
    print("M-PESA CALLBACK DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # Check environment variables
    if not check_environment():
        print("\n⚠️  Some environment variables are missing!")
        print("   Please check your .env file")
        return
    
    # Test callback URL accessibility
    print("\n" + "=" * 60)
    is_accessible = test_callback_url_accessibility()
    
    if not is_accessible:
        print("\n💡 TROUBLESHOOTING TIPS:")
        print("   1. Make sure ngrok is running: ngrok http 5000")
        print("   2. Update MPESA_CALLBACK_URL in .env with your ngrok URL")
        print("   3. Restart your Flask application")
        print("   4. If using sandbox, ensure your IP is whitelisted")
    
    # Ask if user wants to simulate a callback
    print("\n" + "=" * 60)
    print("Would you like to simulate a callback?")
    print("This will send a test callback to your local server.")
    
    if len(sys.argv) > 1:
        checkout_id = sys.argv[1]
        print(f"\nUsing CheckoutRequestID from argument: {checkout_id}")
        simulate_successful_callback(checkout_id)
    else:
        print("\nUsage: python test_mpesa_callback.py <CheckoutRequestID>")
        print("Example: python test_mpesa_callback.py ws_CO_01012024120000000712345678")


if __name__ == '__main__':
    main()
