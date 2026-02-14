from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import db
from app.models.user import User, UserRole, CustomerProfile
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product, Category
from app.models.returns import Return, ReturnStatus, SupplierPayout
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
        total_returns = db.session.query(func.count(Return.id.distinct()))\
            .join(Order, Return.order_id == Order.id)\
            .join(OrderItem, OrderItem.order_id == Order.id)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .scalar() or 0
        
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

        return success_response(data=product.to_dict(include_supplier=True), message='Product created successfully', status_code=201)
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


@supplier_bp.route('/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier_product(product_id):
    """Delete a supplier's product."""
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

        # Check if product has orders
        has_orders = OrderItem.query.filter_by(product_id=product_id).first()
        if has_orders:
            return error_response('Cannot delete product with existing orders. Deactivate it instead.', 400)

        db.session.delete(product)
        db.session.commit()

        return success_response(message='Product deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete product: {str(e)}', 500)


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
            
            # Extract customer info from the order's customer dict
            if order_dict.get('customer'):
                order_dict['customer_name'] = order_dict['customer'].get('name', 'N/A')
                order_dict['customer_email'] = order_dict['customer'].get('email', 'N/A')
                order_dict['customer_phone'] = order_dict['customer'].get('phone', 'N/A')
            else:
                order_dict['customer_name'] = 'N/A'
                order_dict['customer_email'] = 'N/A'
                order_dict['customer_phone'] = 'N/A'
            
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
    """Get comprehensive enterprise-level supplier analytics."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)
        
        supplier_id = user.supplier_profile.id
        
        # Date ranges
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        last_year_start = year_start.replace(year=year_start.year - 1)
        days_30_ago = now - timedelta(days=30)
        days_90_ago = now - timedelta(days=90)
        
        # === DAILY SALES (Last 30 days) ===
        daily_sales = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(OrderItem.supplier_earnings).label('earnings'),
            func.count(OrderItem.id).label('items_sold'),
            func.count(func.distinct(Order.id)).label('orders')
        ).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= days_30_ago
        ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at)).all()
        
        # === TOP PRODUCTS ===
        top_products = db.session.query(
            Product.id, Product.name, Product.price,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.supplier_earnings).label('earnings'),
            func.count(func.distinct(Order.id)).label('orders')
        ).select_from(Product).join(OrderItem, OrderItem.product_id == Product.id).join(Order, Order.id == OrderItem.order_id).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(Product.id, Product.name, Product.price).order_by(func.sum(OrderItem.quantity).desc()).limit(10).all()
        
        # === MONTHLY EARNINGS (Last 12 months) ===
        monthly_earnings = []
        for i in range(12):
            m_start = (month_start - timedelta(days=30*i)).replace(day=1)
            m_end = (m_start + timedelta(days=32)).replace(day=1)
            
            earnings = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= m_start,
                Order.created_at < m_end
            ).scalar() or 0
            
            orders = db.session.query(func.count(func.distinct(Order.id))).join(OrderItem).filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= m_start,
                Order.created_at < m_end
            ).scalar() or 0
            
            monthly_earnings.insert(0, {
                'month': m_start.strftime('%b %Y'),
                'earnings': float(earnings),
                'orders': orders
            })
        
        # === CATEGORY PERFORMANCE ===
        category_performance = db.session.query(
            Category.name,
            func.sum(OrderItem.supplier_earnings).label('earnings'),
            func.sum(OrderItem.quantity).label('quantity')
        ).select_from(Category).join(Product, Product.category_id == Category.id).join(OrderItem, OrderItem.product_id == Product.id).join(Order, Order.id == OrderItem.order_id).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(Category.id, Category.name).order_by(func.sum(OrderItem.supplier_earnings).desc()).all()
        
        # === RETURN RATE ANALYSIS ===
        total_items_sold = db.session.query(func.sum(OrderItem.quantity)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        supplier_order_ids = db.session.query(OrderItem.order_id).filter(OrderItem.supplier_id == supplier_id).distinct().subquery()
        total_returns = Return.query.filter(Return.order_id.in_(supplier_order_ids)).count()
        return_rate = (total_returns / total_items_sold * 100) if total_items_sold > 0 else 0
        
        returns_by_reason = db.session.query(
            Return.reason,
            func.count(Return.id).label('count')
        ).filter(Return.order_id.in_(supplier_order_ids)).group_by(Return.reason).all()
        
        # === PROFIT MARGIN ANALYSIS ===
        total_revenue = db.session.query(func.sum(OrderItem.supplier_earnings + OrderItem.platform_commission)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        total_earnings = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        platform_commission = float(total_revenue) - float(total_earnings)
        profit_margin = (float(total_earnings) / float(total_revenue) * 100) if total_revenue > 0 else 0
        
        # === INVENTORY TURNOVER ===
        products = Product.query.filter_by(supplier_id=supplier_id, is_active=True).all()
        avg_inventory = sum(p.stock_quantity for p in products) / len(products) if products else 0
        inventory_turnover = (float(total_items_sold) / avg_inventory) if avg_inventory > 0 else 0
        
        # === CUSTOMER METRICS ===
        unique_customers = db.session.query(func.count(func.distinct(Order.customer_id))).join(OrderItem).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        repeat_customers = db.session.query(Order.customer_id).join(OrderItem).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED
        ).group_by(Order.customer_id).having(func.count(Order.id) > 1).count()
        
        repeat_rate = (repeat_customers / unique_customers * 100) if unique_customers > 0 else 0
        
        # === AVERAGE ORDER VALUE ===
        aov_data = db.session.query(
            func.date(Order.created_at).label('date'),
            func.avg(OrderItem.supplier_earnings).label('aov')
        ).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= days_30_ago
        ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at)).all()
        
        # === GROWTH METRICS ===
        this_month_sales = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= month_start
        ).scalar() or 0
        
        last_month_sales = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= last_month_start,
            Order.created_at < month_start
        ).scalar() or 0
        
        mom_growth = ((float(this_month_sales) - float(last_month_sales)) / float(last_month_sales) * 100) if last_month_sales > 0 else 0
        
        this_year_sales = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= year_start
        ).scalar() or 0
        
        last_year_sales = db.session.query(func.sum(OrderItem.supplier_earnings)).join(Order).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= last_year_start,
            Order.created_at < year_start
        ).scalar() or 0
        
        yoy_growth = ((float(this_year_sales) - float(last_year_sales)) / float(last_year_sales) * 100) if last_year_sales > 0 else 0
        
        # === PEAK HOURS ANALYSIS ===
        peak_hours = db.session.query(
            func.extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('orders'),
            func.sum(OrderItem.supplier_earnings).label('earnings')
        ).join(OrderItem).filter(
            OrderItem.supplier_id == supplier_id,
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= days_90_ago
        ).group_by(func.extract('hour', Order.created_at)).order_by(func.extract('hour', Order.created_at)).all()
        
        # === LOW STOCK ALERTS ===
        low_stock_products = Product.query.filter(
            Product.supplier_id == supplier_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold
        ).order_by(Product.stock_quantity).limit(10).all()
        
        return success_response(data={
            'daily_sales': [{'date': str(d[0]), 'earnings': float(d[1] or 0), 'items_sold': d[2], 'orders': d[3]} for d in daily_sales],
            'top_products': [{'id': p[0], 'name': p[1], 'price': float(p[2]), 'quantity_sold': p[3], 'earnings': float(p[4]), 'orders': p[5]} for p in top_products],
            'monthly_earnings': monthly_earnings,
            'category_performance': [{'name': c[0], 'earnings': float(c[1]), 'quantity': c[2]} for c in category_performance],
            'return_analysis': {
                'total_returns': total_returns,
                'return_rate': round(return_rate, 2),
                'by_reason': [{'reason': r[0], 'count': r[1]} for r in returns_by_reason]
            },
            'profit_metrics': {
                'total_revenue': float(total_revenue),
                'total_earnings': float(total_earnings),
                'platform_commission': float(platform_commission),
                'profit_margin': round(profit_margin, 2)
            },
            'inventory_metrics': {
                'turnover_rate': round(inventory_turnover, 2),
                'avg_inventory': round(avg_inventory, 2),
                'low_stock_count': len(low_stock_products),
                'low_stock_products': [{'id': p.id, 'name': p.name, 'stock': p.stock_quantity, 'threshold': p.low_stock_threshold} for p in low_stock_products]
            },
            'customer_metrics': {
                'unique_customers': unique_customers,
                'repeat_customers': repeat_customers,
                'repeat_rate': round(repeat_rate, 2)
            },
            'aov_trend': [{'date': str(a[0]), 'aov': float(a[1] or 0)} for a in aov_data],
            'growth_metrics': {
                'mom_growth': round(mom_growth, 2),
                'yoy_growth': round(yoy_growth, 2),
                'this_month': float(this_month_sales),
                'last_month': float(last_month_sales),
                'this_year': float(this_year_sales),
                'last_year': float(last_year_sales)
            },
            'peak_hours': [{'hour': int(h[0]), 'orders': h[1], 'earnings': float(h[2])} for h in peak_hours]
        })
    except Exception as e:
        import traceback
        print(f"Analytics error: {str(e)}")
        print(traceback.format_exc())
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


# ===================== SUPPLIER RETURNS MANAGEMENT =====================

@supplier_bp.route('/returns', methods=['GET'])
@jwt_required()
def get_supplier_returns():
    """Get returns for supplier's products with filtering and pagination."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        if not user.supplier_profile:
            return error_response('Supplier profile not found', 404)

        supplier_id = user.supplier_profile.id
        status_filter = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        # Subquery: order IDs that contain this supplier's products
        supplier_order_ids = db.session.query(OrderItem.order_id)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .distinct().subquery()

        query = Return.query.filter(Return.order_id.in_(supplier_order_ids))

        if status_filter and status_filter != 'all':
            try:
                query = query.filter(Return.status == status_filter)
            except Exception:
                pass

        returns = query.order_by(Return.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'returns': [r.to_dict() for r in returns.items],
            'pagination': {
                'page': returns.page,
                'per_page': returns.per_page,
                'total': returns.total,
                'pages': returns.pages
            }
        })
    except Exception as e:
        return success_response(data={'returns': [], 'pagination': {'page': 1, 'per_page': 20, 'total': 0, 'pages': 0}})


