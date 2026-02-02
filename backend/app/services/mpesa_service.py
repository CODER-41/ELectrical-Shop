import os
import base64
import requests
from datetime import datetime
from flask import current_app


class MPesaService:
    """M-Pesa Daraja API Service for STK Push payments."""
    
    def __init__(self):
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.business_short_code = os.getenv('MPESA_SHORTCODE')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.callback_url = os.getenv('MPESA_CALLBACK_URL')
        
        # API URLs (use sandbox for testing, production for live)
        self.environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
        
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
        
        self.access_token = None
        self.access_token_expiry = None
    
    def get_access_token(self):
        """Get OAuth access token from M-Pesa API."""
        try:
            # Check if we have a valid cached token
            if self.access_token and self.access_token_expiry:
                if datetime.utcnow() < self.access_token_expiry:
                    return self.access_token
            
            url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
            
            # Create basic auth header
            credentials = f'{self.consumer_key}:{self.consumer_secret}'
            encoded = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            
            # Token expires in 3599 seconds, cache for 3500 seconds to be safe
            from datetime import timedelta
            self.access_token_expiry = datetime.utcnow() + timedelta(seconds=3500)
            
            return self.access_token
        except Exception as e:
            current_app.logger.error(f'M-Pesa auth error: {str(e)}')
            raise Exception(f'Failed to get M-Pesa access token: {str(e)}')
    
    def generate_password(self, timestamp):
        """Generate password for STK Push request."""
        data = f'{self.business_short_code}{self.passkey}{timestamp}'
        encoded = base64.b64encode(data.encode()).decode()
        return encoded
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push payment request.
        
        Args:
            phone_number: Customer phone number (254XXXXXXXXX format)
            amount: Amount to charge
            account_reference: Order number or reference
            transaction_desc: Description of transaction
        
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            # Get access token
            access_token = self.get_access_token()
            
            # Generate timestamp and password
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            # Format phone number (remove leading 0 if present, add 254)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            # Prepare request
            url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),  # Must be integer
                'PartyA': phone_number,  # Customer phone number
                'PartyB': self.business_short_code,  # Business short code
                'PhoneNumber': phone_number,  # Phone to receive prompt
                'CallBackURL': self.callback_url,
                'AccountReference': account_reference,  # Order number
                'TransactionDesc': transaction_desc  # Description
            }
            
            current_app.logger.info(f'Initiating STK Push for {phone_number}, amount {amount}')
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            current_app.logger.info(f'STK Push response: {data}')
            
            return {
                'success': data.get('ResponseCode') == '0',
                'merchant_request_id': data.get('MerchantRequestID'),
                'checkout_request_id': data.get('CheckoutRequestID'),
                'response_code': data.get('ResponseCode'),
                'response_description': data.get('ResponseDescription'),
                'customer_message': data.get('CustomerMessage')
            }
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f'M-Pesa API error: {str(e)}')
            if hasattr(e, 'response') and e.response is not None:
                current_app.logger.error(f'Response: {e.response.text}')
            raise Exception(f'M-Pesa payment initiation failed: {str(e)}')
        except Exception as e:
            current_app.logger.error(f'STK Push error: {str(e)}')
            raise Exception(f'Payment initiation failed: {str(e)}')
    
    def query_stk_push_status(self, checkout_request_id):
        """
        Query the status of an STK Push transaction.
        
        Args:
            checkout_request_id: The CheckoutRequestID from initiate_stk_push
        
        Returns:
            dict: Transaction status
        """
        try:
            access_token = self.get_access_token()
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            url = f'{self.base_url}/mpesa/stkpushquery/v1/query'
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': data.get('ResponseCode') == '0',
                'result_code': data.get('ResultCode'),
                'result_desc': data.get('ResultDesc'),
                'merchant_request_id': data.get('MerchantRequestID'),
                'checkout_request_id': data.get('CheckoutRequestID')
            }
        except Exception as e:
            current_app.logger.error(f'STK Push query error: {str(e)}')
            raise Exception(f'Failed to query payment status: {str(e)}')
    
    @staticmethod
    def format_phone_number(phone_number):
        """Format phone number to 254XXXXXXXXX format."""
        # Remove any spaces, hyphens, or plus signs
        phone = phone_number.replace(' ', '').replace('-', '').replace('+', '')
        
        # Remove leading zero if present
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif not phone.startswith('254'):
            phone = '254' + phone
        
        return phone
    
    @staticmethod
    def validate_phone_number(phone_number):
        """Validate Kenyan phone number format."""
        formatted = MPesaService.format_phone_number(phone_number)
        
        # Should be 12 digits starting with 254
        if len(formatted) != 12:
            return False, 'Phone number must be 9 digits after 0'
        
        if not formatted.startswith('254'):
            return False, 'Phone number must be a Kenyan number'
        
        # Check if valid Kenyan operator prefix
        valid_prefixes = ['2547', '2541', '2542']  # Safaricom, Airtel, Telkom
        if not any(formatted.startswith(prefix) for prefix in valid_prefixes):
            return False, 'Invalid phone number prefix'
        
        return True, formatted


# Initialize service
mpesa_service = MPesaService()
