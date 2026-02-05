from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.returns import Return, SupplierPayout
from app.utils.responses import success_response, error_response

supplier_bp = Blueprint('supplier', __name__, url_prefix='/api/supplier')


@supplier_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get supplier dashboard overview."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        if not user.supplier_profile:
            return error_response('Supplier profile not found. Please complete your profile setup.', 404)
        
        supplier_id = user.supplier_profile.id
        
        # Total products
        total_products = Product.query.filter_by(supplier_id=supplier_id).count()
        active_products = Product.query.filter_by(supplier_id=supplier_id, is_active=True).count()
        
        # Orders containing supplier's products
        total_orders = db.session.query(Order.id)\
            .join(OrderItem)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .distinct().count()
        
        # Get supplier profile for accurate balance info
        supplier_profile = user.supplier_profile
        
        # Total earnings (lifetime)
        total_earnings = float(supplier_profile.total_sales)
        
        # Pending earnings (outstanding balance)
        pending_earnings = float(supplier_profile.outstanding_balance)
        
        # This month's sales
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_sales = db.session.query(func.sum(OrderItem.supplier_earnings))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= month_start
            ).scalar() or 0

        # Total items sold
        items_sold = db.session.query(func.sum(OrderItem.quantity))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED
            ).scalar() or 0
        
        # Returns
        total_returns = db.session.query(Return)\
            .join(Order, Return.order_id == Order.id)\
            .join(OrderItem, OrderItem.order_id == Order.id)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .distinct().count()
        
        # Low stock products
        low_stock = Product.query.filter(
            Product.supplier_id == supplier_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold
        ).count()
        
        return success_response(data={
            'products': {
                'total': total_products,
                'active': active_products,
                'low_stock': low_stock
            },
            'orders': {
                'total': total_orders,
                'items_sold': int(items_sold) if items_sold else 0
            },
            'earnings': {
                'total': float(total_earnings),
                'pending': float(pending_earnings),
                'this_month': float(month_sales)
            },
            'returns': total_returns
        })
    except Exception as e:
        import traceback
        print(f"Dashboard error: {str(e)}")
        print(traceback.format_exc())
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


@supplier_bp.route('/products', methods=['GET'])
@jwt_required()
def get_supplier_products():
    """Get supplier's products."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id

        # Get all products for this supplier
        products = Product.query.filter_by(supplier_id=supplier_id)\
            .order_by(Product.created_at.desc()).all()

        return success_response(data=[p.to_dict() for p in products])
    except Exception as e:
        return error_response(f'Failed to fetch products: {str(e)}', 500)


@supplier_bp.route('/products', methods=['POST'])
@jwt_required()
def create_supplier_product():
    """Create a new product for the supplier."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'category_id', 'brand_id', 'price', 'stock_quantity']
        for field in required_fields:
            if field not in data or data[field] is None:
                return error_response(f'{field} is required', 400)

        # Create slug from name
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', data['name'].lower().strip())
        slug = slug.strip('-')

        # Make slug unique by appending number if needed
        base_slug = slug
        counter = 1
        while Product.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create new product
        product = Product(
            name=data['name'].strip(),
            slug=slug,
            supplier_id=supplier_id,
            category_id=data['category_id'],
            brand_id=data['brand_id'],
            price=float(data['price']),
            stock_quantity=int(data['stock_quantity']),
            low_stock_threshold=int(data.get('low_stock_threshold', 10)),
            warranty_period_months=int(data.get('warranty_period_months', 12)),
            condition=data.get('condition', 'new'),
            short_description=data.get('short_description', '')[:200] if data.get('short_description') else '',
            long_description=data.get('long_description', ''),
            image_url=data.get('image_url', ''),
            specifications=data.get('specifications'),
            is_active=True
        )

        # Calculate commission
        product.calculate_commission()

        db.session.add(product)
        db.session.commit()

        return success_response(data=product.to_dict(include_supplier=True), message='Product created successfully'), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Create product error: {str(e)}")
        print(traceback.format_exc())
        return error_response(f'Failed to create product: {str(e)}', 500)