@supplier_bp.route('/returns/stats', methods=['GET'])
@jwt_required()
def get_supplier_return_stats():
    """Get return statistics for supplier."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        supplier_id = user.supplier_profile.id

        # Subquery: order IDs that contain this supplier's products
        supplier_order_ids = db.session.query(OrderItem.order_id)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .distinct().subquery()

        base_query = Return.query.filter(Return.order_id.in_(supplier_order_ids))

        total = base_query.count()

        try:
            pending = base_query.filter(
                Return.status.in_(['requested', 'pending', 'supplier_review'])
            ).count()
        except Exception:
            pending = 0

        try:
            needs_response = base_query.filter(
                Return.supplier_action.is_(None),
                Return.status.in_(['requested', 'pending', 'supplier_review'])
            ).count()
        except Exception:
            needs_response = 0

        try:
            disputed = base_query.filter(Return.status == 'disputed').count()
        except Exception:
            disputed = 0
            
        try:
            approved = base_query.filter(Return.status == 'approved').count()
        except Exception:
            approved = 0
            
        try:
            completed = base_query.filter(
                Return.status.in_(['completed', 'refund_completed'])
            ).count()
        except Exception:
            completed = 0

        try:
            total_deductions = db.session.query(func.sum(Return.supplier_deduction))\
                .filter(
                    Return.order_id.in_(supplier_order_ids),
                    Return.status.in_(['approved', 'completed', 'refund_completed'])
                ).scalar() or 0
        except Exception:
            total_deductions = 0

        return success_response(data={
            'total': total,
            'pending': pending,
            'needs_response': needs_response,
            'disputed': disputed,
            'approved': approved,
            'completed': completed,
            'total_deductions': float(total_deductions)
        })
    except Exception as e:
        return success_response(data={
            'total': 0,
            'pending': 0,
            'needs_response': 0,
            'disputed': 0,
            'approved': 0,
            'completed': 0,
            'total_deductions': 0
        })


@supplier_bp.route('/returns/<return_id>', methods=['GET'])
@jwt_required()
def get_supplier_return_detail(return_id):
    """Get single return detail for supplier."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)

        # Verify supplier owns a product in this return's order
        has_items = OrderItem.query.filter_by(
            order_id=return_request.order_id,
            supplier_id=user.supplier_profile.id
        ).first()
        if not has_items:
            return error_response('Unauthorized', 403)

        return success_response(data=return_request.to_dict())
    except Exception as e:
        return error_response(f'Failed to fetch return: {str(e)}', 500)


