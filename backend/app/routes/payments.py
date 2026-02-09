"""
Payment routes for M-Pesa and Card payments.
"""

from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentMethod, PaymentStatus
from app.models.user import SupplierProfile
from app.models.returns import SupplierPayout
from app.utils.responses import success_response, error_response
from app.utils.decorators import admin_required
from app.services.mpesa_service import mpesa_service
from app.services.stripe_service import stripe_service
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


# Card payment endpoints (Stripe integration)
@payments_bp.route('/card/initiate', methods=['POST'])
@jwt_required()
def initiate_card_payment():
    """
    Initiate card payment via Stripe.

    Expected payload:
    {
        "order_id": "uuid"
    }

    Returns a client secret for Stripe Elements.
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

        # Check if Stripe is configured
        if not stripe_service.is_configured():
            return error_response(
                'Card payment is not available at the moment. Please use M-Pesa or cash on delivery.',
                503
            )

        # Create Stripe Payment Intent
        result = stripe_service.create_payment_intent(
            amount=float(order.total),
            currency='kes',
            metadata={
                'order_id': str(order.id),
                'order_number': order.order_number,
                'customer_email': order.customer.user.email
            }
        )

        if result.get('success'):
            # Store payment intent ID for callback matching
            order.payment_reference = result.get('payment_intent_id')
            db.session.commit()

            return success_response(
                data={
                    'client_secret': result.get('client_secret'),
                    'payment_intent_id': result.get('payment_intent_id'),
                    'publishable_key': stripe_service.get_publishable_key()
                },
                message='Payment intent created successfully'
            )
        else:
            return error_response(
                result.get('error', 'Failed to initiate card payment'),
                500
            )

    except Exception as e:
        current_app.logger.error(f'Stripe initiation error: {str(e)}')
        return error_response(f'Payment initiation failed: {str(e)}', 500)


@payments_bp.route('/card/webhook', methods=['POST'])
def card_webhook():
    """
    Handle Stripe webhook events.
    This endpoint is called by Stripe when payment events occur.
    """
    try:
        payload = request.data
        signature = request.headers.get('Stripe-Signature')

        if not signature:
            return error_response('Missing signature', 400)

        # Verify webhook signature
        result = stripe_service.verify_webhook_signature(payload, signature)

        if not result.get('success'):
            current_app.logger.error(f'Webhook verification failed: {result.get("error")}')
            return error_response('Invalid signature', 400)

        event = result.get('event')
        event_type = event['type']

        current_app.logger.info(f'Stripe webhook received: {event_type}')

        # Handle payment_intent.succeeded event
        if event_type == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']

            # Find order by payment intent ID
            order = Order.query.filter_by(payment_reference=payment_intent_id).first()

            if order:
                order.payment_status = PaymentStatus.COMPLETED
                order.status = OrderStatus.PAID
                order.paid_at = datetime.utcnow()
                db.session.commit()

                # Send confirmation email
                try:
                    send_payment_confirmation_email(order, order.customer.user.email)
                except Exception as e:
                    current_app.logger.error(f'Failed to send payment email: {str(e)}')

                current_app.logger.info(f'Payment successful for order {order.order_number}')

        # Handle payment_intent.payment_failed event
        elif event_type == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']

            order = Order.query.filter_by(payment_reference=payment_intent_id).first()

            if order:
                order.payment_status = PaymentStatus.FAILED
                error_message = payment_intent.get('last_payment_error', {}).get('message', 'Payment failed')
                order.admin_notes = f'Stripe payment failed: {error_message}'
                db.session.commit()

                current_app.logger.warning(f'Payment failed for order {order.order_number}: {error_message}')

        return {'status': 'success'}

    except Exception as e:
        current_app.logger.error(f'Stripe webhook error: {str(e)}')
        return {'status': 'error', 'message': str(e)}, 500


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
                'enabled': stripe_service.is_configured(),
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


# ==================== Supplier Payout Routes (B2C) ====================

@payments_bp.route('/supplier/payout', methods=['POST'])
@jwt_required()
@admin_required
def initiate_supplier_payout():
    """
    Initiate M-Pesa B2C payment to supplier.
    Only admins can initiate supplier payouts.

    Expected payload:
    {
        "supplier_id": "uuid",
        "amount": 1000.00,
        "notes": "Payout for order #123"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data.get('supplier_id'):
            return error_response('Supplier ID is required', 400)
        if not data.get('amount') or float(data['amount']) <= 0:
            return error_response('Valid amount is required', 400)

        # Get supplier profile
        supplier = SupplierProfile.query.get(data['supplier_id'])
        if not supplier:
            return error_response('Supplier not found', 404)

        # Check if supplier has M-Pesa number
        if not supplier.mpesa_number:
            return error_response('Supplier has no M-Pesa number configured', 400)

        # Validate phone number
        is_valid, formatted_phone = mpesa_service.validate_phone_number(supplier.mpesa_number)
        if not is_valid:
            return error_response(f'Invalid supplier M-Pesa number: {formatted_phone}', 400)

        amount = float(data['amount'])
        notes = data.get('notes', f'Supplier payout - {supplier.business_name}')

        # Create payout record
        payout = SupplierPayout(
            supplier_id=supplier.user_id,
            amount=amount,
            status='pending',
            notes=notes
        )
        db.session.add(payout)
        db.session.flush()  # Get payout ID

        # Initiate B2C payment
        result = mpesa_service.b2c_payment(
            phone_number=formatted_phone,
            amount=amount,
            remarks=f'Payout-{payout.id[:8]}',
            occasion=notes[:100] if notes else ''
        )

        if result.get('success'):
            payout.status = 'processing'
            payout.reference = result.get('conversation_id')
            db.session.commit()

            return success_response(
                data={
                    'payout_id': payout.id,
                    'conversation_id': result.get('conversation_id'),
                    'status': 'processing'
                },
                message=f'Payout of KES {amount} initiated to {supplier.business_name}'
            )
        else:
            payout.status = 'failed'
            payout.notes = (payout.notes or '') + f'\nFailed: {result.get("error", "Unknown error")}'
            db.session.commit()

            return error_response(
                result.get('error', 'Failed to initiate payout'),
                500
            )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Supplier payout error: {str(e)}')
        return error_response(f'Payout failed: {str(e)}', 500)


@payments_bp.route('/b2c/result', methods=['POST'])
def b2c_result_callback():
    """
    Handle B2C result callback from M-Pesa.
    Called when B2C payment completes or fails.
    """
    try:
        data = request.get_json()
        current_app.logger.info(f'B2C result callback: {data}')

        result = data.get('Result', {})
        conversation_id = result.get('ConversationID')
        result_code = result.get('ResultCode')
        result_desc = result.get('ResultDesc')

        # Find payout by conversation ID
        payout = SupplierPayout.query.filter_by(reference=conversation_id).first()

        if payout:
            if result_code == 0:
                # Payment successful
                payout.status = 'completed'
                payout.paid_at = datetime.utcnow()

                # Extract transaction details from ResultParameters
                result_params = result.get('ResultParameters', {}).get('ResultParameter', [])
                for param in result_params:
                    if param.get('Key') == 'TransactionReceipt':
                        payout.reference = param.get('Value')
                        break

                current_app.logger.info(f'B2C payout successful: {payout.id}')
            else:
                # Payment failed
                payout.status = 'failed'
                payout.notes = (payout.notes or '') + f'\nFailed: {result_desc}'
                current_app.logger.warning(f'B2C payout failed: {payout.id} - {result_desc}')

            db.session.commit()

        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}

    except Exception as e:
        current_app.logger.error(f'B2C result callback error: {str(e)}')
        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}


