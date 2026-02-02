from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
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
        
        supplier_id = user.supplier_profile.id
        
        # Total products
        total_products = Product.query.filter_by(supplier_id=supplier_id).count()
        active_products = Product.query.filter_by(supplier_id=supplier_id, is_active=True).count()
        
        # Orders containing supplier's products
        total_orders = db.session.query(Order.id)\
            .join(OrderItem)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .distinct().count()
        
        # Total earnings (paid orders only)
        total_earnings = db.session.query(func.sum(OrderItem.supplier_earnings))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == 'completed'
            ).scalar() or 0
        
        # Pending earnings (unpaid orders)
        pending_earnings = db.session.query(func.sum(OrderItem.supplier_earnings))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == 'pending'
            ).scalar() or 0
        
        # This month's sales
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_sales = db.session.query(func.sum(OrderItem.supplier_earnings))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == 'completed',
                Order.created_at >= month_start
            ).scalar() or 0
        
        # Total items sold
        items_sold = db.session.query(func.sum(OrderItem.quantity))\
            .join(Order)\
            .filter(
                OrderItem.supplier_id == supplier_id,
                Order.payment_status == 'completed'
            ).scalar() or 0
        
        # Returns
        total_returns = db.session.query(Return)\
            .join(OrderItem)\
            .filter(OrderItem.supplier_id == supplier_id)\
            .count()
        
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
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


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
                Order.payment_status == 'completed',
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
                Order.payment_status == 'completed'
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
                    Order.payment_status == 'completed',
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
                Order.payment_status == 'completed',
                Order.status.in_([OrderStatus.DELIVERED])  # Only paid out after delivery
            ).scalar() or 0
        
        # Subtract already paid amounts
        paid_amount = db.session.query(func.sum(SupplierPayout.net_amount))\
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
