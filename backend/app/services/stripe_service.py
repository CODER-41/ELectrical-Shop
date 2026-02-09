"""
Stripe payment service for card payments.
"""

import os
import stripe
from flask import current_app

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


class StripeService:
    """Service for handling Stripe payments."""
    
    def __init__(self):
        self.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        if self.api_key:
            stripe.api_key = self.api_key
    
    def is_configured(self):
        """Check if Stripe is properly configured."""
        return bool(self.api_key and self.publishable_key)
    
    def create_payment_intent(self, amount, currency='kes', metadata=None):
        """
        Create a Stripe Payment Intent.
        
        Args:
            amount: Amount in smallest currency unit (cents for USD, cents for KES)
            currency: Currency code (default: 'kes' for Kenyan Shillings)
            metadata: Dictionary of metadata to attach to the payment
        
        Returns:
            dict: Payment intent details or error
        """
        try:
            if not self.is_configured():
                return {
                    'success': False,
                    'error': 'Stripe is not configured'
                }
            
            # Convert amount to cents (Stripe uses smallest currency unit)
            amount_cents = int(float(amount) * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                metadata=metadata or {},
                automatic_payment_methods={'enabled': True}
            )
            
            return {
                'success': True,
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency,
                'status': payment_intent.status
            }
        
        except stripe.error.CardError as e:
            return {
                'success': False,
                'error': f'Card error: {e.user_message}'
            }
        except stripe.error.InvalidRequestError as e:
            return {
                'success': False,
                'error': f'Invalid request: {str(e)}'
            }
        except Exception as e:
            current_app.logger.error(f'Stripe payment intent error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def retrieve_payment_intent(self, payment_intent_id):
        """
        Retrieve a payment intent by ID.
        
        Args:
            payment_intent_id: Stripe payment intent ID
        
        Returns:
            dict: Payment intent details or error
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'amount': payment_intent.amount / 100,  # Convert back to main currency unit
                'currency': payment_intent.currency,
                'status': payment_intent.status,
                'metadata': payment_intent.metadata
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def confirm_payment_intent(self, payment_intent_id):
        """
        Confirm a payment intent.
        
        Args:
            payment_intent_id: Stripe payment intent ID
        
        Returns:
            dict: Confirmation result
        """
        try:
            payment_intent = stripe.PaymentIntent.confirm(payment_intent_id)
            
            return {
                'success': True,
                'status': payment_intent.status,
                'payment_intent_id': payment_intent.id
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_payment_intent(self, payment_intent_id):
        """
        Cancel a payment intent.
        
        Args:
            payment_intent_id: Stripe payment intent ID
        
        Returns:
            dict: Cancellation result
        """
        try:
            payment_intent = stripe.PaymentIntent.cancel(payment_intent_id)
            
            return {
                'success': True,
                'status': payment_intent.status
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_refund(self, payment_intent_id, amount=None, reason=None):
        """
        Create a refund for a payment.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            amount: Amount to refund (in main currency unit). If None, refunds full amount
            reason: Reason for refund ('duplicate', 'fraudulent', 'requested_by_customer')
        
        Returns:
            dict: Refund details or error
        """
        try:
            refund_params = {'payment_intent': payment_intent_id}
            
            if amount:
                refund_params['amount'] = int(float(amount) * 100)  # Convert to cents
            
            if reason:
                refund_params['reason'] = reason
            
            refund = stripe.Refund.create(**refund_params)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund.amount / 100,
                'currency': refund.currency,
                'status': refund.status,
                'reason': refund.reason
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_webhook_signature(self, payload, signature):
        """
        Verify Stripe webhook signature.
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header value
        
        Returns:
            dict: Verification result with event data
        """
        try:
            if not self.webhook_secret:
                return {
                    'success': False,
                    'error': 'Webhook secret not configured'
                }
            
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            return {
                'success': True,
                'event': event
            }
        
        except stripe.error.SignatureVerificationError as e:
            return {
                'success': False,
                'error': 'Invalid signature'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_publishable_key(self):
        """Get Stripe publishable key for frontend."""
        return self.publishable_key


# Global instance
stripe_service = StripeService()
