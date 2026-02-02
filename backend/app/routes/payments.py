"""
Payment routes for M-Pesa integration.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentStatus
from app.services.mpesa import MPesaService, validate_mpesa_config
from app.utils.responses import success_response, error_response

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

# Initialize M-Pesa service
mpesa_service = MPesaService()


@payments_bp.route('/config', methods=['GET'])
def check_config():
    """Check if M-Pesa is configured."""
    config = validate_mpesa_config()
    return success_response(data=config)


@payments_bp.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    """
    Initiate M-Pesa STK Push payment.
    
    Request body:
    {
        "order_id": "uuid",
        "phone_number": "254712345678"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        
        # Validate request
        if not data.get('order_id'):
            return error_response('Order ID is required', 400)
        
        if not data.get('phone_number'):
            return error_response('Phone number is required', 400)
        
        # Get order
        order = Order.query.get(data['order_id'])
        if not order:
            return error_response('Order not found', 404)
        
        # Verify ownership
        if user.role == UserRole.CUSTOMER and order.customer_id != user.customer_profile.id:
            return error_response('You do not have permission to pay for this order', 403)
        
        # Check if order is already paid
        if order.payment_status == PaymentStatus.COMPLETED:
            return error_response('This order has already been paid', 400)
        
        # Check if payment method is M-Pesa
        if order.payment_method.value != 'mpesa':
            return error_response('This order is not set for M-Pesa payment', 400)
        
        # Validate M-Pesa configuration
        config = validate_mpesa_config()
        if not config['configured']:
            return error_response(
                'M-Pesa payment is not configured. Please use Cash on Delivery or contact support.',
                503
            )
        
        # Initiate STK Push
        result = mpesa_service.initiate_stk_push(
            phone_number=data['phone_number'],
            amount=float(order.total),
            account_reference=order.order_number,
            transaction_desc=f'Payment for order {order.order_number}'
        )
        
        if not result.get('success'):
            return error_response(result.get('error', 'Failed to initiate payment'), 500)
        
        # Update order with M-Pesa reference
        order.payment_reference = result['checkout_request_id']
        db.session.commit()
        
        return success_response(
            data={
                'checkout_request_id': result['checkout_request_id'],
                'merchant_request_id': result['merchant_request_id'],
                'customer_message': result['customer_message']
            },
            message='Payment initiated. Check your phone for M-Pesa prompt.'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Payment initiation failed: {str(e)}', 500)


@payments_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    """
    M-Pesa payment callback endpoint.
    This is called by M-Pesa API when payment is completed.
    """
    try:
        data = request.get_json()
        
        # Log callback for debugging
        import logging
        logging.info(f"M-Pesa Callback received: {data}")
        
        # Extract callback data
        result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
        result_desc = data.get('Body', {}).get('stkCallback', {}).get('ResultDesc')
        checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
        
        # Find order by checkout request ID
        order = Order.query.filter_by(payment_reference=checkout_request_id).first()
        
        if not order:
            logging.warning(f"Order not found for CheckoutRequestID: {checkout_request_id}")
            return success_response(message='Order not found')
        
        # Check result code
        if result_code == 0:
            # Payment successful
            callback_metadata = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            # Extract payment details
            mpesa_receipt = None
            phone_number = None
            amount = None
            
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt = item.get('Value')
                elif item.get('Name') == 'PhoneNumber':
                    phone_number = item.get('Value')
                elif item.get('Name') == 'Amount':
                    amount = item.get('Value')
            
            # Update order
            order.payment_status = PaymentStatus.COMPLETED
            order.status = OrderStatus.PAID
            order.paid_at = datetime.utcnow()
            if mpesa_receipt:
                order.payment_reference = mpesa_receipt
            
            db.session.commit()
            
            logging.info(f"Payment successful for order {order.order_number}: {mpesa_receipt}")
            
        else:
            # Payment failed
            order.payment_status = PaymentStatus.FAILED
            db.session.commit()
            
            logging.warning(f"Payment failed for order {order.order_number}: {result_desc}")
        
        return success_response(message='Callback processed')
        
    except Exception as e:
        import logging
        logging.error(f"M-Pesa callback error: {str(e)}")
        db.session.rollback()
        return error_response(str(e), 500)


@payments_bp.route('/status/<order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    """Check payment status for an order."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)
        
        # Verify ownership
        if user.role == UserRole.CUSTOMER and order.customer_id != user.customer_profile.id:
            return error_response('You do not have permission to view this order', 403)
        
        return success_response(data={
            'order_id': order.id,
            'order_number': order.order_number,
            'payment_status': order.payment_status.value,
            'payment_method': order.payment_method.value,
            'payment_reference': order.payment_reference,
            'paid_at': order.paid_at.isoformat() if order.paid_at else None,
            'total': float(order.total)
        })
        
    except Exception as e:
        return error_response(str(e), 500)


@payments_bp.route('/simulate', methods=['POST'])
def simulate_payment():
    """
    Simulate M-Pesa payment (for testing without actual M-Pesa).
    Only works in development/sandbox mode.
    """
    import os
    if os.getenv('FLASK_ENV') == 'production':
        return error_response('Simulation not allowed in production', 403)
    
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        success = data.get('success', True)
        
        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)
        
        if success:
            order.payment_status = PaymentStatus.COMPLETED
            order.status = OrderStatus.PAID
            order.paid_at = datetime.utcnow()
            order.payment_reference = f'SIM{datetime.now().strftime("%Y%m%d%H%M%S")}'
            message = 'Payment simulation successful'
        else:
            order.payment_status = PaymentStatus.FAILED
            message = 'Payment simulation failed'
        
        db.session.commit()
        
        return success_response(
            data=order.to_dict(),
            message=message
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
