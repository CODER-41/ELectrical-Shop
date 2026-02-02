"""
Shopping cart routes.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.cart import Cart, CartItem
from app.utils.responses import success_response, error_response

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')


def get_or_create_cart(user_id):
    """Get existing cart or create new one for user."""
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart


@cart_bp.route('', methods=['GET'])
@jwt_required()
def get_cart():
    """Get the current user's shopping cart."""
    try:
        user_id = get_jwt_identity()

        cart = get_or_create_cart(user_id)

        # Check for unavailable items
        unavailable_items = []
        for item in cart.items.all():
            if not item.product:
                unavailable_items.append({
                    'item_id': item.id,
                    'reason': 'Product no longer exists'
                })
            elif not item.product.is_active:
                unavailable_items.append({
                    'item_id': item.id,
                    'product_name': item.product.name,
                    'reason': 'Product is no longer available'
                })
            elif item.product.stock_quantity < item.quantity:
                unavailable_items.append({
                    'item_id': item.id,
                    'product_name': item.product.name,
                    'reason': f'Only {item.product.stock_quantity} available',
                    'available_quantity': item.product.stock_quantity
                })

        response_data = cart.to_dict()
        if unavailable_items:
            response_data['warnings'] = unavailable_items

        return success_response(data=response_data)

    except Exception as e:
        return error_response(f'Failed to get cart: {str(e)}', 500)


@cart_bp.route('/items', methods=['POST'])
@jwt_required()
def add_to_cart():
    """
    Add an item to the cart.

    Expected payload:
    {
        "product_id": "uuid",
        "quantity": 1
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data.get('product_id'):
            return error_response('Product ID is required', 400)

        quantity = data.get('quantity', 1)
        if quantity < 1:
            return error_response('Quantity must be at least 1', 400)

        # Check if product exists and is active
        product = Product.query.get(data['product_id'])
        if not product:
            return error_response('Product not found', 404)

        if not product.is_active:
            return error_response('Product is no longer available', 400)

        # Check stock
        if product.stock_quantity < quantity:
            return error_response(
                f'Not enough stock. Only {product.stock_quantity} available',
                400
            )

        # Get or create cart
        cart = get_or_create_cart(user_id)

        # Check if product already in cart
        existing_item = CartItem.query.filter_by(
            cart_id=cart.id,
            product_id=product.id
        ).first()

        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            if product.stock_quantity < new_quantity:
                return error_response(
                    f'Cannot add {quantity} more. Only {product.stock_quantity - existing_item.quantity} more available',
                    400
                )
            existing_item.quantity = new_quantity
            db.session.commit()

            return success_response(
                data=cart.to_dict(),
                message=f'Updated quantity to {new_quantity}'
            )
        else:
            # Add new item
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=quantity
            )
            db.session.add(cart_item)
            db.session.commit()

            return success_response(
                data=cart.to_dict(),
                message='Item added to cart',
                status_code=201
            )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to add to cart: {str(e)}', 500)


@cart_bp.route('/items/<item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """
    Update cart item quantity.

    Expected payload:
    {
        "quantity": 2
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if 'quantity' not in data:
            return error_response('Quantity is required', 400)

        quantity = data['quantity']
        if quantity < 0:
            return error_response('Quantity cannot be negative', 400)

        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return error_response('Cart not found', 404)

        # Get cart item
        cart_item = CartItem.query.filter_by(
            id=item_id,
            cart_id=cart.id
        ).first()

        if not cart_item:
            return error_response('Cart item not found', 404)

        if quantity == 0:
            # Remove item
            db.session.delete(cart_item)
            db.session.commit()
            return success_response(
                data=cart.to_dict(),
                message='Item removed from cart'
            )

        # Check stock
        if cart_item.product and cart_item.product.stock_quantity < quantity:
            return error_response(
                f'Not enough stock. Only {cart_item.product.stock_quantity} available',
                400
            )

        cart_item.quantity = quantity
        db.session.commit()

        return success_response(
            data=cart.to_dict(),
            message='Cart updated'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update cart: {str(e)}', 500)


@cart_bp.route('/items/<item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove an item from the cart."""
    try:
        user_id = get_jwt_identity()

        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return error_response('Cart not found', 404)

        # Get cart item
        cart_item = CartItem.query.filter_by(
            id=item_id,
            cart_id=cart.id
        ).first()

        if not cart_item:
            return error_response('Cart item not found', 404)

        db.session.delete(cart_item)
        db.session.commit()

        return success_response(
            data=cart.to_dict(),
            message='Item removed from cart'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to remove item: {str(e)}', 500)


@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Remove all items from the cart."""
    try:
        user_id = get_jwt_identity()

        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return error_response('Cart not found', 404)

        # Delete all items
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()

        return success_response(
            data=cart.to_dict(),
            message='Cart cleared'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to clear cart: {str(e)}', 500)


@cart_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_cart():
    """
    Validate cart items before checkout.
    Checks product availability and stock levels.
    """
    try:
        user_id = get_jwt_identity()

        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return error_response('Cart not found', 404)

        items = cart.items.all()
        if not items:
            return error_response('Cart is empty', 400)

        valid_items = []
        invalid_items = []

        for item in items:
            if not item.product:
                invalid_items.append({
                    'item_id': item.id,
                    'product_id': item.product_id,
                    'reason': 'Product no longer exists',
                    'action': 'remove'
                })
            elif not item.product.is_active:
                invalid_items.append({
                    'item_id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name,
                    'reason': 'Product is no longer available',
                    'action': 'remove'
                })
            elif item.product.stock_quantity == 0:
                invalid_items.append({
                    'item_id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name,
                    'reason': 'Product is out of stock',
                    'action': 'remove'
                })
            elif item.product.stock_quantity < item.quantity:
                invalid_items.append({
                    'item_id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name,
                    'quantity_requested': item.quantity,
                    'quantity_available': item.product.stock_quantity,
                    'reason': f'Only {item.product.stock_quantity} in stock',
                    'action': 'adjust',
                    'suggested_quantity': item.product.stock_quantity
                })
            else:
                valid_items.append(item.to_dict())

        is_valid = len(invalid_items) == 0

        return success_response(data={
            'is_valid': is_valid,
            'valid_items': valid_items,
            'invalid_items': invalid_items,
            'subtotal': cart.get_subtotal() if is_valid else None,
            'item_count': len(valid_items)
        })

    except Exception as e:
        return error_response(f'Failed to validate cart: {str(e)}', 500)


@cart_bp.route('/count', methods=['GET'])
@jwt_required()
def get_cart_count():
    """Get the number of items in the cart (for navbar badge)."""
    try:
        user_id = get_jwt_identity()

        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return success_response(data={'count': 0})

        count = cart.get_item_count()
        return success_response(data={'count': count})

    except Exception as e:
        return error_response(f'Failed to get cart count: {str(e)}', 500)