@supplier_bp.route('/products/<product_id>', methods=['GET'])
@jwt_required()
def get_supplier_product(product_id):
    """Get a specific product for the supplier (including inactive)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id

        # Find product and verify ownership (include inactive products)
        product = Product.query.filter_by(id=product_id, supplier_id=supplier_id).first()
        if not product:
            return error_response('Product not found', 404)

        return success_response(data=product.to_dict(include_supplier=True))
    except Exception as e:
        return error_response(f'Failed to fetch product: {str(e)}', 500)


@supplier_bp.route('/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_supplier_product(product_id):
    """Update a supplier's product."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id

        # Find product and verify ownership
        product = Product.query.filter_by(id=product_id, supplier_id=supplier_id).first()
        if not product:
            return error_response('Product not found', 404)

        data = request.get_json()

        # Update allowed fields
        if 'name' in data:
            product.name = data['name'].strip()
        if 'short_description' in data:
            product.short_description = data['short_description'].strip()[:200]
        if 'long_description' in data:
            product.long_description = data['long_description'].strip()
        if 'price' in data:
            product.price = float(data['price'])
            product.calculate_commission()
        if 'stock_quantity' in data:
            product.stock_quantity = int(data['stock_quantity'])
        if 'specifications' in data:
            product.specifications = data['specifications']
        if 'warranty_period_months' in data:
            product.warranty_period_months = int(data['warranty_period_months'])
        if 'image_url' in data:
            product.image_url = data['image_url']
        if 'category_id' in data:
            product.category_id = data['category_id']
        if 'brand_id' in data:
            product.brand_id = data['brand_id']
        if 'is_active' in data:
            product.is_active = data['is_active']

        db.session.commit()

        return success_response(data=product.to_dict(include_supplier=True), message='Product updated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update product: {str(e)}', 500)


@supplier_bp.route('/products/<product_id>/status', methods=['PATCH'])
@jwt_required()
def update_product_status(product_id):
    """Toggle product active status."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id

        # Find product and verify ownership
        product = Product.query.filter_by(id=product_id, supplier_id=supplier_id).first()
        if not product:
            return error_response('Product not found', 404)

        data = request.get_json()
        if 'is_active' in data:
            product.is_active = data['is_active']
            db.session.commit()

        return success_response(data=product.to_dict(include_supplier=True), message='Product status updated')
    except Exception as e:
        return error_response(f'Failed to update product: {str(e)}', 500)


@supplier_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_supplier_orders():
    """Get orders containing supplier's products."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        supplier_id = user.supplier_profile.id
        
        # Get filter params
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Query orders with supplier's items
        query = db.session.query(Order)\
            .join(OrderItem)\
            .filter(OrderItem.supplier_id == supplier_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        # Get unique orders (distinct)
        orders = query.distinct().order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # For each order, get only supplier's items
        orders_data = []
        for order in orders.items:
            order_dict = order.to_dict(include_items=False)
            
            # Get supplier's items in this order
            supplier_items = OrderItem.query.filter_by(
                order_id=order.id,
                supplier_id=supplier_id
            ).all()
            
            order_dict['items'] = [item.to_dict() for item in supplier_items]
            order_dict['supplier_earnings'] = sum(float(item.supplier_earnings) for item in supplier_items)
            orders_data.append(order_dict)
        
        return success_response(data={
            'orders': orders_data,
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch orders: {str(e)}', 500)


@supplier_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get supplier analytics."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        supplier_id = user.supplier_profile.id
        
        # Last 30 days sales
        days = 30
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        daily_sales = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(OrderItem.supplier_earnings).label('earnings'),
            func.count(OrderItem.id).label('items_sold')
        ).join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= start_date
            ).group_by(func.date(Order.created_at))\
            .order_by(func.date(Order.created_at)).all()
        
        # Top selling products
        top_products = db.session.query(
            Product.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.supplier_earnings).label('earnings')
        ).join(OrderItem)\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED
            ).group_by(Product.id, Product.name)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(10).all()
        
        # Monthly earnings (last 6 months)
        months = 6
        monthly_earnings = []
        for i in range(months):
            month_start = (datetime.utcnow().replace(day=1) - timedelta(days=30*i)).replace(hour=0, minute=0, second=0, microsecond=0)
            month_end = month_start + timedelta(days=31)
            
            earnings = db.session.query(func.sum(OrderItem.supplier_earnings))\
                .join(Order)\
                .filter(
                    OrderItem.supplier_id == supplier_id,
                    Order.payment_status == PaymentStatus.COMPLETED,
                    Order.created_at >= month_start,
                    Order.created_at < month_end
                ).scalar() or 0
            
            monthly_earnings.insert(0, {
                'month': month_start.strftime('%B %Y'),
                'earnings': float(earnings)
            })
        
        return success_response(data={
            'daily_sales': [
                {
                    'date': str(day[0]),
                    'earnings': float(day[1]) if day[1] else 0,
                    'items_sold': day[2]
                }
                for day in daily_sales
            ],
            'top_products': [
                {
                    'name': p[0],
                    'quantity_sold': p[1],
                    'earnings': float(p[2])
                }
                for p in top_products
            ],
            'monthly_earnings': monthly_earnings
        })
    except Exception as e:
        return error_response(f'Failed to fetch analytics: {str(e)}', 500)


