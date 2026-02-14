from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole
from app.models.address import Address
from app.models.order import Order, OrderItem, DeliveryZone, OrderStatus, PaymentStatus
from app.models.product import Product
from app.utils.validation import validate_required_fields
from app.utils.responses import success_response, error_response, validation_error_response
from app.services.email_service import (
    send_order_confirmation_email,
    send_payment_confirmation_email,
    send_shipping_notification_email,
    send_delivery_confirmation_email,
    send_order_cancellation_email,
    send_order_status_update_email
)

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


# Address Management Routes

@orders_bp.route('/addresses', methods=['GET'])
@jwt_required()
def get_addresses():
    """Get all addresses for current user."""
    try:
        user_id = get_jwt_identity()
        addresses = Address.query.filter_by(user_id=user_id).all()
        
        return success_response(data=[addr.to_dict() for addr in addresses])
    except Exception as e:
        return error_response(f'Failed to fetch addresses: {str(e)}', 500)


@orders_bp.route('/addresses', methods=['POST'])
@jwt_required()
@validate_required_fields(['label', 'full_name', 'phone_number', 'address_line_1', 'city', 'county'])
def create_address():
    """Create new address."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # If this is first address or is_default is True, make it default
        is_default = data.get('is_default', False)
        existing_addresses = Address.query.filter_by(user_id=user_id).count()
        
        if existing_addresses == 0:
            is_default = True
        elif is_default:
            # Unset other default addresses
            Address.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
        
        address = Address(
            user_id=user_id,
            label=data['label'].strip(),
            full_name=data['full_name'].strip(),
            phone_number=data['phone_number'].strip(),
            address_line_1=data['address_line_1'].strip(),
            address_line_2=data.get('address_line_2', '').strip() if data.get('address_line_2') else None,
            city=data['city'].strip(),
            county=data['county'].strip(),
            postal_code=data.get('postal_code', '').strip() if data.get('postal_code') else None,
            is_default=is_default
        )
        
        db.session.add(address)
        db.session.commit()
        
        return success_response(
            data=address.to_dict(),
            message='Address created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create address: {str(e)}', 500)


@orders_bp.route('/addresses/<address_id>', methods=['PUT'])
@jwt_required()
def update_address(address_id):
    """Update address."""
    try:
        user_id = get_jwt_identity()
        address = Address.query.get(address_id)
        
        if not address or address.user_id != user_id:
            return error_response('Address not found', 404)
        
        data = request.get_json()
        
        # Update fields
        if 'label' in data:
            address.label = data['label'].strip()
        if 'full_name' in data:
            address.full_name = data['full_name'].strip()
        if 'phone_number' in data:
            address.phone_number = data['phone_number'].strip()
        if 'address_line_1' in data:
            address.address_line_1 = data['address_line_1'].strip()
        if 'address_line_2' in data:
            address.address_line_2 = data['address_line_2'].strip() if data['address_line_2'] else None
        if 'city' in data:
            address.city = data['city'].strip()
        if 'county' in data:
            address.county = data['county'].strip()
        if 'postal_code' in data:
            address.postal_code = data['postal_code'].strip() if data['postal_code'] else None
        
        # Handle default address
        if 'is_default' in data and data['is_default']:
            Address.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
            address.is_default = True
        
        db.session.commit()
        
        return success_response(
            data=address.to_dict(),
            message='Address updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update address: {str(e)}', 500)


@orders_bp.route('/addresses/<address_id>', methods=['DELETE'])
@jwt_required()
def delete_address(address_id):
    """Delete address."""
    try:
        user_id = get_jwt_identity()
        address = Address.query.get(address_id)
        
        if not address or address.user_id != user_id:
            return error_response('Address not found', 404)
        
        # If this was default, make another address default
        if address.is_default:
            other_address = Address.query.filter(
                Address.user_id == user_id,
                Address.id != address_id
            ).first()
            
            if other_address:
                other_address.is_default = True
        
        db.session.delete(address)
        db.session.commit()
        
        return success_response(message='Address deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete address: {str(e)}', 500)


# Delivery Zones Routes

@orders_bp.route('/delivery-zones', methods=['GET'])
def get_delivery_zones():
    """Get all active delivery zones."""
    try:
        zones = DeliveryZone.query.filter_by(is_active=True).all()
        return success_response(data=[zone.to_dict() for zone in zones])
    except Exception as e:
        return error_response(f'Failed to fetch delivery zones: {str(e)}', 500)


@orders_bp.route('/delivery-zones/calculate', methods=['POST'])
@validate_required_fields(['county'])
def calculate_delivery_fee():
    """Calculate delivery fee for a county."""
    try:
        data = request.get_json()
        county = data['county'].strip()
        
        # Find zone that contains this county
        zones = DeliveryZone.query.filter_by(is_active=True).all()
        
        for zone in zones:
            if county.lower() in [c.lower() for c in zone.counties]:
                return success_response(data={
                    'zone_id': zone.id,
                    'zone_name': zone.name,
                    'delivery_fee': float(zone.delivery_fee),
                    'estimated_days': zone.estimated_days
                })
        
        return error_response('Delivery not available for this location', 400)
    except Exception as e:
        return error_response(f'Failed to calculate delivery fee: {str(e)}', 500)


# Order Routes

@orders_bp.route('', methods=['POST'])
@jwt_required()
@validate_required_fields(['items', 'delivery_address_id', 'payment_method'])
def create_order():
    """Create a new order from cart items."""
    try:
        from app.services.notification_service import notification_service
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != UserRole.CUSTOMER:
            return error_response('Only customers can create orders', 403)
        
        data = request.get_json()
        print(f'Creating order for user {user_id} with data: {data}')
        
        # Validate address
        address = Address.query.get(data['delivery_address_id'])
        if not address or address.user_id != user_id:
            return error_response('Invalid delivery address', 400)
        
        print(f'Address validated: {address.id}')
        
        # Calculate delivery fee
        zones = DeliveryZone.query.filter_by(is_active=True).all()
        delivery_zone = None
        delivery_fee = 0
        
        for zone in zones:
            if address.county.lower() in [c.lower() for c in zone.counties]:
                delivery_zone = zone
                delivery_fee = float(zone.delivery_fee)
                break
        
        if not delivery_zone:
            return error_response('Delivery not available to your location', 400)
        
        print(f'Delivery zone found: {delivery_zone.name}, fee: {delivery_fee}')
        
        # Validate items and calculate subtotal
        items = data['items']
        if not items or len(items) == 0:
            return error_response('Order must contain at least one item', 400)
        
        subtotal = 0
        order_items = []
        supplier_ids = set()
        
        for item_data in items:
            product = Product.query.get(item_data['product_id'])
            
            if not product or not product.is_active:
                return error_response(f'Product {item_data.get("product_id")} not found', 400)
            
            quantity = int(item_data['quantity'])
            
            if quantity <= 0:
                return error_response('Quantity must be greater than 0', 400)
            
            if quantity > product.stock_quantity:
                return error_response(f'{product.name} only has {product.stock_quantity} in stock', 400)
            
            # Create order item
            order_item = OrderItem(
                product_id=product.id,
                supplier_id=product.supplier_id,
                product_name=product.name,
                product_price=product.price,
                quantity=quantity,
                warranty_period_months=product.warranty_period_months
            )
            
            order_item.calculate_amounts()
            order_items.append(order_item)
            subtotal += float(order_item.subtotal)
            supplier_ids.add(product.supplier_id)
        
        print(f'Order items validated, subtotal: {subtotal}')
        
        # Create order
        order = Order(
            customer_id=user.customer_profile.id,
            delivery_address_id=address.id,
            delivery_zone=delivery_zone.name,
            delivery_fee=delivery_fee,
            subtotal=subtotal,
            payment_method=data['payment_method'],
            customer_notes=data.get('customer_notes')
        )
        
        order.calculate_totals()
        order.generate_order_number()
        
        print(f'Order created: {order.order_number}')
        
        # Add order items
        for order_item in order_items:
            order_item.order = order
            db.session.add(order_item)
        
        # Update product stock
        for item_data, order_item in zip(items, order_items):
            product = Product.query.get(item_data['product_id'])
            product.stock_quantity -= order_item.quantity
            product.purchase_count += order_item.quantity
            
            # Check for low stock and notify supplier
            if product.stock_quantity <= product.low_stock_threshold:
                notification_service.create_notification(
                    user_id=product.supplier.user_id,
                    title='Low Stock Alert',
                    message=f'Product "{product.name}" is running low on stock ({product.stock_quantity} remaining).',
                    notification_type='warning',
                    link=f'/supplier/products/{product.id}'
                )
        
        db.session.add(order)
        db.session.commit()
        
        print(f'Order saved successfully: {order.id}')
        
        # Create audit log
        notification_service.create_audit_log(
            action='order_created',
            entity_type='order',
            entity_id=order.id,
            user_id=user_id,
            description=f"Order {order.order_number} created - Total: KES {order.total}"
        )
        
        # Notify admins
        notification_service.notify_admins(
            title='New Order Received',
            message=f'New order #{order.order_number} placed by {user.email} - Total: KES {order.total:,.2f}',
            notification_type='info',
            link=f'/admin/orders/{order.id}'
        )
        
        # Notify suppliers
        from app.models.user import SupplierProfile
        for supplier_id in supplier_ids:
            supplier = SupplierProfile.query.get(supplier_id)
            if supplier:
                notification_service.create_notification(
                    user_id=supplier.user_id,
                    title='New Order Received',
                    message=f'You have a new order #{order.order_number}. Please prepare items for shipment.',
                    notification_type='info',
                    link=f'/supplier/orders/{order.id}'
                )
        
        # Send order confirmation email
        try:
            send_order_confirmation_email(order, user.email)
        except Exception as e:
            # Log error but don't fail the order creation
            import logging
            logging.error(f'Failed to send order confirmation email: {str(e)}')
        
        return success_response(
            data=order.to_dict(),
            message='Order created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        print(f'Order creation error: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to create order: {str(e)}', 500)


@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    """Get orders for current user."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Get pagination params
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')
        
        if user.role == UserRole.CUSTOMER:
            query = Order.query.filter_by(customer_id=user.customer_profile.id)
        elif user.role == UserRole.SUPPLIER:
            # Get orders containing supplier's products
            query = db.session.query(Order).join(OrderItem)\
                .filter(OrderItem.supplier_id == user.supplier_profile.id).distinct()
        else:
            # Admin sees all orders
            query = Order.query
        
        # Apply status filter
        if status:
            query = query.filter_by(status=status)
        
        # Paginate
        orders = query.order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'orders': [order.to_dict(include_items=False) for order in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch orders: {str(e)}', 500)


@orders_bp.route('/<order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order details."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        order = Order.query.get(order_id)
        
        if not order:
            return error_response('Order not found', 404)
        
        # Check permissions
        if user.role == UserRole.CUSTOMER:
            if order.customer_id != user.customer_profile.id:
                return error_response('You do not have permission to view this order', 403)
        elif user.role == UserRole.SUPPLIER:
            # Check if supplier has items in this order
            has_items = OrderItem.query.filter_by(
                order_id=order_id,
                supplier_id=user.supplier_profile.id
            ).first()
            
            if not has_items:
                return error_response('You do not have permission to view this order', 403)
        
        return success_response(data=order.to_dict())
    except Exception as e:
        return error_response(f'Failed to fetch order: {str(e)}', 500)


@orders_bp.route('/<order_id>/status', methods=['PUT'])
@jwt_required()
@validate_required_fields(['status'])
def update_order_status(order_id):
    """Update order status (Admin/Supplier)."""
    try:
        from app.services.notification_service import notification_service
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        order = Order.query.get(order_id)
        
        if not order:
            return error_response('Order not found', 404)
        
        data = request.get_json()
        new_status = data['status']
        
        # Validate status
        try:
            OrderStatus(new_status)
        except ValueError:
            return error_response('Invalid order status', 400)
        
        # Check permissions
        is_admin = user.role in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]
        
        if not is_admin:
            return error_response('Only admins can update order status', 403)
        
        old_status = order.status
        order.status = new_status
        
        if 'admin_notes' in data:
            order.admin_notes = data['admin_notes']
        
        db.session.commit()
        
        # Create audit log
        notification_service.create_audit_log(
            action='order_status_changed',
            entity_type='order',
            entity_id=order.id,
            user_id=user_id,
            old_values={'status': old_status.value},
            new_values={'status': new_status},
            description=f"Order {order.order_number} status changed from {old_status.value} to {new_status}"
        )
        
        # Notify customer
        notification_service.create_notification(
            user_id=order.customer.user_id,
            title=f'Order Status Updated',
            message=f'Your order #{order.order_number} status has been updated to {new_status}.',
            notification_type='info',
            link=f'/orders/{order.id}'
        )
        
        # Send status update email
        try:
            send_order_status_update_email(order, order.customer.user.email, old_status.value, new_status)
        except Exception as e:
            current_app.logger.error(f'Failed to send status update email: {str(e)}')
        
        return success_response(
            data=order.to_dict(),
            message='Order status updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update order status: {str(e)}', 500)


@orders_bp.route('/<order_id>/payment', methods=['PUT'])
@jwt_required()
@validate_required_fields(['payment_status'])
def update_payment_status(order_id):
    """Update payment status (usually after M-Pesa callback)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        order = Order.query.get(order_id)
        
        if not order:
            return error_response('Order not found', 404)
        
        data = request.get_json()
        
        # Only admin or order owner can update payment
        is_admin = user.role in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]
        is_owner = user.role == UserRole.CUSTOMER and order.customer_id == user.customer_profile.id
        
        if not (is_admin or is_owner):
            return error_response('You do not have permission to update payment status', 403)
        
        order.payment_status = data['payment_status']
        
        if 'payment_reference' in data:
            order.payment_reference = data['payment_reference']
        
        if data['payment_status'] == PaymentStatus.COMPLETED.value:
            order.paid_at = datetime.utcnow()
            order.status = OrderStatus.PAID
        
        db.session.commit()
        
        return success_response(
            data=order.to_dict(),
            message='Payment status updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update payment status: {str(e)}', 500)


@orders_bp.route('/<order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """
    Cancel an order.
    Customers can cancel their own unpaid/pending orders.
    Admins can cancel any order.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        data = request.get_json() or {}
        cancellation_reason = data.get('reason', '').strip()

        # Check permissions
        is_admin = user.role in [UserRole.ADMIN, UserRole.FINANCE_ADMIN]
        is_owner = user.role == UserRole.CUSTOMER and order.customer_id == user.customer_profile.id

        if not (is_admin or is_owner):
            return error_response('You do not have permission to cancel this order', 403)

        # Check if order can be cancelled
        non_cancellable_statuses = [
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.RETURNED
        ]

        if order.status in non_cancellable_statuses:
            return error_response(
                f'Cannot cancel order with status: {order.status.value}',
                400
            )

        # Customers can only cancel unpaid orders
        if is_owner and not is_admin:
            if order.payment_status == PaymentStatus.COMPLETED:
                return error_response(
                    'Cannot cancel a paid order. Please request a return instead.',
                    400
                )

        # Restore product stock
        for order_item in order.items:
            product = Product.query.get(order_item.product_id)
            if product:
                product.stock_quantity += order_item.quantity
                product.purchase_count -= order_item.quantity

        # Update order status
        order.status = OrderStatus.CANCELLED

        # Add cancellation reason to admin notes
        cancel_note = f'Order cancelled by {"admin" if is_admin else "customer"}'
        if cancellation_reason:
            cancel_note += f': {cancellation_reason}'
        cancel_note += f' on {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}'

        order.admin_notes = (order.admin_notes or '') + f'\n{cancel_note}'

        # If order was paid, mark for refund
        if order.payment_status == PaymentStatus.COMPLETED:
            order.payment_status = PaymentStatus.REFUNDED
            order.admin_notes += '\nRefund required - order was paid before cancellation.'

        db.session.commit()
        
        # Send cancellation email
        try:
            send_order_cancellation_email(order, order.customer.user.email, cancellation_reason)
        except Exception as e:
            current_app.logger.error(f'Failed to send cancellation email: {str(e)}')

        return success_response(
            data=order.to_dict(),
            message='Order cancelled successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel order: {str(e)}', 500)