@payments_bp.route('/b2c/timeout', methods=['POST'])
def b2c_timeout_callback():
    """
    Handle B2C timeout callback from M-Pesa.
    Called when B2C request times out.
    """
    try:
        data = request.get_json()
        current_app.logger.warning(f'B2C timeout callback: {data}')

        # Mark payout as failed due to timeout
        conversation_id = data.get('Result', {}).get('ConversationID')
        if conversation_id:
            payout = SupplierPayout.query.filter_by(reference=conversation_id).first()
            if payout:
                payout.status = 'failed'
                payout.notes = (payout.notes or '') + '\nFailed: Request timed out'
                db.session.commit()

        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}

    except Exception as e:
        current_app.logger.error(f'B2C timeout callback error: {str(e)}')
        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}


@payments_bp.route('/supplier/payouts', methods=['GET'])
@jwt_required()
@admin_required
def get_supplier_payouts():
    """
    Get all supplier payouts.
    Admin only endpoint.
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        supplier_id = request.args.get('supplier_id')

        query = SupplierPayout.query

        if status:
            query = query.filter_by(status=status)
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)

        query = query.order_by(SupplierPayout.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'payouts': [p.to_dict() for p in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        })

    except Exception as e:
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@payments_bp.route('/supplier/<supplier_id>/update-mpesa', methods=['PUT'])
@jwt_required()
@admin_required
def update_supplier_mpesa_number(supplier_id):
    """
    Update supplier's M-Pesa number.
    Admin only - used when supplier needs to change their payout number.

    Expected payload:
    {
        "mpesa_number": "254XXXXXXXXX",
        "reason": "Supplier requested change"
    }
    """
    try:
        data = request.get_json()

        if not data.get('mpesa_number'):
            return error_response('M-Pesa number is required', 400)

        # Get supplier
        supplier = SupplierProfile.query.get(supplier_id)
        if not supplier:
            return error_response('Supplier not found', 404)

        # Validate new phone number
        is_valid, formatted_phone = mpesa_service.validate_phone_number(data['mpesa_number'])
        if not is_valid:
            return error_response(f'Invalid M-Pesa number: {formatted_phone}', 400)

        old_number = supplier.mpesa_number
        supplier.mpesa_number = formatted_phone

        # Log the change
        reason = data.get('reason', 'Admin update')
        current_app.logger.info(
            f'Supplier {supplier_id} M-Pesa changed from {old_number} to {formatted_phone}. Reason: {reason}'
        )

        db.session.commit()

        return success_response(
            data={
                'supplier_id': supplier_id,
                'business_name': supplier.business_name,
                'old_mpesa_number': old_number,
                'new_mpesa_number': formatted_phone
            },
            message='Supplier M-Pesa number updated successfully'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update M-Pesa number: {str(e)}', 500)
