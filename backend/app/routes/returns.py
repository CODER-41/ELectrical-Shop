from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
from app.models.returns import Return, ReturnStatus
from app.utils.validation import validate_required_fields
from app.utils.responses import success_response, error_response

returns_bp = Blueprint('returns', __name__, url_prefix='/api/returns')


@returns_bp.route('', methods=['POST'])
@jwt_required()
@validate_required_fields(['order_item_id', 'reason', 'description', 'quantity'])
def create_return():
    """Create a return request."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != UserRole.CUSTOMER:
            return error_response('Only customers can create return requests', 403)
        
        data = request.get_json()
        
        # Get order item
        order_item = OrderItem.query.get(data['order_item_id'])
        if not order_item:
            return error_response('Order item not found', 404)
        
        # Get order
        order = Order.query.get(order_item.order_id)
        if not order:
            return error_response('Order not found', 404)
        
        # Verify ownership
        if order.customer_id != user.customer_profile.id:
            return error_response('Unauthorized', 403)
        
        # Check if order is delivered
        if order.status != OrderStatus.DELIVERED:
            return error_response('Can only return delivered orders', 400)
        
        # Check return window (14 days)
        from datetime import timedelta
        return_window = timedelta(days=14)
        if datetime.utcnow() - order.created_at > return_window:
            return error_response('Return window has expired (14 days)', 400)
        
        # Validate quantity
        quantity = int(data['quantity'])
        if quantity <= 0 or quantity > order_item.quantity:
            return error_response('Invalid quantity', 400)
        
        # Check if warranty claim
        is_warranty = data.get('is_warranty_claim', False)
        if is_warranty and order_item.warranty_expires_at:
            if datetime.utcnow() > order_item.warranty_expires_at:
                return error_response('Warranty has expired', 400)
        
        # Create return
        return_request = Return(
            order_id=order.id,
            order_item_id=order_item.id,
            customer_id=user.customer_profile.id,
            product_id=order_item.product_id,
            reason=data['reason'],
            description=data['description'].strip(),
            quantity=quantity,
            images=data.get('images', []),
            is_warranty_claim=is_warranty,
            status=ReturnStatus.REQUESTED
        )
        
        return_request.generate_return_number()
        
        db.session.add(return_request)
        db.session.commit()
        
        return success_response(
            data=return_request.to_dict(),
            message='Return request submitted successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create return: {str(e)}', 500)


@returns_bp.route('', methods=['GET'])
@jwt_required()
def get_returns():
    """Get returns (customer sees their returns, admin sees all, supplier sees theirs)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == UserRole.CUSTOMER:
            returns = Return.query.filter_by(customer_id=user.customer_profile.id)\
                .order_by(Return.created_at.desc()).all()
        elif user.role == UserRole.SUPPLIER:
            # Get returns for supplier's products
            returns = db.session.query(Return)\
                .join(OrderItem)\
                .filter(OrderItem.supplier_id == user.supplier_profile.id)\
                .order_by(Return.created_at.desc()).all()
        else:
            # Admin sees all
            returns = Return.query.order_by(Return.created_at.desc()).all()
        
        return success_response(data=[r.to_dict() for r in returns])
    except Exception as e:
        return error_response(f'Failed to fetch returns: {str(e)}', 500)


@returns_bp.route('/<return_id>', methods=['GET'])
@jwt_required()
def get_return(return_id):
    """Get single return details."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        # Check permissions
        if user.role == UserRole.CUSTOMER:
            if return_request.customer_id != user.customer_profile.id:
                return error_response('Unauthorized', 403)
        elif user.role == UserRole.SUPPLIER:
            order_item = OrderItem.query.get(return_request.order_item_id)
            if order_item.supplier_id != user.supplier_profile.id:
                return error_response('Unauthorized', 403)
        
        return success_response(data=return_request.to_dict())
    except Exception as e:
        return error_response(f'Failed to fetch return: {str(e)}', 500)


@returns_bp.route('/<return_id>/review', methods=['PUT'])
@jwt_required()
@validate_required_fields(['action'])
def review_return(return_id):
    """Review return request (admin only)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in [UserRole.ADMIN, UserRole.ORDER_MANAGER]:
            return error_response('Only admins can review returns', 403)
        
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        data = request.get_json()
        action = data['action']  # approve or reject
        
        if action == 'approve':
            return_request.status = ReturnStatus.APPROVED
            
            # Calculate refund amount
            order_item = OrderItem.query.get(return_request.order_item_id)
            return_request.refund_amount = float(order_item.product_price) * return_request.quantity
            return_request.refund_method = data.get('refund_method', 'mpesa')
            
        elif action == 'reject':
            return_request.status = ReturnStatus.REJECTED
            return_request.rejection_reason = data.get('rejection_reason', '').strip()
        else:
            return error_response('Invalid action', 400)
        
        return_request.reviewed_by = user_id
        return_request.reviewed_at = datetime.utcnow()
        return_request.admin_notes = data.get('admin_notes', '').strip()
        
        db.session.commit()
        
        return success_response(
            data=return_request.to_dict(),
            message=f'Return {action}d successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to review return: {str(e)}', 500)


@returns_bp.route('/<return_id>/status', methods=['PUT'])
@jwt_required()
@validate_required_fields(['status'])
def update_return_status(return_id):
    """Update return status (admin only)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in [UserRole.ADMIN, UserRole.ORDER_MANAGER]:
            return error_response('Only admins can update return status', 403)
        
        return_request = Return.query.get(return_id)
        if not return_request:
            return error_response('Return not found', 404)
        
        data = request.get_json()
        
        # Validate status
        try:
            new_status = ReturnStatus(data['status'])
        except ValueError:
            return error_response('Invalid status', 400)
        
        return_request.status = new_status
        
        # If refund completed, set refund details
        if new_status == ReturnStatus.REFUND_COMPLETED:
            return_request.refunded_at = datetime.utcnow()
            if 'refund_reference' in data:
                return_request.refund_reference = data['refund_reference']
        
        if 'admin_notes' in data:
            return_request.admin_notes = data['admin_notes']
        
        db.session.commit()
        
        return success_response(
            data=return_request.to_dict(),
            message='Return status updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update status: {str(e)}', 500)


@returns_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_return_stats():
    """Get return statistics (admin/supplier)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == UserRole.SUPPLIER:
            # Stats for supplier's products
            total = db.session.query(Return)\
                .join(OrderItem)\
                .filter(OrderItem.supplier_id == user.supplier_profile.id)\
                .count()
            
            pending = db.session.query(Return)\
                .join(OrderItem)\
                .filter(
                    OrderItem.supplier_id == user.supplier_profile.id,
                    Return.status.in_([ReturnStatus.REQUESTED, ReturnStatus.PENDING_REVIEW])
                ).count()
            
            approved = db.session.query(Return)\
                .join(OrderItem)\
                .filter(
                    OrderItem.supplier_id == user.supplier_profile.id,
                    Return.status == ReturnStatus.APPROVED
                ).count()
            
        elif user.role in [UserRole.ADMIN, UserRole.ORDER_MANAGER]:
            # All returns
            total = Return.query.count()
            pending = Return.query.filter(
                Return.status.in_([ReturnStatus.REQUESTED, ReturnStatus.PENDING_REVIEW])
            ).count()
            approved = Return.query.filter_by(status=ReturnStatus.APPROVED).count()
        else:
            return error_response('Unauthorized', 403)
        
        return success_response(data={
            'total_returns': total,
            'pending_review': pending,
            'approved': approved,
        })
    except Exception as e:
        return error_response(f'Failed to fetch stats: {str(e)}', 500)
