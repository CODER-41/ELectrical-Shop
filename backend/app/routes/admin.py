from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from app.models import db
from app.models.user import User, UserRole, SupplierProfile
from app.models.order import Order, OrderItem, OrderStatus, DeliveryZone
from app.models.product import Product, Category, Brand
from app.models.returns import Return, SupplierPayout
from app.utils.validation import validate_required_fields
from app.utils.responses import success_response, error_response

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def require_admin(func):
    """Decorator to require admin role."""
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in [UserRole.ADMIN, UserRole.ORDER_MANAGER, UserRole.PRODUCT_MANAGER]:
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
            Product.stock_quantity <= Product.low_stock_threshold
        ).count()
        
        # Orders
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        paid_orders = Order.query.filter_by(payment_status='completed').count()
        
        # Revenue (completed payments only)
        total_revenue = db.session.query(func.sum(Order.total))\
            .filter(Order.payment_status == 'completed').scalar() or 0
        
        # This month revenue
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_revenue = db.session.query(func.sum(Order.total))\
            .filter(
                Order.payment_status == 'completed',
                Order.created_at >= month_start
            ).scalar() or 0
        
        # Platform commission (25% of total)
        platform_earnings = db.session.query(func.sum(OrderItem.platform_commission))\
            .join(Order)\
            .filter(Order.payment_status == 'completed').scalar() or 0
        
        # Returns
        pending_returns = Return.query.filter(
            Return.status.in_(['requested', 'pending_review'])
        ).count()
        
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
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@require_admin
def get_analytics():
    """Get detailed analytics and charts."""
    try:
        # Revenue trend (last 30 days)
        days = 30
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        daily_revenue = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total).label('revenue'),
            func.count(Order.id).label('orders')
        ).filter(
            Order.payment_status == 'completed',
            Order.created_at >= start_date
        ).group_by(func.date(Order.created_at))\
            .order_by(func.date(Order.created_at)).all()
        
        # Top selling products
        top_products = db.session.query(
            Product.name,
            Product.image_url,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.subtotal).label('revenue')
        ).join(OrderItem)\
            .join(Order)\
            .filter(Order.payment_status == 'completed')\
            .group_by(Product.id, Product.name, Product.image_url)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(10).all()
        
        # Top suppliers
        top_suppliers = db.session.query(
            User.full_name,
            SupplierProfile.business_name,
            func.count(OrderItem.id).label('orders'),
            func.sum(OrderItem.supplier_earnings).label('earnings')
        ).join(SupplierProfile, User.id == SupplierProfile.user_id)\
            .join(OrderItem, OrderItem.supplier_id == SupplierProfile.id)\
            .join(Order)\
            .filter(Order.payment_status == 'completed')\
            .group_by(User.id, User.full_name, SupplierProfile.business_name)\
            .order_by(func.sum(OrderItem.supplier_earnings).desc())\
            .limit(10).all()
        
        # Order status distribution
        order_status = db.session.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        # Payment method distribution
        payment_methods = db.session.query(
            Order.payment_method,
            func.count(Order.id).label('count'),
            func.sum(Order.total).label('revenue')
        ).filter(Order.payment_status == 'completed')\
            .group_by(Order.payment_method).all()
        
        return success_response(data={
            'daily_revenue': [
                {
                    'date': str(day[0]),
                    'revenue': float(day[1]) if day[1] else 0,
                    'orders': day[2]
                }
                for day in daily_revenue
            ],
            'top_products': [
                {
                    'name': p[0],
                    'image': p[1],
                    'quantity_sold': p[2],
                    'revenue': float(p[3])
                }
                for p in top_products
            ],
            'top_suppliers': [
                {
                    'name': s[0],
                    'business_name': s[1],
                    'orders': s[2],
                    'earnings': float(s[3])
                }
                for s in top_suppliers
            ],
            'order_status': [
                {
                    'status': s[0].value,
                    'count': s[1]
                }
                for s in order_status
            ],
            'payment_methods': [
                {
                    'method': pm[0].value,
                    'count': pm[1],
                    'revenue': float(pm[2])
                }
                for pm in payment_methods
            ]
        })
    except Exception as e:
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
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.full_name.ilike(f'%{search}%'))
            )
        
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
        user = User.query.get(user_id)
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        action = data['action']  # approve, suspend, activate
        
        if action == 'approve' and user.role == UserRole.SUPPLIER:
            user.supplier_profile.is_approved = True
            message = 'Supplier approved successfully'
        elif action == 'suspend':
            user.is_active = False
            message = 'User suspended successfully'
        elif action == 'activate':
            user.is_active = True
            message = 'User activated successfully'
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
        data = request.get_json()
        
        # Get date range
        end_date = datetime.utcnow()
        period = data.get('period', 'weekly')  # weekly or monthly
        
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
                Order.payment_status == 'completed',
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
                    Order.payment_status == 'completed',
                    Order.created_at >= start_date,
                    Order.created_at <= end_date
                ).scalar() or 0
            
            if gross <= 0:
                continue
            
            # Calculate return deductions
            deductions = db.session.query(func.sum(Return.refund_amount))\
                .join(OrderItem)\
                .filter(
                    OrderItem.supplier_id == supplier_id,
                    Return.status == 'refund_completed',
                    Return.created_at >= start_date,
                    Return.created_at <= end_date
                ).scalar() or 0
            
            net = float(gross) - float(deductions)
            
            if net <= 0:
                continue
            
            # Count order items
            items_count = db.session.query(func.count(OrderItem.id))\
                .join(Order)\
                .filter(
                    OrderItem.supplier_id == supplier_id,
                    Order.status == OrderStatus.DELIVERED,
                    Order.payment_status == 'completed',
                    Order.created_at >= start_date,
                    Order.created_at <= end_date
                ).scalar() or 0
            
            # Create payout
            payout = SupplierPayout(
                supplier_id=supplier_id,
                period_start=start_date,
                period_end=end_date,
                gross_amount=gross,
                return_deductions=deductions,
                net_amount=net,
                order_items_count=items_count,
                status='pending'
            )
            
            payout.generate_payout_number()
            db.session.add(payout)
            payouts_created += 1
        
        db.session.commit()
        
        return success_response(
            data={'payouts_created': payouts_created},
            message=f'Generated {payouts_created} payouts successfully'
        )
    except Exception as e:
        db.session.rollback()
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
        
        if status:
            query = query.filter_by(status=status)
        
        payouts = query.order_by(SupplierPayout.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'payouts': [p.to_dict() for p in payouts.items],
            'pagination': {
                'page': payouts.page,
                'per_page': payouts.per_page,
                'total': payouts.total,
                'pages': payouts.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@admin_bp.route('/payouts/<payout_id>/process', methods=['PUT'])
@jwt_required()
@require_admin
def process_payout(payout_id):
    """Mark payout as processed."""
    try:
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
        
        return success_response(
            data=payout.to_dict(),
            message='Payout processed successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process payout: {str(e)}', 500)
