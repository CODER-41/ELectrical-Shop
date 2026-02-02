"""
Payment routes for M-Pesa and Card payments.
"""

from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentMethod, PaymentStatus
from app.utils.responses import success_response, error_response
from app.services.mpesa_service import mpesa_service
from app.services.email_service import send_payment_confirmation_email

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payments_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    """
    Initiate M-Pesa STK Push payment.

    Expected payload:
    {
        "order_id": "uuid",
        "phone_number": "254XXXXXXXXX"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data.get('order_id'):
            return error_response('Order ID is required', 400)
        if not data.get('phone_number'):
            return error_response('Phone number is required', 400)

        # Get the order
        order = Order.query.get(data['order_id'])
        if not order:
            return error_response('Order not found', 404)

        # Verify the order belongs to the user
        if str(order.customer.user_id) != user_id:
            return error_response('Unauthorized', 403)

        # Check if order is already paid
        if order.payment_status == PaymentStatus.COMPLETED:
            return error_response('Order is already paid', 400)

        # Verify payment method is M-Pesa
        if order.payment_method != PaymentMethod.MPESA:
            return error_response('Order payment method is not M-Pesa', 400)

        # Validate phone number
        is_valid, formatted_phone = mpesa_service.validate_phone_number(data['phone_number'])
        if not is_valid:
            return error_response(formatted_phone, 400)  # formatted_phone contains error message

        # Initiate STK Push
        result = mpesa_service.initiate_stk_push(
            phone_number=formatted_phone,
            amount=float(order.total),
            account_reference=order.order_number,
            transaction_desc=f'Payment for order {order.order_number}'
        )

        if result.get('success'):
            # Store checkout request ID for callback matching
            order.payment_reference = result.get('checkout_request_id')
            db.session.commit()

            return success_response(
                data={
                    'checkout_request_id': result.get('checkout_request_id'),
                    'merchant_request_id': result.get('merchant_request_id'),
                    'customer_message': result.get('customer_message', 'Please check your phone and enter your M-Pesa PIN')
                },
                message='STK Push sent successfully. Please enter your M-Pesa PIN.',
                status_code=200
            )
        else:
            return error_response(
                result.get('error', 'Failed to initiate M-Pesa payment'),
                500
            )

    except Exception as e:
        current_app.logger.error(f'M-Pesa initiation error: {str(e)}')
        return error_response(f'Payment initiation failed: {str(e)}', 500)


@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """
    Handle M-Pesa callback from Safaricom.
    This endpoint is called by M-Pesa when payment is completed or fails.
    """
    try:
        data = request.get_json()
        current_app.logger.info(f'M-Pesa callback received: {data}')

        # Extract callback data
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')

        # Find order by checkout request ID
        order = Order.query.filter_by(payment_reference=checkout_request_id).first()

        if not order:
            current_app.logger.warning(f'Order not found for checkout ID: {checkout_request_id}')
            return {'ResultCode': 0, 'ResultDesc': 'Accepted'}

        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])

            # Extract transaction details
            mpesa_receipt = None
            amount = None
            phone = None

            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt = item.get('Value')
                elif item.get('Name') == 'Amount':
                    amount = item.get('Value')
                elif item.get('Name') == 'PhoneNumber':
                    phone = item.get('Value')

            # Update order
            order.payment_status = PaymentStatus.COMPLETED
            order.status = OrderStatus.PAID
            order.payment_reference = mpesa_receipt or checkout_request_id
            order.paid_at = datetime.utcnow()

            db.session.commit()

            # Send confirmation email
            try:
                send_payment_confirmation_email(order, order.customer.user.email)
            except Exception as e:
                current_app.logger.error(f'Failed to send payment email: {str(e)}')

            current_app.logger.info(f'Payment successful for order {order.order_number}')

        else:
            # Payment failed
            order.payment_status = PaymentStatus.FAILED
            order.admin_notes = f'M-Pesa payment failed: {result_desc}'
            db.session.commit()

            current_app.logger.warning(f'Payment failed for order {order.order_number}: {result_desc}')

        # M-Pesa expects this response format
        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}

    except Exception as e:
        current_app.logger.error(f'M-Pesa callback error: {str(e)}')
        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}


@payments_bp.route('/mpesa/query', methods=['POST'])
@jwt_required()
def query_mpesa_status():
    """
    Query the status of an M-Pesa STK Push transaction.

    Expected payload:
    {
        "order_id": "uuid"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('order_id'):
            return error_response('Order ID is required', 400)

        order = Order.query.get(data['order_id'])
        if not order:
            return error_response('Order not found', 404)

        # Verify ownership
        if str(order.customer.user_id) != user_id:
            return error_response('Unauthorized', 403)

        if not order.payment_reference:
            return error_response('No payment initiated for this order', 400)

        # If already paid, return success
        if order.payment_status == PaymentStatus.COMPLETED:
            return success_response(
                data={
                    'status': 'completed',
                    'payment_reference': order.payment_reference
                },
                message='Payment completed'
            )

        # Query M-Pesa for status
        result = mpesa_service.query_stk_push_status(order.payment_reference)

        return success_response(data={
            'status': 'pending' if result.get('result_code') != '0' else 'completed',
            'result_code': result.get('result_code'),
            'result_desc': result.get('result_desc')
        })

    except Exception as e:
        current_app.logger.error(f'M-Pesa query error: {str(e)}')
        return error_response(f'Failed to query payment status: {str(e)}', 500)


@payments_bp.route('/verify/<order_id>', methods=['GET'])
@jwt_required()
def verify_payment(order_id):
    """
    Verify payment status for an order.
    Used by frontend for polling payment status.
    """
    try:
        user_id = get_jwt_identity()

        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        # Verify ownership (allow customer or admin)
        user = User.query.get(user_id)
        if str(order.customer.user_id) != user_id and user.role not in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]:
            return error_response('Unauthorized', 403)

        return success_response(data={
            'order_id': str(order.id),
            'order_number': order.order_number,
            'payment_status': order.payment_status.value if order.payment_status else 'pending',
            'payment_method': order.payment_method.value if order.payment_method else None,
            'payment_reference': order.payment_reference,
            'paid_at': order.paid_at.isoformat() if order.paid_at else None,
            'total': float(order.total)
        })

    except Exception as e:
        return error_response(f'Failed to verify payment: {str(e)}', 500)