@supplier_bp.route('/returns/<return_id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_return(return_id):
    """Supplier acknowledges they have seen the return request."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)

        has_items = OrderItem.query.filter_by(
            order_id=return_request.order_id,
            supplier_id=user.supplier_profile.id
        ).first()
        if not has_items:
            return error_response('Unauthorized', 403)

        if return_request.supplier_acknowledged:
            return error_response('Already acknowledged', 400)

        return_request.supplier_acknowledged = True
        return_request.supplier_acknowledged_at = datetime.utcnow()

        db.session.commit()

        return success_response(
            data=return_request.to_dict(),
            message='Return acknowledged successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to acknowledge return: {str(e)}', 500)


@supplier_bp.route('/returns/<return_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_return(return_id):
    """Supplier responds to a return request (accept or dispute)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can access this', 403)

        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)

        has_items = OrderItem.query.filter_by(
            order_id=return_request.order_id,
            supplier_id=user.supplier_profile.id
        ).first()
        if not has_items:
            return error_response('Unauthorized', 403)

        if return_request.status not in ['requested', 'pending', 'supplier_review']:
            return error_response('Cannot respond to a return in this status', 400)

        data = request.get_json()
        action = data.get('action')

        if action not in ['accept', 'dispute']:
            return error_response('Action must be "accept" or "dispute"', 400)

        # Auto-acknowledge if not already done
        if not return_request.supplier_acknowledged:
            return_request.supplier_acknowledged = True
            return_request.supplier_acknowledged_at = datetime.utcnow()

        return_request.supplier_action = action
        return_request.supplier_action_at = datetime.utcnow()
        return_request.supplier_response = data.get('response', '').strip()
        return_request.supplier_evidence = data.get('evidence', [])

        if action == 'dispute':
            dispute_reason = data.get('dispute_reason', '').strip()
            if not dispute_reason:
                return error_response('Dispute reason is required', 400)
            return_request.supplier_dispute_reason = dispute_reason
            return_request.status = 'disputed'
        else:
            # Supplier accepts -- move to pending admin review
            return_request.status = 'pending_review'

        db.session.commit()

        return success_response(
            data=return_request.to_dict(),
            message=f'Return {action}ed successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to respond to return: {str(e)}', 500)
