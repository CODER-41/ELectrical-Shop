"""
M-Pesa STK Push Integration Service

This service handles M-Pesa Daraja API integration for STK Push payments.
"""

import os
import base64
import requests
from datetime import datetime
from flask import current_app


class MPesaService:
    """M-Pesa Daraja API service for STK Push."""
    
    def __init__(self):
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.business_shortcode = os.getenv('MPESA_SHORTCODE')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.callback_url = os.getenv('MPESA_CALLBACK_URL')
        
        # API URLs
        self.environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
        if self.environment == 'production':
            self.auth_url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            self.stk_push_url = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        else:
            self.auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            self.stk_push_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    
    def get_access_token(self):
        """Get OAuth access token from M-Pesa API."""
        try:
            # Create basic auth string
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_base64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_base64}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(self.auth_url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('access_token')
        except Exception as e:
            current_app.logger.error(f"M-Pesa auth error: {str(e)}")
            raise Exception(f"Failed to get M-Pesa access token: {str(e)}")
    
    def generate_password(self, timestamp):
        """Generate M-Pesa API password."""
        data_to_encode = f"{self.business_shortcode}{self.passkey}{timestamp}"
        encoded = base64.b64encode(data_to_encode.encode()).decode('utf-8')
        return encoded
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push to customer's phone.
        
        Args:
            phone_number (str): Customer phone number (format: 254XXXXXXXXX)
            amount (float): Amount to charge
            account_reference (str): Order number or reference
            transaction_desc (str): Transaction description
            
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            # Get access token
            access_token = self.get_access_token()
            
            # Generate timestamp and password
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            # Format phone number (ensure it starts with 254)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif phone_number.startswith('+'):
                phone_number = phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            # Prepare request payload
            payload = {
                'BusinessShortCode': self.business_shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.business_shortcode,
                'PhoneNumber': phone_number,
                'CallBackURL': self.callback_url,
                'AccountReference': account_reference,
                'TransactionDesc': transaction_desc
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make API request
            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Log response
            current_app.logger.info(f"M-Pesa STK Push initiated: {data}")
            
            return {
                'success': True,
                'checkout_request_id': data.get('CheckoutRequestID'),
                'merchant_request_id': data.get('MerchantRequestID'),
                'response_code': data.get('ResponseCode'),
                'response_description': data.get('ResponseDescription'),
                'customer_message': data.get('CustomerMessage')
            }
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"M-Pesa API request error: {str(e)}")
            return {
                'success': False,
                'error': f"M-Pesa request failed: {str(e)}"
            }
        except Exception as e:
            current_app.logger.error(f"M-Pesa STK Push error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def query_stk_status(self, checkout_request_id):
        """
        Query STK Push transaction status.
        
        Args:
            checkout_request_id (str): CheckoutRequestID from STK Push
            
        Returns:
            dict: Transaction status
        """
        try:
            access_token = self.get_access_token()
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            query_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query' if self.environment == 'sandbox' else 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            
            payload = {
                'BusinessShortCode': self.business_shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(query_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            current_app.logger.error(f"M-Pesa query error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Test configuration helper
def validate_mpesa_config():
    """Validate M-Pesa configuration."""
    required_vars = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_SHORTCODE',
        'MPESA_PASSKEY',
        'MPESA_CALLBACK_URL'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        return {
            'configured': False,
            'missing': missing,
            'message': f"Missing M-Pesa configuration: {', '.join(missing)}"
        }
    
    return {
        'configured': True,
        'environment': os.getenv('MPESA_ENVIRONMENT', 'sandbox'),
        'message': 'M-Pesa configuration is valid'
    }
