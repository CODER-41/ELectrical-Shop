from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc, case
from app.models import db
from app.models.user import User, UserRole, SupplierProfile, PaymentPhoneChangeStatus
from app.models.order import Order, OrderItem, OrderStatus, DeliveryZone, PaymentMethod, PaymentStatus
from app.models.product import Product, Category, Brand
from app.models.returns import Return, SupplierPayout, ReturnStatus, RefundPolicy
from app.utils.validation import validate_required_fields
from app.utils.responses import success_response, error_response
from app.services.mpesa_service import mpesa_service

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def require_admin(func):
    """Decorator to require admin role."""
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in [UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.PRODUCT_MANAGER]:
            return error_response('Admin access required', 403)
        
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_admin
def get_dashboard():
    """Get admin dashboard with KPIs."""
    try:
        # Users
        total_users = User.query.count()
        customers = User.query.filter_by(role=UserRole.CUSTOMER).count()
        suppliers = User.query.filter_by(role=UserRole.SUPPLIER).count()
        pending_suppliers = SupplierProfile.query.filter_by(is_approved=False).count()
        
        # Products
        total_products = Product.query.count()
        active_products = Product.query.filter_by(is_active=True).count()
        low_stock = Product.query.filter(
            Product.is_active == True,
            Product.stock_quantity <= 10
        ).count()
        
        # Orders
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        paid_orders = Order.query.filter_by(payment_status=PaymentStatus.COMPLETED).count()
        
        # Revenue (completed payments only)
        total_revenue = db.session.query(func.sum(Order.total))\
            .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        
        # This month revenue
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= month_start
            ).scalar() or 0
        
        # Platform commission (25% of total)
        try:
            platform_earnings = db.session.query(func.sum(OrderItem.platform_commission))\
                .join(Order)\
                .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        except Exception:
            # Fallback if column doesn't exist yet
            platform_earnings = total_revenue * 0.25
        
        # Returns
        try:
            pending_returns = Return.query.filter(
                Return.status.in_(['pending', 'requested', 'pending_review', 'supplier_review', 'disputed'])
            ).count()
        except Exception:
            pending_returns = 0
        
        return success_response(data={
            'users': {
                'total': total_users,
                'customers': customers,
                'suppliers': suppliers,
                'pending_suppliers': pending_suppliers
            },
            'products': {
                'total': total_products,
                'active': active_products,
                'low_stock': low_stock
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'paid': paid_orders
            },
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(month_revenue),
                'platform_earnings': float(platform_earnings)
            },
            'returns': {
                'pending': pending_returns
            }
        })
    except Exception as e:
        current_app.logger.error(f'Dashboard error: {str(e)}')
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@require_admin
def get_analytics():
    """Get enterprise-level analytics with comprehensive metrics."""
    try:
        # Daily revenue (last 30 days)
        end_date = datetime.utcnow()
        start_date_30 = end_date - timedelta(days=30)
        start_date_90 = end_date - timedelta(days=90)
        start_date_12m = end_date - timedelta(days=365)
        
        daily_revenue = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total).label('revenue'),
            func.count(Order.id).label('orders'),
            func.sum(OrderItem.quantity).label('items_sold')
        ).join(OrderItem)\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= start_date_30
            ).group_by(func.date(Order.created_at))\
            .order_by(func.date(Order.created_at)).all()
        
        # Monthly revenue (last 12 months)
        monthly_revenue = db.session.query(
            func.to_char(Order.created_at, 'YYYY-MM').label('month'),
            func.sum(Order.total).label('revenue'),
            func.sum(OrderItem.platform_commission).label('commission'),
            func.count(Order.id).label('orders')
        ).join(OrderItem)\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= start_date_12m
            ).group_by(func.to_char(Order.created_at, 'YYYY-MM'))\
            .order_by(func.to_char(Order.created_at, 'YYYY-MM')).all()
        
        # Top products
        top_products = db.session.query(
            Product.name,
            Product.image_url,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.subtotal).label('revenue'),
            func.count(func.distinct(Order.id)).label('orders')
        ).select_from(Product)\
            .join(OrderItem, OrderItem.product_id == Product.id)\
            .join(Order, Order.id == OrderItem.order_id)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(Product.id, Product.name, Product.image_url)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(20).all()
        
        # Top suppliers with performance metrics
        top_suppliers = db.session.query(
            SupplierProfile.id,
            SupplierProfile.business_name,
            func.count(func.distinct(Order.id)).label('orders'),
            func.sum(OrderItem.supplier_earnings).label('earnings'),
            func.sum(OrderItem.quantity).label('items_sold'),
            func.avg(OrderItem.subtotal).label('avg_order_value')
        ).select_from(SupplierProfile)\
            .join(OrderItem, OrderItem.supplier_id == SupplierProfile.id)\
            .join(Order, Order.id == OrderItem.order_id)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(SupplierProfile.id, SupplierProfile.business_name)\
            .order_by(func.sum(OrderItem.supplier_earnings).desc())\
            .limit(20).all()
        
        # Order status distribution
        order_status = db.session.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        # Payment methods
        payment_methods = db.session.query(
            Order.payment_method,
            func.count(Order.id).label('count'),
            func.sum(Order.total).label('revenue')
        ).filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(Order.payment_method).all()
        
        # Category performance
        category_performance = db.session.query(
            Category.name,
            func.sum(OrderItem.subtotal).label('revenue'),
            func.sum(OrderItem.quantity).label('quantity'),
            func.count(func.distinct(Order.id)).label('orders')
        ).select_from(Category)\
            .join(Product, Product.category_id == Category.id)\
            .join(OrderItem, OrderItem.product_id == Product.id)\
            .join(Order, Order.id == OrderItem.order_id)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(Category.id, Category.name)\
            .order_by(func.sum(OrderItem.subtotal).desc()).all()
        
        # User growth (last 12 months)
        user_growth = db.session.query(
            func.to_char(User.created_at, 'YYYY-MM').label('month'),
            func.sum(case((User.role == UserRole.CUSTOMER, 1), else_=0)).label('customers'),
            func.sum(case((User.role == UserRole.SUPPLIER, 1), else_=0)).label('suppliers'),
            func.sum(case((User.role == UserRole.DELIVERY_AGENT, 1), else_=0)).label('delivery_agents')
        ).filter(User.created_at >= start_date_12m)\
            .group_by(func.to_char(User.created_at, 'YYYY-MM'))\
            .order_by(func.to_char(User.created_at, 'YYYY-MM')).all()
        
        # Customer metrics
        total_customers = User.query.filter_by(role=UserRole.CUSTOMER).count()
        customers_with_orders = db.session.query(func.count(func.distinct(Order.customer_id)))\
            .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        repeat_customers = db.session.query(func.count(func.distinct(Order.customer_id)))\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(Order.customer_id)\
            .having(func.count(Order.id) > 1).count()
        
        # AOV trend (last 30 days)
        aov_trend = db.session.query(
            func.date(Order.created_at).label('date'),
            func.avg(Order.total).label('aov')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= start_date_30
        ).group_by(func.date(Order.created_at))\
            .order_by(func.date(Order.created_at)).all()
        
        # Peak hours (last 90 days)
        peak_hours = db.session.query(
            func.extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('orders'),
            func.sum(Order.total).label('revenue')
        ).filter(
            Order.payment_status == PaymentStatus.COMPLETED,
            Order.created_at >= start_date_90
        ).group_by(func.extract('hour', Order.created_at))\
            .order_by(func.extract('hour', Order.created_at)).all()
        
        # Growth metrics (MoM, YoY)
        this_month_start = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        this_year_start = end_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        last_year_start = this_year_start.replace(year=this_year_start.year - 1)
        
        this_month_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= this_month_start
            ).scalar() or 0
        
        last_month_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= last_month_start,
                Order.created_at < this_month_start
            ).scalar() or 0
        
        this_year_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= this_year_start
            ).scalar() or 0
        
        last_year_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= last_year_start,
                Order.created_at < this_year_start
            ).scalar() or 0
        
        mom_growth = ((float(this_month_revenue) - float(last_month_revenue)) / float(last_month_revenue) * 100) if last_month_revenue > 0 else 0
        yoy_growth = ((float(this_year_revenue) - float(last_year_revenue)) / float(last_year_revenue) * 100) if last_year_revenue > 0 else 0
        
        # Platform commission metrics
        total_commission = db.session.query(func.sum(OrderItem.platform_commission))\
            .join(Order)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        
        total_revenue = db.session.query(func.sum(Order.total))\
            .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        
        # Return analysis
        total_returns = Return.query.count()
        return_rate = (total_returns / Order.query.filter_by(payment_status=PaymentStatus.COMPLETED).count() * 100) if Order.query.filter_by(payment_status=PaymentStatus.COMPLETED).count() > 0 else 0
        
        return_by_reason = db.session.query(
            Return.reason,
            func.count(Return.id).label('count')
        ).group_by(Return.reason).all()
        
        # Delivery metrics
        total_delivery_agents = User.query.filter_by(role=UserRole.DELIVERY_AGENT).count()
        active_delivery_agents = db.session.query(func.count(func.distinct(Order.assigned_delivery_agent)))\
            .filter(
                Order.status == OrderStatus.DELIVERED,
                Order.created_at >= start_date_30
            ).scalar() or 0
        
        avg_delivery_time = db.session.query(
            func.avg(func.extract('epoch', Order.updated_at - Order.created_at) / 86400)
        ).filter(
            Order.status == OrderStatus.DELIVERED,
            Order.created_at >= start_date_30
        ).scalar() or 0
        
        # Geographic distribution (by delivery zone)
        geographic_revenue = db.session.query(
            DeliveryZone.name,
            func.count(Order.id).label('orders'),
            func.sum(Order.total).label('revenue')
        ).select_from(DeliveryZone)\
            .join(Order, Order.delivery_zone == DeliveryZone.name)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(DeliveryZone.id, DeliveryZone.name)\
            .order_by(func.sum(Order.total).desc()).all()
        
        return success_response(data={
            'daily_revenue': [{'date': str(d[0]), 'revenue': float(d[1] or 0), 'orders': d[2], 'items_sold': d[3]} for d in daily_revenue],
            'monthly_revenue': [{'month': m[0], 'revenue': float(m[1] or 0), 'commission': float(m[2] or 0), 'orders': m[3]} for m in monthly_revenue],
            'top_products': [{'name': p[0], 'image': p[1], 'quantity_sold': p[2], 'revenue': float(p[3]), 'orders': p[4]} for p in top_products],
            'top_suppliers': [{'id': s[0], 'business_name': s[1], 'orders': s[2], 'earnings': float(s[3]), 'items_sold': s[4], 'avg_order_value': float(s[5] or 0)} for s in top_suppliers],
            'order_status': [{'status': s[0].value, 'count': s[1]} for s in order_status],
            'payment_methods': [{'method': pm[0].value, 'count': pm[1], 'revenue': float(pm[2])} for pm in payment_methods],
            'category_performance': [{'name': c[0], 'revenue': float(c[1]), 'quantity': c[2], 'orders': c[3]} for c in category_performance],
            'user_growth': [{'month': u[0], 'customers': u[1], 'suppliers': u[2], 'delivery_agents': u[3]} for u in user_growth],
            'customer_metrics': {
                'total_customers': total_customers,
                'customers_with_orders': customers_with_orders,
                'repeat_customers': repeat_customers,
                'repeat_rate': (repeat_customers / customers_with_orders * 100) if customers_with_orders > 0 else 0,
                'conversion_rate': (customers_with_orders / total_customers * 100) if total_customers > 0 else 0
            },
            'aov_trend': [{'date': str(a[0]), 'aov': float(a[1] or 0)} for a in aov_trend],
            'peak_hours': [{'hour': int(h[0]), 'orders': h[1], 'revenue': float(h[2])} for h in peak_hours],
            'growth_metrics': {
                'mom_growth': round(mom_growth, 2),
                'yoy_growth': round(yoy_growth, 2),
                'this_month': float(this_month_revenue),
                'last_month': float(last_month_revenue),
                'this_year': float(this_year_revenue),
                'last_year': float(last_year_revenue)
            },
            'platform_metrics': {
                'total_commission': float(total_commission),
                'total_revenue': float(total_revenue),
                'commission_rate': (float(total_commission) / float(total_revenue) * 100) if total_revenue > 0 else 0
            },
            'return_analysis': {
                'total_returns': total_returns,
                'return_rate': round(return_rate, 2),
                'by_reason': [{'reason': r[0], 'count': r[1]} for r in return_by_reason]
            },
            'delivery_metrics': {
                'total_agents': total_delivery_agents,
                'active_agents': active_delivery_agents,
                'avg_delivery_days': round(float(avg_delivery_time), 1)
            },
            'geographic_revenue': [{'zone': g[0], 'orders': g[1], 'revenue': float(g[2])} for g in geographic_revenue]
        })
    except Exception as e:
        current_app.logger.error(f'Analytics error: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to fetch analytics: {str(e)}', 500)


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin
def get_users():
    """Get all users with filtering."""
    try:
        role = request.args.get('role')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        
        if search:
            query = query.filter(User.email.ilike(f'%{search}%'))
        
        users = query.order_by(User.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'users': [u.to_dict() for u in users.items],
            'pagination': {
                'page': users.page,
                'per_page': users.per_page,
                'total': users.total,
                'pages': users.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch users: {str(e)}', 500)


@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@jwt_required()
@require_admin
@validate_required_fields(['action'])
def update_user_status(user_id):
    """Approve, suspend, or activate user."""
    try:
        from app.services.notification_service import notification_service
        
        admin_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        action = data['action']  # approve, suspend, activate
        
        if action == 'approve' and user.role == UserRole.SUPPLIER:
            user.supplier_profile.is_approved = True
            message = 'Supplier approved successfully'
            
            # Audit log
            notification_service.create_audit_log(
                action='supplier_approved',
                entity_type='supplier',
                entity_id=user.supplier_profile.id,
                user_id=admin_id,
                description=f"Supplier '{user.supplier_profile.business_name}' approved"
            )
            
            # Notify supplier
            notification_service.create_notification(
                user_id=user.id,
                title='Supplier Account Approved',
                message='Congratulations! Your supplier account has been approved. You can now start listing products.',
                notification_type='success',
                link='/supplier/dashboard'
            )
            
        elif action == 'suspend':
            user.is_active = False
            message = 'User suspended successfully'
            
            notification_service.create_audit_log(
                action='user_suspended',
                entity_type='user',
                entity_id=user.id,
                user_id=admin_id,
                description=f"User '{user.email}' suspended"
            )
            
            notification_service.create_notification(
                user_id=user.id,
                title='Account Suspended',
                message='Your account has been suspended. Please contact support for more information.',
                notification_type='warning'
            )
            
        elif action == 'activate':
            user.is_active = True
            message = 'User activated successfully'
            
            notification_service.create_audit_log(
                action='user_activated',
                entity_type='user',
                entity_id=user.id,
                user_id=admin_id,
                description=f"User '{user.email}' activated"
            )
            
            notification_service.create_notification(
                user_id=user.id,
                title='Account Activated',
                message='Your account has been activated. You can now access the platform.',
                notification_type='success'
            )
        else:
            return error_response('Invalid action', 400)
        
        db.session.commit()
        
        return success_response(
            data=user.to_dict(),
            message=message
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update user: {str(e)}', 500)


@admin_bp.route('/delivery-zones', methods=['GET'])
@jwt_required()
@require_admin
def get_all_delivery_zones():
    """Get all delivery zones (including inactive)."""
    try:
        zones = DeliveryZone.query.all()
        return success_response(data=[z.to_dict() for z in zones])
    except Exception as e:
        return error_response(f'Failed to fetch delivery zones: {str(e)}', 500)


@admin_bp.route('/delivery-zones', methods=['POST'])
@jwt_required()
@require_admin
@validate_required_fields(['name', 'counties', 'delivery_fee', 'estimated_days'])
def create_delivery_zone():
    """Create new delivery zone."""
    try:
        data = request.get_json()
        
        zone = DeliveryZone(
            name=data['name'].strip(),
            counties=data['counties'],  # Array of counties
            delivery_fee=data['delivery_fee'],
            estimated_days=data['estimated_days'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(zone)
        db.session.commit()
        
        return success_response(
            data=zone.to_dict(),
            message='Delivery zone created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create delivery zone: {str(e)}', 500)


@admin_bp.route('/delivery-zones/<zone_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_delivery_zone(zone_id):
    """Update delivery zone."""
    try:
        zone = DeliveryZone.query.get(zone_id)
        if not zone:
            return error_response('Delivery zone not found', 404)
        
        data = request.get_json()
        
        if 'name' in data:
            zone.name = data['name'].strip()
        if 'counties' in data:
            zone.counties = data['counties']
        if 'delivery_fee' in data:
            zone.delivery_fee = data['delivery_fee']
        if 'estimated_days' in data:
            zone.estimated_days = data['estimated_days']
        if 'is_active' in data:
            zone.is_active = data['is_active']
        
        db.session.commit()
        
        return success_response(
            data=zone.to_dict(),
            message='Delivery zone updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update delivery zone: {str(e)}', 500)


@admin_bp.route('/categories', methods=['GET', 'POST'])
@jwt_required()
@require_admin
def manage_categories():
    """Get or create categories."""
    if request.method == 'GET':
        categories = Category.query.all()
        return success_response(data=[c.to_dict() for c in categories])
    
    # POST - Create category
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return error_response('Category name is required', 400)
        
        category = Category(
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            suggested_specs=data.get('suggested_specs', [])
        )
        
        db.session.add(category)
        db.session.commit()
        
        return success_response(
            data=category.to_dict(),
            message='Category created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create category: {str(e)}', 500)


@admin_bp.route('/brands', methods=['GET', 'POST'])
@jwt_required()
@require_admin
def manage_brands():
    """Get or create brands."""
    if request.method == 'GET':
        brands = Brand.query.all()
        return success_response(data=[b.to_dict() for b in brands])
    
    # POST - Create brand
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return error_response('Brand name is required', 400)
        
        brand = Brand(
            name=data['name'].strip(),
            description=data.get('description', '').strip()
        )
        
        db.session.add(brand)
        db.session.commit()
        
        return success_response(
            data=brand.to_dict(),
            message='Brand created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create brand: {str(e)}', 500)


@admin_bp.route('/payouts/generate', methods=['POST'])
@jwt_required()
@require_admin
def generate_payouts():
    """Generate payouts for suppliers (weekly/monthly)."""
    try:
        data = request.get_json() or {}
        end_date = datetime.utcnow()
        period = data.get('period', 'weekly')
        
        if period == 'weekly':
            start_date = end_date - timedelta(days=7)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get all suppliers with delivered orders in period
        suppliers = db.session.query(SupplierProfile.id).distinct()\
            .join(OrderItem)\
            .join(Order)\
            .filter(
                Order.status == OrderStatus.DELIVERED,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= start_date,
                Order.created_at <= end_date
            ).all()
        
        payouts_created = 0
        
        for (supplier_id,) in suppliers:
            # Calculate gross amount
            gross = db.session.query(func.sum(OrderItem.supplier_earnings))\
                .join(Order)\
                .filter(
                    OrderItem.supplier_id == supplier_id,
                    Order.status == OrderStatus.DELIVERED,
                    Order.payment_status == PaymentStatus.COMPLETED,
                    Order.created_at >= start_date,
                    Order.created_at <= end_date
                ).scalar() or 0
            
            if float(gross) <= 0:
                continue
            
            # Create payout
            payout = SupplierPayout(
                supplier_id=supplier_id,
                amount=gross,
                status='pending',
                notes=f'{period.capitalize()} payout: {start_date.date()} to {end_date.date()}'
            )
            
            db.session.add(payout)
            payouts_created += 1
        
        db.session.commit()
        
        return success_response(
            data={'payouts_created': payouts_created},
            message=f'Generated {payouts_created} payouts successfully'
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate payouts error: {str(e)}')
        return error_response(f'Failed to generate payouts: {str(e)}', 500)


@admin_bp.route('/payouts', methods=['GET'])
@jwt_required()
@require_admin
def get_all_payouts():
    """Get all payouts with filtering."""
    try:
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = SupplierPayout.query
        
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        payouts = query.order_by(SupplierPayout.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Enrich with supplier details
        payout_list = []
        for p in payouts.items:
            payout_dict = p.to_dict()
            if p.supplier:
                payout_dict['supplier'] = {
                    'id': p.supplier.id,
                    'business_name': p.supplier.business_name,
                    'contact_person': p.supplier.contact_person,
                    'mpesa_number': p.supplier.mpesa_number
                }
            payout_list.append(payout_dict)
        
        return success_response(data={
            'payouts': payout_list,
            'pagination': {
                'page': payouts.page,
                'per_page': payouts.per_page,
                'total': payouts.total,
                'pages': payouts.pages
            }
        })
    except Exception as e:
        current_app.logger.error(f'Get payouts error: {str(e)}')
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@admin_bp.route('/payouts/<payout_id>/process', methods=['PUT'])
@jwt_required()
@require_admin
def process_payout(payout_id):
    """Mark payout as processed (manual processing)."""
    try:
        from app.services.notification_service import notification_service
        
        admin_id = get_jwt_identity()
        payout = SupplierPayout.query.get(payout_id)
        if not payout:
            return error_response('Payout not found', 404)

        data = request.get_json()

        payout.status = 'completed'
        payout.payment_reference = data.get('payment_reference')
        payout.paid_at = datetime.utcnow()

        if 'notes' in data:
            payout.notes = data['notes']

        db.session.commit()
        
        # Audit log
        notification_service.create_audit_log(
            action='payout_processed',
            entity_type='payout',
            entity_id=payout.id,
            user_id=admin_id,
            description=f"Payout {payout.payout_number} processed - Amount: KES {payout.amount}"
        )
        
        # Notify supplier
        if payout.supplier:
            notification_service.create_notification(
                user_id=payout.supplier.user_id,
                title='Payout Processed',
                message=f'Your payout of KES {payout.amount:,.2f} has been processed successfully.',
                notification_type='success',
                link='/supplier/payouts'
            )

        return success_response(
            data=payout.to_dict(),
            message='Payout processed successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process payout: {str(e)}', 500)


@admin_bp.route('/payouts/<payout_id>/mpesa', methods=['POST'])
@jwt_required()
@require_admin
def initiate_mpesa_payout(payout_id):
    """Initiate M-Pesa B2C payment for a supplier payout."""
    try:
        payout = SupplierPayout.query.get(payout_id)
        if not payout:
            return error_response('Payout not found', 404)

        if payout.status == 'completed':
            return error_response('Payout already completed', 400)

        if payout.status == 'processing':
            return error_response('Payout is already being processed', 400)

        # Get supplier details
        supplier = SupplierProfile.query.get(payout.supplier_id)
        if not supplier:
            return error_response('Supplier not found', 404)

        if not supplier.mpesa_number:
            return error_response('Supplier has no M-Pesa number configured', 400)

        # Validate phone number
        is_valid, result = mpesa_service.validate_phone_number(supplier.mpesa_number)
        if not is_valid:
            return error_response(f'Invalid M-Pesa number: {result}', 400)

        # Generate payout number if not exists
        if not payout.payout_number:
            payout.generate_payout_number()

        # Set net_amount if not set
        if not payout.net_amount:
            payout.net_amount = payout.amount

        # Mark payout as processing
        payout.status = 'processing'
        db.session.commit()

        # Initiate B2C payment
        response = mpesa_service.b2c_payment(
            phone_number=supplier.mpesa_number,
            amount=float(payout.net_amount),
            remarks=f'Payout {payout.payout_number} - {supplier.business_name}',
            occasion=f'Supplier Payout {payout.payout_number}'
        )

        if response.get('success'):
            payout.payment_reference = response.get('conversation_id')
            payout.notes = f"M-Pesa B2C initiated. ConversationID: {response.get('conversation_id')}"
            db.session.commit()

            return success_response(
                data={
                    'payout': payout.to_dict(),
                    'mpesa_response': response
                },
                message='M-Pesa payout initiated successfully'
            )
        else:
            # Revert to pending if failed
            payout.status = 'pending'
            payout.notes = f"M-Pesa B2C failed: {response.get('error', 'Unknown error')}"
            db.session.commit()

            return error_response(
                f"M-Pesa payout failed: {response.get('error', 'Unknown error')}",
                400
            )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'M-Pesa payout error: {str(e)}')
        return error_response(f'Failed to initiate M-Pesa payout: {str(e)}', 500)


@admin_bp.route('/payouts/<payout_id>/cancel', methods=['POST'])
@jwt_required()
@require_admin
def cancel_payout(payout_id):
    """Cancel a payout that is in pending or processing status."""
    try:
        payout = SupplierPayout.query.get(payout_id)
        if not payout:
            return error_response('Payout not found', 404)

        if payout.status == 'completed':
            return error_response('Cannot cancel completed payout', 400)

        if payout.status == 'processing':
            return error_response(
                'Payout is being processed. Cannot cancel at this stage. Contact M-Pesa support if needed.',
                400
            )

        data = request.get_json() or {}
        reason = data.get('reason', 'Cancelled by admin')

        payout.status = 'cancelled'
        payout.notes = f"{payout.notes or ''}\n\nCancelled: {reason}"
        db.session.commit()

        return success_response(
            data=payout.to_dict(),
            message='Payout cancelled successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel payout: {str(e)}', 500)


@admin_bp.route('/payouts/batch-mpesa', methods=['POST'])
@jwt_required()
@require_admin
def batch_mpesa_payouts():
    """Initiate M-Pesa B2C payments for multiple pending payouts."""
    try:
        data = request.get_json() or {}
        payout_ids = data.get('payout_ids', [])

        if not payout_ids:
            # If no specific IDs, process all pending payouts
            payouts = SupplierPayout.query.filter_by(status='pending').all()
        else:
            payouts = SupplierPayout.query.filter(
                SupplierPayout.id.in_(payout_ids),
                SupplierPayout.status == 'pending'
            ).all()

        results = {
            'successful': [],
            'failed': []
        }

        for payout in payouts:
            supplier = SupplierProfile.query.get(payout.supplier_id)

            if not supplier or not supplier.mpesa_number:
                results['failed'].append({
                    'payout_id': payout.id,
                    'payout_number': payout.payout_number,
                    'error': 'Supplier has no M-Pesa number'
                })
                continue

            # Validate phone
            is_valid, result = mpesa_service.validate_phone_number(supplier.mpesa_number)
            if not is_valid:
                results['failed'].append({
                    'payout_id': payout.id,
                    'payout_number': payout.payout_number,
                    'error': f'Invalid phone: {result}'
                })
                continue

            # Mark as processing
            payout.status = 'processing'
            db.session.commit()

            # Initiate payment
            response = mpesa_service.b2c_payment(
                phone_number=supplier.mpesa_number,
                amount=float(payout.net_amount),
                remarks=f'Payout {payout.payout_number}',
                occasion=f'Supplier Payout'
            )

            if response.get('success'):
                payout.payment_reference = response.get('conversation_id')
                results['successful'].append({
                    'payout_id': payout.id,
                    'payout_number': payout.payout_number,
                    'conversation_id': response.get('conversation_id')
                })
            else:
                payout.status = 'pending'
                results['failed'].append({
                    'payout_id': payout.id,
                    'payout_number': payout.payout_number,
                    'error': response.get('error', 'Unknown error')
                })

        db.session.commit()

        return success_response(
            data=results,
            message=f"Processed {len(results['successful'])} payouts, {len(results['failed'])} failed"
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Batch payout error: {str(e)}')
        return error_response(f'Failed to process batch payouts: {str(e)}', 500)


# =============================================================================
# Payment Phone Change Management
# =============================================================================

@admin_bp.route('/payment-phone-requests', methods=['GET'])
@jwt_required()
@require_admin
def get_payment_phone_requests():
    """Get all pending payment phone change requests."""
    try:
        status = request.args.get('status', 'pending')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        query = SupplierProfile.query.filter(
            SupplierProfile.payment_phone_pending.isnot(None)
        )

        if status == 'pending':
            query = query.filter(
                SupplierProfile.payment_phone_change_status == PaymentPhoneChangeStatus.PENDING
            )
        elif status == 'all':
            pass  # Show all requests
        else:
            query = query.filter(
                SupplierProfile.payment_phone_change_status == status
            )

        suppliers = query.order_by(
            SupplierProfile.payment_phone_change_requested_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'requests': [
                {
                    'supplier_id': s.id,
                    'business_name': s.business_name,
                    'contact_person': s.contact_person,
                    'current_phone': s.mpesa_number,
                    'requested_phone': s.payment_phone_pending,
                    'status': s.payment_phone_change_status.value if s.payment_phone_change_status else None,
                    'reason': s.payment_phone_change_reason,
                    'requested_at': s.payment_phone_change_requested_at.isoformat() if s.payment_phone_change_requested_at else None,
                }
                for s in suppliers.items
            ],
            'pagination': {
                'page': suppliers.page,
                'per_page': suppliers.per_page,
                'total': suppliers.total,
                'pages': suppliers.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch requests: {str(e)}', 500)


@admin_bp.route('/payment-phone-requests/<supplier_id>/approve', methods=['POST'])
@jwt_required()
@require_admin
def approve_payment_phone_change(supplier_id):
    """Approve a supplier's payment phone change request."""
    try:
        user_id = get_jwt_identity()
        supplier = SupplierProfile.query.get(supplier_id)

        if not supplier:
            return error_response('Supplier not found', 404)

        if not supplier.payment_phone_pending:
            return error_response('No pending phone change request', 400)

        if supplier.approve_payment_phone_change(user_id):
            db.session.commit()
            return success_response(
                data=supplier.to_dict(),
                message=f'Payment phone changed to {supplier.mpesa_number}'
            )
        else:
            return error_response('Failed to approve change', 400)

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to approve: {str(e)}', 500)


@admin_bp.route('/payment-phone-requests/<supplier_id>/reject', methods=['POST'])
@jwt_required()
@require_admin
def reject_payment_phone_change(supplier_id):
    """Reject a supplier's payment phone change request."""
    try:
        user_id = get_jwt_identity()
        supplier = SupplierProfile.query.get(supplier_id)

        if not supplier:
            return error_response('Supplier not found', 404)

        data = request.get_json() or {}
        reason = data.get('reason', 'Request rejected by admin')

        if supplier.reject_payment_phone_change(user_id, reason):
            db.session.commit()
            return success_response(
                data=supplier.to_dict(),
                message='Payment phone change rejected'
            )
        else:
            return error_response('No pending request to reject', 400)

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to reject: {str(e)}', 500)


# =============================================================================
# COD (Cash on Delivery) Payment Management
# =============================================================================

@admin_bp.route('/orders/cod-pending', methods=['GET'])
@jwt_required()
@require_admin
def get_cod_pending_orders():
    """Get all COD orders pending verification."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        # Get COD orders that are delivered but payment not yet verified
        query = Order.query.filter(
            Order.payment_method == PaymentMethod.CASH,
            Order.status == OrderStatus.DELIVERED,
            Order.payment_status == PaymentStatus.PENDING
        )

        orders = query.order_by(Order.updated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict(include_items=False) for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch COD orders: {str(e)}', 500)


@admin_bp.route('/orders/<order_id>/cod-collect', methods=['POST'])
@jwt_required()
@require_admin
def record_cod_collection(order_id):
    """Record that cash was collected for a COD order (by delivery person)."""
    try:
        user_id = get_jwt_identity()
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        if order.payment_method != PaymentMethod.CASH:
            return error_response('This is not a COD order', 400)

        data = request.get_json()
        amount = data.get('amount')

        if not amount:
            return error_response('Amount is required', 400)

        if float(amount) != float(order.total):
            return error_response(
                f'Amount mismatch. Expected {order.total}, got {amount}',
                400
            )

        if order.confirm_cod_collection(user_id, amount):
            db.session.commit()
            return success_response(
                data=order.to_dict(),
                message='COD collection recorded. Pending admin verification.'
            )
        else:
            return error_response('Failed to record collection', 400)

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to record collection: {str(e)}', 500)


@admin_bp.route('/orders/<order_id>/cod-verify', methods=['POST'])
@jwt_required()
@require_admin
def verify_cod_payment(order_id):
    """Admin verifies COD payment was received and reconciled."""
    try:
        user_id = get_jwt_identity()
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        if order.payment_method != PaymentMethod.CASH:
            return error_response('This is not a COD order', 400)

        if not order.cod_collected_at:
            return error_response(
                'Cash collection must be recorded before verification',
                400
            )

        if order.verify_cod_payment(user_id):
            db.session.commit()
            return success_response(
                data=order.to_dict(),
                message='COD payment verified and marked as completed'
            )
        else:
            return error_response('Failed to verify payment', 400)

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to verify payment: {str(e)}', 500)


@admin_bp.route('/orders/cod-collected', methods=['GET'])
@jwt_required()
@require_admin
def get_cod_collected_orders():
    """Get all COD orders where cash was collected but not yet verified."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        query = Order.query.filter(
            Order.payment_method == PaymentMethod.CASH,
            Order.cod_collected_at.isnot(None),
            Order.cod_verified_at.is_(None)
        )

        orders = query.order_by(Order.cod_collected_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict(include_items=False) for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch orders: {str(e)}', 500)


# =============================================================================
# Returns Management
# =============================================================================

@admin_bp.route('/returns', methods=['GET'])
@jwt_required()
@require_admin
def get_all_returns():
    """Get all returns with filtering."""
    try:
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Return.query
        
        if status and status != 'all':
            try:
                query = query.filter_by(status=status)
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
        current_app.logger.error(f'Get returns error: {str(e)}')
        return success_response(data={'returns': [], 'pagination': {'page': 1, 'per_page': 20, 'total': 0, 'pages': 0}})


@admin_bp.route('/returns/<return_id>/approve', methods=['POST'])
@jwt_required()
@require_admin
def approve_return(return_id):
    """Approve return and calculate refund based on policy."""
    try:
        from app.services.notification_service import notification_service
        
        admin_id = get_jwt_identity()
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        if return_request.status not in ['pending', 'pending_review', 'disputed']:
            return error_response('Return already processed', 400)

        data = request.get_json() or {}
        policy = data.get('refund_policy', RefundPolicy.SUPPLIER_FAULT.value)
        admin_notes = data.get('admin_notes')

        # Calculate refund amounts based on policy
        return_request.calculate_refund(policy)
        return_request.status = 'approved'
        return_request.admin_notes = admin_notes
        
        db.session.commit()
        
        # Audit log
        notification_service.create_audit_log(
            action='return_approved',
            entity_type='return',
            entity_id=return_request.id,
            user_id=admin_id,
            description=f"Return {return_request.return_number} approved with {policy} policy"
        )
        
        # Notify customer
        if return_request.customer_id:
            notification_service.create_notification(
                user_id=return_request.customer.user_id,
                title='Return Approved',
                message=f'Your return request #{return_request.return_number} has been approved. Refund will be processed shortly.',
                notification_type='success',
                link=f'/returns/{return_request.id}'
            )
        
        # Notify supplier
        if return_request.supplier_id:
            notification_service.create_notification(
                user_id=return_request.supplier.user_id,
                title='Return Approved',
                message=f'Return request #{return_request.return_number} has been approved by admin.',
                notification_type='info',
                link=f'/supplier/returns/{return_request.id}'
            )
        
        return success_response(
            data=return_request.to_dict(),
            message='Return approved successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to approve return: {str(e)}', 500)


@admin_bp.route('/returns/<return_id>/reject', methods=['POST'])
@jwt_required()
@require_admin
def reject_return(return_id):
    """Reject return request."""
    try:
        from app.services.notification_service import notification_service
        
        admin_id = get_jwt_identity()
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        if return_request.status not in ['pending', 'pending_review', 'disputed']:
            return error_response('Return already processed', 400)

        data = request.get_json() or {}
        admin_notes = data.get('admin_notes', 'Return rejected by admin')

        return_request.status = 'rejected'
        return_request.admin_notes = admin_notes
        
        db.session.commit()
        
        # Audit log
        notification_service.create_audit_log(
            action='return_rejected',
            entity_type='return',
            entity_id=return_request.id,
            user_id=admin_id,
            description=f"Return {return_request.return_number} rejected"
        )
        
        # Notify customer
        if return_request.customer_id:
            notification_service.create_notification(
                user_id=return_request.customer.user_id,
                title='Return Rejected',
                message=f'Your return request #{return_request.return_number} has been rejected. Reason: {admin_notes}',
                notification_type='error',
                link=f'/returns/{return_request.id}'
            )
        
        return success_response(
            data=return_request.to_dict(),
            message='Return rejected successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to reject return: {str(e)}', 500)


@admin_bp.route('/returns/<return_id>/process-refund', methods=['POST'])
@jwt_required()
@require_admin
def process_return_refund(return_id):
    """Process refund for approved return."""
    try:
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        if return_request.status != 'approved':
            return error_response('Return must be approved first', 400)

        # Get order to determine payment method
        order = Order.query.get(return_request.order_id)
        if not order:
            return error_response('Order not found', 404)

        data = request.get_json() or {}
        refund_method = data.get('refund_method', order.payment_method.value)
        refund_amount = float(return_request.customer_refund or return_request.refund_amount)

        refund_reference = None
        refund_success = False

        # Process refund based on payment method
        if refund_method == 'mpesa' or (refund_method == 'cash' and data.get('refund_via_mpesa')):
            # M-Pesa refund via B2C
            from app.services.mpesa_service import mpesa_service
            from app.models.user import CustomerProfile
            
            # Get customer from return or order
            customer = None
            if return_request.customer_id:
                customer = CustomerProfile.query.get(return_request.customer_id)
            elif order.customer_id:
                customer = CustomerProfile.query.get(order.customer_id)
            
            if not customer:
                return error_response('Customer not found. Please provide phone number manually.', 400)
            
            # Get customer phone number
            phone = data.get('phone_number')
            if not phone and customer:
                phone = customer.phone_number
            
            if not phone:
                return error_response('Phone number required for M-Pesa refund', 400)
            
            # Validate phone
            is_valid, validated_phone = mpesa_service.validate_phone_number(phone)
            if not is_valid:
                return error_response(f'Invalid phone number: {validated_phone}', 400)
            
            # Initiate B2C refund
            response = mpesa_service.b2c_payment(
                phone_number=validated_phone,
                amount=refund_amount,
                remarks=f'Refund for return {return_request.return_number or return_request.id}',
                occasion='Product Return Refund'
            )
            
            if response.get('success'):
                refund_reference = response.get('conversation_id')
                refund_success = True
            else:
                return error_response(f"M-Pesa refund failed: {response.get('error')}", 400)
                
        elif refund_method == 'card':
            # Paystack card refund
            import os
            import requests
            
            paystack_key = os.getenv('PAYSTACK_SECRET_KEY')
            if not paystack_key:
                return error_response('Paystack not configured', 500)
            
            if not order.payment_reference:
                return error_response('No payment reference found for card refund', 400)
            
            # Initiate Paystack refund
            headers = {
                'Authorization': f'Bearer {paystack_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'transaction': order.payment_reference,
                'amount': int(refund_amount * 100)  # Convert to kobo
            }
            
            response = requests.post(
                'https://api.paystack.co/refund',
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status'):
                    refund_reference = result['data'].get('id')
                    refund_success = True
                else:
                    return error_response(f"Paystack refund failed: {result.get('message')}", 400)
            else:
                return error_response('Paystack refund request failed', 400)
                
        elif refund_method == 'cash':
            # Manual cash refund - just mark as completed
            refund_reference = data.get('refund_reference', f'CASH-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}')
            refund_success = True
        else:
            return error_response(f'Unsupported refund method: {refund_method}', 400)

        if refund_success:
            # Mark as completed
            return_request.status = 'refund_completed'
            return_request.refund_processed_at = datetime.utcnow()
            return_request.refund_reference = refund_reference
            return_request.refund_method = refund_method
            
            db.session.commit()
            
            return success_response(
                data=return_request.to_dict(),
                message=f'Refund of KES {refund_amount:,.2f} processed successfully via {refund_method}'
            )
        else:
            return error_response('Refund processing failed', 500)
            
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process refund: {str(e)}', 500)


@admin_bp.route('/returns/analytics', methods=['GET'])
@jwt_required()
@require_admin
def get_returns_analytics():
    """Get returns analytics."""
    try:
        # Total returns
        total_returns = Return.query.count()

        # Returns by status
        try:
            by_status = db.session.query(
                Return.status,
                func.count(Return.id).label('count')
            ).group_by(Return.status).all()
        except Exception:
            by_status = []

        # Pending returns (includes new statuses from supplier workflow)
        try:
            pending = Return.query.filter(
                Return.status.in_(['pending', 'requested', 'pending_review', 'supplier_review'])
            ).count()
        except Exception:
            pending = 0
            
        try:
            approved = Return.query.filter_by(status='approved').count()
        except Exception:
            approved = 0
            
        try:
            rejected = Return.query.filter_by(status='rejected').count()
        except Exception:
            rejected = 0
            
        try:
            completed = Return.query.filter(
                Return.status.in_(['completed', 'refund_completed'])
            ).count()
        except Exception:
            completed = 0
            
        try:
            disputed = Return.query.filter_by(status='disputed').count()
        except Exception:
            disputed = 0

        return success_response(data={
            'total_returns': total_returns,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'completed': completed,
            'disputed': disputed,
            'by_status': [{'status': str(s[0]), 'count': s[1]} for s in by_status]
        })
    except Exception as e:
        current_app.logger.error(f'Returns analytics error: {str(e)}')
        return success_response(data={
            'total_returns': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'completed': 0,
            'disputed': 0,
            'by_status': []
        })


# =============================================================================
# Product Management
# =============================================================================

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
@require_admin
def get_all_products():
    """Get all products with filtering."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')
        search = request.args.get('search')
        category_id = request.args.get('category_id')
        supplier_id = request.args.get('supplier_id')
        
        query = Product.query
        
        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        elif status == 'low_stock':
            query = query.filter(Product.stock_quantity <= 10, Product.is_active == True)
        
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%'))
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)
        
        products = query.order_by(Product.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'products': [p.to_dict(include_supplier=True) for p in products.items],
            'pagination': {
                'page': products.page,
                'per_page': products.per_page,
                'total': products.total,
                'pages': products.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch products: {str(e)}', 500)


@admin_bp.route('/products/<product_id>/toggle-status', methods=['PUT'])
@jwt_required()
@require_admin
def toggle_product_status(product_id):
    """Activate or deactivate a product."""
    try:
        from app.services.notification_service import notification_service
        
        user_id = get_jwt_identity()
        product = Product.query.get(product_id)
        if not product:
            return error_response('Product not found', 404)
        
        old_status = product.is_active
        product.is_active = not product.is_active
        db.session.commit()
        
        # Create audit log
        notification_service.create_audit_log(
            action='product_activated' if product.is_active else 'product_deactivated',
            entity_type='product',
            entity_id=product.id,
            user_id=user_id,
            old_values={'is_active': old_status},
            new_values={'is_active': product.is_active},
            description=f"Product '{product.name}' {'activated' if product.is_active else 'deactivated'}"
        )
        
        # Notify supplier
        if product.supplier:
            notification_service.create_notification(
                user_id=product.supplier.user_id,
                title=f"Product {'Activated' if product.is_active else 'Deactivated'}",
                message=f"Your product '{product.name}' has been {'activated' if product.is_active else 'deactivated'} by admin.",
                notification_type='info',
                link=f'/supplier/products/{product.id}'
            )
        
        # Clear product cache
        cache_keys = current_app.cache.cache._cache.keys()
        for key in list(cache_keys):
            if key.startswith('products_'):
                current_app.cache.delete(key)
        
        return success_response(
            data=product.to_dict(),
            message=f"Product {'activated' if product.is_active else 'deactivated'}"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update product: {str(e)}', 500)


@admin_bp.route('/products/bulk-action', methods=['POST'])
@jwt_required()
@require_admin
@validate_required_fields(['product_ids', 'action'])
def bulk_product_action():
    """Bulk activate/deactivate products."""
    try:
        data = request.get_json()
        product_ids = data['product_ids']
        action = data['action']  # activate or deactivate
        
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        
        for product in products:
            if action == 'activate':
                product.is_active = True
            elif action == 'deactivate':
                product.is_active = False
        
        db.session.commit()
        
        # Clear product cache
        cache_keys = current_app.cache.cache._cache.keys()
        for key in list(cache_keys):
            if key.startswith('products_'):
                current_app.cache.delete(key)
        
        return success_response(
            message=f'{len(products)} products {action}d successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to perform bulk action: {str(e)}', 500)


# =============================================================================
# System Settings
# =============================================================================

@admin_bp.route('/settings', methods=['GET'])
@jwt_required()
@require_admin
def get_settings():
    """Get system settings."""
    try:
        from app.models.settings import SystemSettings
        
        # Get all settings from database
        settings = SystemSettings.get_all_settings()
        
        # If no settings exist, initialize defaults
        if not settings:
            SystemSettings.initialize_defaults()
            settings = SystemSettings.get_all_settings()
        
        return success_response(data=settings)
    except Exception as e:
        current_app.logger.error(f'Get settings error: {str(e)}')
        return error_response(f'Failed to fetch settings: {str(e)}', 500)


@admin_bp.route('/settings', methods=['PUT'])
@jwt_required()
@require_admin
def update_settings():
    """Update system settings."""
    try:
        from app.models.settings import SystemSettings
        from app.services.notification_service import notification_service
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Define value types for each setting
        setting_types = {
            'platform_commission_rate': 'float',
            'tax_rate': 'float',
            'return_window_days': 'int',
            'warranty_default_months': 'int',
            'low_stock_threshold': 'int',
            'maintenance_mode': 'bool',
            'allow_cod': 'bool',
            'allow_mpesa': 'bool',
            'min_order_amount': 'float',
            'max_order_amount': 'float',
        }
        
        # Update each setting
        for key, value in data.items():
            SystemSettings.set_setting(
                key=key,
                value=value,
                user_id=user_id
            )
        
        db.session.commit()
        
        # Create audit log
        notification_service.create_audit_log(
            action='settings_updated',
            entity_type='system',
            entity_id='settings',
            user_id=user_id,
            description=f"System settings updated: {', '.join(data.keys())}"
        )
        
        # Get updated settings
        updated_settings = SystemSettings.get_all_settings()
        
        return success_response(
            data=updated_settings,
            message='Settings updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update settings error: {str(e)}')
        return error_response(f'Failed to update settings: {str(e)}', 500)


# =============================================================================
# Audit Logs
# =============================================================================

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@require_admin
def get_audit_logs():
    """Get audit logs with filtering."""
    try:
        from app.models.audit_log import AuditLog
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        action = request.args.get('action')
        entity_type = request.args.get('entity_type')
        user_id = request.args.get('user_id')
        
        query = AuditLog.query
        
        if action:
            query = query.filter_by(action=action)
        if entity_type:
            query = query.filter_by(entity_type=entity_type)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        logs = query.order_by(AuditLog.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'logs': [log.to_dict() for log in logs.items],
            'pagination': {
                'page': logs.page,
                'per_page': logs.per_page,
                'total': logs.total,
                'pages': logs.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch audit logs: {str(e)}', 500)


# =============================================================================
# Financial Reports
# =============================================================================

@admin_bp.route('/reports/financial', methods=['GET'])
@jwt_required(optional=True)
@require_admin
def get_financial_report():
    """Get comprehensive financial report with enterprise-level metrics."""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base query for completed orders
        query = Order.query.filter(Order.payment_status == PaymentStatus.COMPLETED)
        
        if start_date:
            query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            query = query.filter(Order.created_at <= end_dt)
        
        orders = query.all()
        
        # Initialize metrics
        total_revenue = 0
        total_subtotal = 0
        total_delivery_fees = 0
        total_commission = 0
        total_supplier_earnings = 0
        payment_method_breakdown = {'mpesa': 0, 'card': 0, 'cash': 0}
        category_revenue = {}
        supplier_revenue = {}
        
        # Calculate order metrics
        for order in orders:
            total_revenue += float(order.total)
            total_subtotal += float(order.subtotal)
            total_delivery_fees += float(order.delivery_fee)
            
            # Payment method breakdown
            method = order.payment_method.value if hasattr(order.payment_method, 'value') else str(order.payment_method)
            payment_method_breakdown[method] = payment_method_breakdown.get(method, 0) + float(order.total)
            
            # Process order items
            for item in order.items:
                total_commission += float(item.platform_commission)
                total_supplier_earnings += float(item.supplier_earnings)
                
                # Category revenue
                if item.product_id:
                    product = Product.query.get(item.product_id)
                    if product and product.category:
                        cat_name = product.category.name
                        category_revenue[cat_name] = category_revenue.get(cat_name, 0) + float(item.subtotal)
                
                # Supplier revenue
                if item.supplier_id:
                    from app.models.user import SupplierProfile
                    supplier = SupplierProfile.query.get(item.supplier_id)
                    if supplier:
                        supplier_name = supplier.business_name
                        if supplier_name not in supplier_revenue:
                            supplier_revenue[supplier_name] = {
                                'revenue': 0,
                                'earnings': 0,
                                'orders': 0
                            }
                        supplier_revenue[supplier_name]['revenue'] += float(item.subtotal)
                        supplier_revenue[supplier_name]['earnings'] += float(item.supplier_earnings)
                        supplier_revenue[supplier_name]['orders'] += 1
        
        # Calculate refunds - separate by who pays
        returns_query = Return.query.filter(
            Return.status.in_(['approved', 'completed', 'refund_completed'])
        )
        if start_date:
            returns_query = returns_query.filter(Return.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            returns_query = returns_query.filter(Return.created_at <= end_dt)
        
        returns = returns_query.all()
        total_refunds_to_customers = sum(float(r.customer_refund or r.refund_amount or 0) for r in returns)
        platform_paid_refunds = sum(float(r.platform_deduction or 0) for r in returns)  # Only what platform paid
        supplier_paid_refunds = sum(float(r.supplier_deduction or 0) for r in returns)  # What suppliers paid
        refund_count = len(returns)
        
        # Calculate supplier payouts
        payouts_query = SupplierPayout.query.filter_by(status='completed')
        if start_date:
            payouts_query = payouts_query.filter(SupplierPayout.paid_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            payouts_query = payouts_query.filter(SupplierPayout.paid_at <= end_dt)
        
        payouts = payouts_query.all()
        total_payouts = sum(float(p.amount) for p in payouts)
        payout_count = len(payouts)
        
        # Calculate pending payouts
        pending_payouts = SupplierPayout.query.filter_by(status='pending').all()
        total_pending_payouts = sum(float(p.amount) for p in pending_payouts)
        
        # Calculate delivery agent earnings
        delivery_query = Order.query.filter(
            Order.status == OrderStatus.DELIVERED,
            Order.assigned_delivery_agent.isnot(None)
        )
        if start_date:
            delivery_query = delivery_query.filter(Order.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            delivery_query = delivery_query.filter(Order.created_at <= end_dt)
        
        # Calculate delivery agent earnings (what we owe them)
        delivered_orders = delivery_query.all()
        total_delivery_fees_collected = sum(float(o.delivery_fee) for o in delivered_orders)
        delivery_agent_share = sum(float(o.delivery_fee) * 0.7 for o in delivered_orders)  # 70% to agent
        platform_delivery_earnings = sum(float(o.delivery_fee) * 0.3 for o in delivered_orders)  # 30% to platform
        
        # Calculate net metrics
        net_revenue = total_revenue - total_refunds_to_customers
        
        # Platform's actual earnings breakdown:
        # 1. Commission from products (25%)
        # 2. Cut from delivery fees (30%)
        # Total platform earnings before payouts
        platform_gross_earnings = total_commission + platform_delivery_earnings
        
        # Platform net earnings after only the refunds IT paid
        platform_net_earnings = platform_gross_earnings - platform_paid_refunds
        
        # Calculate margins and ratios
        commission_rate = (total_commission / total_subtotal * 100) if total_subtotal > 0 else 0
        refund_rate = (refund_count / len(orders) * 100) if orders else 0
        avg_order_value = total_revenue / len(orders) if orders else 0
        
        # Top categories
        top_categories = sorted(
            [{'name': k, 'revenue': v} for k, v in category_revenue.items()],
            key=lambda x: x['revenue'],
            reverse=True
        )[:10]
        
        # Top suppliers
        top_suppliers = sorted(
            [{'name': k, **v} for k, v in supplier_revenue.items()],
            key=lambda x: x['revenue'],
            reverse=True
        )[:10]
        
        # ===== ADDITIONAL COMPREHENSIVE METRICS =====
        
        # 1. CASH FLOW ANALYSIS
        outstanding_supplier_payouts = total_supplier_earnings - total_payouts
        outstanding_delivery_payouts = delivery_agent_share - 0  # Assume no delivery payouts tracked yet
        pending_orders_query = Order.query.filter(Order.payment_status == PaymentStatus.PENDING)
        if start_date:
            pending_orders_query = pending_orders_query.filter(Order.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            pending_orders_query = pending_orders_query.filter(Order.created_at <= datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59))
        expected_incoming = sum(float(o.total) for o in pending_orders_query.all())
        
        # 2. PROFIT MARGINS
        gross_profit = platform_gross_earnings
        gross_profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        net_profit_margin = (platform_net_earnings / total_revenue * 100) if total_revenue > 0 else 0
        profit_per_order = platform_net_earnings / len(orders) if orders else 0
        
        # 3. GROWTH METRICS (compare to previous period)
        if start_date and end_date:
            period_days = (datetime.fromisoformat(end_date) - datetime.fromisoformat(start_date)).days
            prev_start = (datetime.fromisoformat(start_date) - timedelta(days=period_days)).isoformat()
            prev_end = start_date
            
            prev_orders = Order.query.filter(
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.created_at >= datetime.fromisoformat(prev_start),
                Order.created_at < datetime.fromisoformat(prev_end)
            ).all()
            
            prev_revenue = sum(float(o.total) for o in prev_orders)
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            order_growth = ((len(orders) - len(prev_orders)) / len(prev_orders) * 100) if prev_orders else 0
            
            # Customer acquisition (new customers in period)
            new_customers = User.query.filter(
                User.role == UserRole.CUSTOMER,
                User.created_at >= datetime.fromisoformat(start_date),
                User.created_at <= datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            ).count()
            customer_acquisition_cost = (platform_gross_earnings / new_customers) if new_customers > 0 else 0
        else:
            revenue_growth = 0
            order_growth = 0
            new_customers = 0
            customer_acquisition_cost = 0
        
        # 4. OPERATIONAL COSTS (estimated transaction fees)
        # M-Pesa: ~1.5% fee, Paystack: ~2.9% + KES 100
        mpesa_revenue = payment_method_breakdown.get('mpesa', 0)
        card_revenue = payment_method_breakdown.get('card', 0)
        mpesa_fees = mpesa_revenue * 0.015
        paystack_fees = (card_revenue * 0.029) + (100 * len([o for o in orders if o.payment_method.value == 'card']))
        total_transaction_fees = mpesa_fees + paystack_fees
        
        # 5. TAX INFORMATION (16% VAT in Kenya)
        vat_rate = 0.16
        vat_collected = total_revenue * (vat_rate / (1 + vat_rate))  # VAT inclusive
        tax_liability = platform_net_earnings * 0.30  # Estimated 30% corporate tax
        
        # 6. SUPPLIER PERFORMANCE
        supplier_performance = []
        for supplier_name, data in supplier_revenue.items():
            supplier_profile = SupplierProfile.query.filter_by(business_name=supplier_name).first()
            if supplier_profile:
                supplier_payouts_made = sum(float(p.amount) for p in payouts if p.supplier_id == supplier_profile.id)
                pending_payout = data['earnings'] - supplier_payouts_made
                
                # Calculate average payout time
                supplier_completed_payouts = [p for p in payouts if p.supplier_id == supplier_profile.id and p.paid_at]
                if supplier_completed_payouts:
                    avg_payout_days = sum(
                        (p.paid_at - p.created_at).days for p in supplier_completed_payouts
                    ) / len(supplier_completed_payouts)
                else:
                    avg_payout_days = 0
                
                supplier_performance.append({
                    'name': supplier_name,
                    'revenue': data['revenue'],
                    'earnings': data['earnings'],
                    'orders': data['orders'],
                    'paid_out': supplier_payouts_made,
                    'pending_payout': pending_payout,
                    'avg_payout_days': round(avg_payout_days, 1)
                })
        
        supplier_performance = sorted(supplier_performance, key=lambda x: x['revenue'], reverse=True)[:10]
        
        # 7. RETURN RATE ANALYSIS
        # By category
        return_by_category = {}
        for ret in returns:
            if ret.product_id:
                product = Product.query.get(ret.product_id)
                if product and product.category:
                    cat_name = product.category.name
                    if cat_name not in return_by_category:
                        return_by_category[cat_name] = {'count': 0, 'amount': 0}
                    return_by_category[cat_name]['count'] += 1
                    return_by_category[cat_name]['amount'] += float(ret.customer_refund or ret.refund_amount or 0)
        
        # By supplier
        return_by_supplier = {}
        for ret in returns:
            if ret.order_item_id:
                from app.models.order import OrderItem
                item = OrderItem.query.get(ret.order_item_id)
                if item and item.supplier_id:
                    supplier = SupplierProfile.query.get(item.supplier_id)
                    if supplier:
                        sup_name = supplier.business_name
                        if sup_name not in return_by_supplier:
                            return_by_supplier[sup_name] = {'count': 0, 'amount': 0}
                        return_by_supplier[sup_name]['count'] += 1
                        return_by_supplier[sup_name]['amount'] += float(ret.customer_refund or ret.refund_amount or 0)
        
        # By policy
        return_by_policy = {}
        for ret in returns:
            policy = ret.refund_policy or 'unknown'
            if policy not in return_by_policy:
                return_by_policy[policy] = {'count': 0, 'platform_cost': 0, 'supplier_cost': 0}
            return_by_policy[policy]['count'] += 1
            return_by_policy[policy]['platform_cost'] += float(ret.platform_deduction or 0)
            return_by_policy[policy]['supplier_cost'] += float(ret.supplier_deduction or 0)
        
        return success_response(data={
            # Revenue Metrics
            'revenue': {
                'total_revenue': float(total_revenue),
                'total_subtotal': float(total_subtotal),
                'total_delivery_fees': float(total_delivery_fees),
                'net_revenue': float(net_revenue),
                'avg_order_value': float(avg_order_value)
            },
            
            # Commission & Earnings
            'earnings': {
                'total_commission': float(total_commission),
                'total_supplier_earnings': float(total_supplier_earnings),
                'total_delivery_fees_collected': float(total_delivery_fees_collected),
                'delivery_agent_share': float(delivery_agent_share),
                'platform_delivery_earnings': float(platform_delivery_earnings),
                'platform_gross_earnings': float(platform_gross_earnings),
                'platform_net_earnings': float(platform_net_earnings),
                'commission_rate': float(commission_rate)
            },
            
            # Cash Flow Analysis
            'cash_flow': {
                'outstanding_supplier_payouts': float(outstanding_supplier_payouts),
                'outstanding_delivery_payouts': float(outstanding_delivery_payouts),
                'expected_incoming_revenue': float(expected_incoming),
                'net_cash_position': float(platform_net_earnings - outstanding_supplier_payouts - outstanding_delivery_payouts)
            },
            
            # Profit Margins
            'profit_margins': {
                'gross_profit': float(gross_profit),
                'gross_profit_margin': float(gross_profit_margin),
                'net_profit_margin': float(net_profit_margin),
                'profit_per_order': float(profit_per_order)
            },
            
            # Growth Metrics
            'growth': {
                'revenue_growth': float(revenue_growth),
                'order_growth': float(order_growth),
                'new_customers': new_customers,
                'customer_acquisition_cost': float(customer_acquisition_cost)
            },
            
            # Operational Costs
            'operational_costs': {
                'mpesa_fees': float(mpesa_fees),
                'paystack_fees': float(paystack_fees),
                'total_transaction_fees': float(total_transaction_fees),
                'net_after_fees': float(platform_net_earnings - total_transaction_fees)
            },
            
            # Tax Information
            'tax': {
                'vat_collected': float(vat_collected),
                'vat_rate': float(vat_rate * 100),
                'estimated_tax_liability': float(tax_liability),
                'net_after_tax': float(platform_net_earnings - tax_liability)
            },
            
            # Payouts
            'payouts': {
                'total_payouts': float(total_payouts),
                'payout_count': payout_count,
                'pending_payouts': float(total_pending_payouts),
                'pending_count': len(pending_payouts)
            },
            
            # Refunds
            'refunds': {
                'total_refunds_to_customers': float(total_refunds_to_customers),
                'platform_paid_refunds': float(platform_paid_refunds),
                'supplier_paid_refunds': float(supplier_paid_refunds),
                'refund_count': refund_count,
                'refund_rate': float(refund_rate)
            },
            
            # Return Analysis
            'return_analysis': {
                'by_category': [{'category': k, **v} for k, v in return_by_category.items()],
                'by_supplier': [{'supplier': k, **v} for k, v in return_by_supplier.items()],
                'by_policy': [{'policy': k, **v} for k, v in return_by_policy.items()]
            },
            
            # Order Metrics
            'orders': {
                'total_orders': len(orders),
                'delivered_orders': len(delivered_orders)
            },
            
            # Payment Methods
            'payment_methods': [
                {'method': k, 'amount': float(v)}
                for k, v in payment_method_breakdown.items()
                if v > 0
            ],
            
            # Top Performers
            'top_categories': top_categories,
            'top_suppliers': top_suppliers,
            'supplier_performance': supplier_performance,
            
            # Date Range
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        })
    except Exception as e:
        current_app.logger.error(f'Financial report error: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to generate report: {str(e)}', 500)


# =============================================================================
# Bulk Operations
# =============================================================================

@admin_bp.route('/users/bulk-action', methods=['POST'])
@jwt_required()
@require_admin
@validate_required_fields(['user_ids', 'action'])
def bulk_user_action():
    """Bulk suspend/activate users."""
    try:
        data = request.get_json()
        user_ids = data['user_ids']
        action = data['action']  # suspend or activate
        
        users = User.query.filter(User.id.in_(user_ids)).all()
        
        for user in users:
            if action == 'suspend':
                user.is_active = False
            elif action == 'activate':
                user.is_active = True
        
        db.session.commit()
        
        return success_response(
            message=f'{len(users)} users {action}d successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to perform bulk action: {str(e)}', 500)


@admin_bp.route('/orders/bulk-update', methods=['POST'])
@jwt_required()
@require_admin
@validate_required_fields(['order_ids', 'status'])
def bulk_order_update():
    """Bulk update order status."""
    try:
        data = request.get_json()
        order_ids = data['order_ids']
        status = data['status']
        
        orders = Order.query.filter(Order.id.in_(order_ids)).all()
        
        for order in orders:
            order.status = OrderStatus(status)
        
        db.session.commit()
        
        return success_response(
            message=f'{len(orders)} orders updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update orders: {str(e)}', 500)


@admin_bp.route('/products/export-csv', methods=['GET'])
@jwt_required()
@require_admin
def export_products_csv():
    """Export products to CSV."""
    try:
        from io import StringIO
        import csv
        
        products = Product.query.all()
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Name', 'Price', 'Stock', 'Category', 'Brand', 'Active'])
        
        for p in products:
            writer.writerow([
                p.id, p.name, float(p.price), p.stock_quantity,
                p.category.name if p.category else '',
                p.brand.name if p.brand else '',
                p.is_active
            ])
        
        return success_response(data={'csv': output.getvalue()})
    except Exception as e:
        return error_response(f'Failed to export: {str(e)}', 500)


# =============================================================================
# Notifications
# =============================================================================

@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
@require_admin
def get_notifications():
    """Get admin notifications."""
    try:
        from app.models.notification import Notification
        
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        unread_only = request.args.get('unread_only') == 'true'
        
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'notifications': [n.to_dict() for n in notifications.items],
            'pagination': {
                'page': notifications.page,
                'total': notifications.total,
                'pages': notifications.pages
            }
        })
    except Exception as e:
        return success_response(data={'notifications': [], 'pagination': {'page': 1, 'total': 0, 'pages': 0}})


@admin_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
@require_admin
def mark_notification_read(notification_id):
    """Mark notification as read."""
    try:
        from app.models.notification import Notification
        
        notification = Notification.query.get(notification_id)
        if notification:
            notification.is_read = True
            db.session.commit()
        
        return success_response(message='Notification marked as read')
    except Exception as e:
        return error_response(f'Failed: {str(e)}', 500)


@admin_bp.route('/activity-timeline', methods=['GET'])
@jwt_required()
@require_admin
def get_activity_timeline():
    """Get recent admin activity timeline."""
    try:
        from app.models.audit_log import AuditLog
        
        limit = int(request.args.get('limit', 50))
        
        activities = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return success_response(data={
            'activities': [a.to_dict() for a in activities]
        })
    except Exception as e:
        return success_response(data={'activities': []})
