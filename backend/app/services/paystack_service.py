"""
Paystack payment service for card payments.
"""

import os
import requests
from flask import current_app


class PaystackService:
    """Service for handling Paystack payments."""
    
    def __init__(self):
        self.secret_key = os.getenv('PAYSTACK_SECRET_KEY')
        self.public_key = os.getenv('PAYSTACK_PUBLIC_KEY')
        self.base_url = 'https://api.paystack.co'
        
    def is_configured(self):
        """Check if Paystack is properly configured."""
        return bool(self.secret_key and self.public_key)
    
    def _get_headers(self):
        """Get authorization headers for Paystack API."""
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def initialize_transaction(self, email, amount, reference, callback_url=None, metadata=None):
        """
        Initialize a Paystack transaction.
        
        Args:
            email: Customer email
            amount: Amount in kobo (multiply KES by 100)
            reference: Unique transaction reference
            callback_url: URL to redirect to after payment
            metadata: Dictionary of metadata to attach to the transaction
        
        Returns:
            dict: Transaction details or error
        """
        try:
            if not self.is_configured():
                return {
                    'success': False,
                    'error': 'Paystack is not configured'
                }
            
            # Convert amount to kobo (Paystack uses smallest currency unit)
            amount_kobo = int(float(amount) * 100)
            
            payload = {
                'email': email,
                'amount': amount_kobo,
                'reference': reference,
                'currency': 'KES',
                'metadata': metadata or {}
            }
            
            # Add callback URL if provided
            if callback_url:
                payload['callback_url'] = callback_url
            
            response = requests.post(
                f'{self.base_url}/transaction/initialize',
                json=payload,
                headers=self._get_headers(),
                timeout=30
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('status'):
                return {
                    'success': True,
                    'authorization_url': data['data']['authorization_url'],
                    'access_code': data['data']['access_code'],
                    'reference': data['data']['reference']
                }
            else:
                return {
                    'success': False,
                    'error': data.get('message', 'Failed to initialize transaction')
                }
        
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f'Paystack API request error: {str(e)}')
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            current_app.logger.error(f'Paystack initialization error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_transaction(self, reference):
        """
        Verify a Paystack transaction.
        
        Args:
            reference: Transaction reference
        
        Returns:
            dict: Verification result
        """
        try:
            response = requests.get(
                f'{self.base_url}/transaction/verify/{reference}',
                headers=self._get_headers(),
                timeout=30
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('status'):
                transaction_data = data['data']
                return {
                    'success': True,
                    'status': transaction_data['status'],
                    'reference': transaction_data['reference'],
                    'amount': transaction_data['amount'] / 100,  # Convert back to main currency
                    'currency': transaction_data['currency'],
                    'paid_at': transaction_data.get('paid_at'),
                    'metadata': transaction_data.get('metadata', {})
                }
            else:
                return {
                    'success': False,
                    'error': data.get('message', 'Verification failed')
                }
        
        except Exception as e:
            current_app.logger.error(f'Paystack verification error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_refund(self, reference, amount=None, merchant_note=None):
        """
        Create a refund for a transaction.
        
        Args:
            reference: Transaction reference
            amount: Amount to refund in main currency unit (KES). If None, refunds full amount
            merchant_note: Note about the refund
        
        Returns:
            dict: Refund details or error
        """
        try:
            payload = {
                'transaction': reference
            }
            
            if amount:
                payload['amount'] = int(float(amount) * 100)  # Convert to kobo
            
            if merchant_note:
                payload['merchant_note'] = merchant_note
            
            response = requests.post(
                f'{self.base_url}/refund',
                json=payload,
                headers=self._get_headers(),
                timeout=30
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('status'):
                refund_data = data['data']
                return {
                    'success': True,
                    'refund_id': refund_data['id'],
                    'transaction': refund_data['transaction'],
                    'amount': refund_data['amount'] / 100,
                    'currency': refund_data['currency'],
                    'status': refund_data['status']
                }
            else:
                return {
                    'success': False,
                    'error': data.get('message', 'Refund failed')
                }
        
        except Exception as e:
            current_app.logger.error(f'Paystack refund error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_public_key(self):
        """Get Paystack public key for frontend."""
        return self.public_key


# Global instance
paystack_service = PaystackService()