@supplier_bp.route('/payouts', methods=['GET'])
@jwt_required()
def get_payouts():
    """Get supplier payout history."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        supplier_id = user.supplier_profile.id
        
        payouts = SupplierPayout.query.filter_by(supplier_id=supplier_id)\
            .order_by(SupplierPayout.created_at.desc()).all()
        
        return success_response(data=[p.to_dict() for p in payouts])
    except Exception as e:
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@supplier_bp.route('/payouts/pending', methods=['GET'])
@jwt_required()
def get_pending_payout():
    """Get pending earnings that haven't been paid out yet."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        supplier_id = user.supplier_profile.id
        
        # Get all completed orders not yet included in a payout
        # This is simplified - in production you'd track which orders are included in payouts
        pending_amount = db.session.query(func.sum(OrderItem.supplier_earnings))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.status.in_([OrderStatus.DELIVERED])  # Only paid out after delivery
            ).scalar() or 0
        
        # Subtract already paid amounts
        paid_amount = db.session.query(func.sum(SupplierPayout.amount))\
            .filter(
                SupplierPayout.supplier_id == supplier_id,
                SupplierPayout.status == 'completed'
            ).scalar() or 0
        
        pending = float(pending_amount) - float(paid_amount)

        return success_response(data={
            'pending_amount': max(0, pending),
            'total_earned': float(pending_amount),
            'total_paid': float(paid_amount)
        })
    except Exception as e:
        return error_response(f'Failed to fetch pending payout: {str(e)}', 500)


@supplier_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_supplier_profile():
    """Get supplier's own profile including payment details."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        return success_response(data=user.supplier_profile.to_dict())
    except Exception as e:
        return error_response(f'Failed to fetch profile: {str(e)}', 500)


@supplier_bp.route('/profile/payment-phone', methods=['PUT'])
@jwt_required()
def request_payment_phone_change():
    """Request a change to the payment phone number (requires admin approval)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        data = request.get_json()
        new_phone = data.get('new_phone')
        reason = data.get('reason', '')

        if not new_phone:
            return error_response('New phone number is required', 400)

        # Validate phone format (basic validation for Kenyan numbers)
        import re
        if not re.match(r'^(\+254|254|0)?[17]\d{8}$', new_phone):
            return error_response('Invalid phone number format', 400)

        # Normalize phone number
        if new_phone.startswith('+'):
            new_phone = new_phone[1:]
        if new_phone.startswith('0'):
            new_phone = '254' + new_phone[1:]
        if not new_phone.startswith('254'):
            new_phone = '254' + new_phone

        # Check if same as current
        if new_phone == user.supplier_profile.mpesa_number:
            return error_response('New phone is same as current phone', 400)

        # Check if there's already a pending request
        from app.models.user import PaymentPhoneChangeStatus
        if user.supplier_profile.payment_phone_change_status == PaymentPhoneChangeStatus.PENDING:
            return error_response(
                'You already have a pending phone change request. Please wait for admin review.',
                400
            )

        # Submit request
        user.supplier_profile.request_payment_phone_change(new_phone, reason)
        db.session.commit()

        return success_response(
            data=user.supplier_profile.to_dict(),
            message='Phone change request submitted. Awaiting admin approval.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to submit request: {str(e)}', 500)


@supplier_bp.route('/profile/payment-phone/cancel', methods=['POST'])
@jwt_required()
def cancel_payment_phone_request():
    """Cancel a pending payment phone change request."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        from app.models.user import PaymentPhoneChangeStatus
        if user.supplier_profile.payment_phone_change_status != PaymentPhoneChangeStatus.PENDING:
            return error_response('No pending request to cancel', 400)

        user.supplier_profile.payment_phone_pending = None
        user.supplier_profile.payment_phone_change_status = None
        user.supplier_profile.payment_phone_change_requested_at = None
        user.supplier_profile.payment_phone_change_reason = None

        db.session.commit()

        return success_response(
            data=user.supplier_profile.to_dict(),
            message='Phone change request cancelled'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel request: {str(e)}', 500)
