from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc
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
        platform_earnings = db.session.query(func.sum(OrderItem.platform_commission))\
            .join(Order)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED).scalar() or 0
        
        # Returns
        pending_returns = Return.query.filter_by(status=ReturnStatus.PENDING).count()
        
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
            Order.payment_status == PaymentStatus.COMPLETED,
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
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(Product.id, Product.name, Product.image_url)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(10).all()
        
        # Top suppliers
        top_suppliers = db.session.query(
            SupplierProfile.business_name,
            SupplierProfile.contact_person,
            func.count(OrderItem.id).label('orders'),
            func.sum(OrderItem.supplier_earnings).label('earnings')
        ).join(OrderItem, OrderItem.supplier_id == SupplierProfile.id)\
            .join(Order)\
            .filter(Order.payment_status == PaymentStatus.COMPLETED)\
            .group_by(SupplierProfile.id, SupplierProfile.business_name, SupplierProfile.contact_person)\
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
        ).filter(Order.payment_status == PaymentStatus.COMPLETED)\
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
                    'business_name': s[0],
                    'contact_person': s[1],
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
        current_app.logger.error(f'Analytics error: {str(e)}')
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
            query = query.filter_by(status=status)
        
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
        return error_response(f'Failed to fetch returns: {str(e)}', 500)


@admin_bp.route('/returns/<return_id>/approve', methods=['POST'])
@jwt_required()
@require_admin
def approve_return(return_id):
    """Approve return and calculate refund based on policy."""
    try:
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        if return_request.status != ReturnStatus.PENDING:
            return error_response('Return already processed', 400)
        
        data = request.get_json() or {}
        policy = data.get('refund_policy', RefundPolicy.SUPPLIER_FAULT.value)
        admin_notes = data.get('admin_notes')
        
        # Calculate refund amounts based on policy
        return_request.calculate_refund(policy)
        return_request.status = ReturnStatus.APPROVED
        return_request.admin_notes = admin_notes
        
        db.session.commit()
        
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
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        if return_request.status != ReturnStatus.PENDING:
            return error_response('Return already processed', 400)
        
        data = request.get_json() or {}
        admin_notes = data.get('admin_notes', 'Return rejected by admin')
        
        return_request.status = ReturnStatus.REJECTED
        return_request.admin_notes = admin_notes
        
        db.session.commit()
        
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
        
        if return_request.status != ReturnStatus.APPROVED:
            return error_response('Return must be approved first', 400)
        
        data = request.get_json() or {}
        refund_reference = data.get('refund_reference')
        
        # Mark as completed
        return_request.status = ReturnStatus.COMPLETED
        return_request.refund_processed_at = datetime.utcnow()
        return_request.refund_reference = refund_reference
        
        db.session.commit()
        
        return success_response(
            data=return_request.to_dict(),
            message='Refund processed successfully'
        )
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
        by_status = db.session.query(
            Return.status,
            func.count(Return.id).label('count')
        ).group_by(Return.status).all()
        
        # Pending returns
        pending = Return.query.filter_by(status=ReturnStatus.PENDING).count()
        approved = Return.query.filter_by(status=ReturnStatus.APPROVED).count()
        rejected = Return.query.filter_by(status=ReturnStatus.REJECTED).count()
        completed = Return.query.filter_by(status=ReturnStatus.COMPLETED).count()
        
        return success_response(data={
            'total_returns': total_returns,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'completed': completed,
            'by_status': [{'status': s[0].value, 'count': s[1]} for s in by_status]
        })
    except Exception as e:
        current_app.logger.error(f'Returns analytics error: {str(e)}')
        return error_response(f'Failed to fetch analytics: {str(e)}', 500)


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
        product = Product.query.get(product_id)
        if not product:
            return error_response('Product not found', 404)
        
        product.is_active = not product.is_active
        db.session.commit()
        
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
        # Return current settings (you can store these in a settings table)
        settings = {
            'platform_commission_rate': 0.25,
            'tax_rate': 0.16,
            'return_window_days': 14,
            'warranty_default_months': 12,
            'low_stock_threshold': 10,
            'maintenance_mode': False,
            'allow_cod': True,
            'allow_mpesa': True,
            'min_order_amount': 100,
            'max_order_amount': 1000000,
        }
        return success_response(data=settings)
    except Exception as e:
        return error_response(f'Failed to fetch settings: {str(e)}', 500)


@admin_bp.route('/settings', methods=['PUT'])
@jwt_required()
@require_admin
def update_settings():
    """Update system settings."""
    try:
        data = request.get_json()
        # Store settings in database or config file
        # For now, just return success
        return success_response(
            data=data,
            message='Settings updated successfully'
        )
    except Exception as e:
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
    """Get financial report."""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Order.query.filter(Order.payment_status == PaymentStatus.COMPLETED)
        
        if start_date:
            query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            query = query.filter(Order.created_at <= end_dt)
        
        orders = query.all()
        
        total_revenue = sum(float(o.total) for o in orders)
        total_commission = 0
        total_supplier_earnings = 0
        
        for order in orders:
            items = order.items.all()
            for item in items:
                total_commission += float(item.platform_commission)
                total_supplier_earnings += float(item.supplier_earnings)
        
        # Calculate refunds from approved/completed returns
        returns_query = Return.query.filter(
            Return.status.in_([ReturnStatus.APPROVED, ReturnStatus.COMPLETED])
        )
        if start_date:
            returns_query = returns_query.filter(Return.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            returns_query = returns_query.filter(Return.created_at <= end_dt)
        
        returns = returns_query.all()
        total_refunds = sum(float(r.order.total) if r.order else 0 for r in returns)
        
        return success_response(data={
            'total_revenue': total_revenue,
            'total_commission': total_commission,
            'total_supplier_earnings': total_supplier_earnings,
            'total_refunds': total_refunds,
            'net_revenue': total_revenue - total_refunds,
            'order_count': len(orders),
            'revenue_by_category': []
        })
    except Exception as e:
        current_app.logger.error(f'Financial report error: {str(e)}')
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