@payments_bp.route('/cash/confirm', methods=['POST'])
@jwt_required()
def confirm_cash_payment():
    """
    Confirm cash on delivery payment.
    Only admins and order managers can confirm cash payments.

    Expected payload:
    {
        "order_id": "uuid",
        "amount_received": 1000.00,
        "notes": "optional notes"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Only admins and order managers can confirm cash payments
        if user.role not in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]:
            return error_response('Only admins can confirm cash payments', 403)

        data = request.get_json()

        if not data.get('order_id'):
            return error_response('Order ID is required', 400)

        order = Order.query.get(data['order_id'])
        if not order:
            return error_response('Order not found', 404)

        if order.payment_method != PaymentMethod.CASH:
            return error_response('This order is not cash on delivery', 400)

        if order.payment_status == PaymentStatus.COMPLETED:
            return error_response('Payment already confirmed', 400)

        # Validate amount received
        amount_received = data.get('amount_received', 0)
        if amount_received < float(order.total):
            return error_response(
                f'Amount received ({amount_received}) is less than order total ({order.total})',
                400
            )

        # Update order
        order.payment_status = PaymentStatus.COMPLETED
        order.status = OrderStatus.DELIVERED  # Cash is collected on delivery
        order.paid_at = datetime.utcnow()
        order.payment_reference = f'CASH-{order.order_number}-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'

        if data.get('notes'):
            order.admin_notes = (order.admin_notes or '') + f'\nCash payment confirmed: {data["notes"]}'

        db.session.commit()

        # Send confirmation email
        try:
            send_payment_confirmation_email(order, order.customer.user.email)
        except Exception as e:
            current_app.logger.error(f'Failed to send payment email: {str(e)}')

        return success_response(
            data=order.to_dict(),
            message='Cash payment confirmed successfully'
        )

    except Exception as e:
        return error_response(f'Failed to confirm payment: {str(e)}', 500)


# Card payment endpoints (placeholder for Flutterwave/Paystack integration)
@payments_bp.route('/card/initiate', methods=['POST'])
@jwt_required()
def initiate_card_payment():
    """
    Initiate card payment via payment gateway.

    Expected payload:
    {
        "order_id": "uuid"
    }

    Returns a redirect URL to the payment gateway.
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('order_id'):
            return error_response('Order ID is required', 400)

        order = Order.query.get(data['order_id'])
        if not order:
            return error_response('Order not found', 404)

        # Verify ownership
        if str(order.customer.user_id) != user_id:
            return error_response('Unauthorized', 403)

        if order.payment_status == PaymentStatus.COMPLETED:
            return error_response('Order is already paid', 400)

        if order.payment_method != PaymentMethod.CARD:
            return error_response('Order payment method is not card', 400)

        # TODO: Integrate with Flutterwave or Paystack
        # For now, return a placeholder response
        return error_response(
            'Card payment gateway not yet configured. Please use M-Pesa or cash on delivery.',
            501
        )

    except Exception as e:
        return error_response(f'Failed to initiate card payment: {str(e)}', 500)


@payments_bp.route('/card/callback', methods=['POST'])
def card_callback():
    """
    Handle card payment callback from payment gateway.
    This endpoint is called by the payment gateway when payment completes.
    """
    try:
        data = request.get_json()
        current_app.logger.info(f'Card payment callback received: {data}')

        # TODO: Implement based on payment gateway (Flutterwave/Paystack)
        # Verify webhook signature
        # Update order status

        return {'status': 'success'}

    except Exception as e:
        current_app.logger.error(f'Card callback error: {str(e)}')
        return {'status': 'error', 'message': str(e)}


@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """
    Get available payment methods.
    """
    return success_response(data={
        'methods': [
            {
                'id': 'mpesa',
                'name': 'M-Pesa',
                'description': 'Pay using M-Pesa STK Push',
                'enabled': True,
                'icon': 'mpesa-icon'
            },
            {
                'id': 'card',
                'name': 'Card Payment',
                'description': 'Pay with Visa, Mastercard, or other cards',
                'enabled': False,  # Enable when gateway is configured
                'icon': 'card-icon'
            },
            {
                'id': 'cash',
                'name': 'Cash on Delivery',
                'description': 'Pay cash when your order is delivered',
                'enabled': True,
                'icon': 'cash-icon'
            }
        ]
    })
