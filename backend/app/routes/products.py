from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_
from app.models import db
from app.models.user import User, UserRole
from app.models.product import Product, Category, Brand
from app.utils.validation import validate_required_fields
from app.utils.responses import success_response, error_response, validation_error_response
import re

products_bp = Blueprint('products', __name__, url_prefix='/api/products')


def slugify(text):
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


@products_bp.route('', methods=['GET'])
def get_products():
    """
    Get all active products with optional filtering and pagination.
    
    Query Parameters:
    - page: int (default: 1)
    - per_page: int (default: 20, max: 100)
    - category: string (category slug)
    - brand: string (brand name)
    - search: string (search in name and description)
    - min_price: float
    - max_price: float
    - condition: string ('new' or 'refurbished')
    - in_stock: boolean
    - sort_by: string ('price_asc', 'price_desc', 'newest', 'popular')
    """
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Build query
        query = Product.query.filter_by(is_active=True)
        
        # Filter by category
        category_slug = request.args.get('category')
        if category_slug:
            # Case-insensitive category lookup
            category_slug_lower = category_slug.lower()
            
            if category_slug_lower == 'accessories':
                # For accessories, show all products from ALL categories
                # This is the special case - no filtering needed
                pass
            else:
                # Normal category filtering - match by slug
                category = Category.query.filter(
                    db.func.lower(Category.slug) == category_slug_lower,
                    Category.is_active == True
                ).first()
                
                if category:
                    query = query.filter_by(category_id=category.id)
                else:
                    # If category not found, return empty results
                    query = query.filter(Product.id == None)
        
        # Filter by brand
        brand_name = request.args.get('brand')
        if brand_name:
            brand = Brand.query.filter_by(name=brand_name, is_active=True).first()
            if brand:
                query = query.filter_by(brand_id=brand.id)
        
        # Search
        search_term = request.args.get('search')
        if search_term:
            search_pattern = f'%{search_term}%'
            query = query.filter(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.short_description.ilike(search_pattern),
                    Product.long_description.ilike(search_pattern)
                )
            )
        
        # Price range
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Condition
        condition = request.args.get('condition')
        if condition and condition in ['new', 'refurbished']:
            query = query.filter_by(condition=condition)
        
        # In stock
        in_stock = request.args.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            query = query.filter(Product.stock_quantity > 0)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'newest')
        if sort_by == 'price_asc':
            query = query.order_by(Product.price.asc())
        elif sort_by == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort_by == 'popular':
            query = query.order_by(Product.purchase_count.desc())
        else:  # newest (default)
            query = query.order_by(Product.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return success_response(data={
            'products': [product.to_dict() for product in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_pages': pagination.pages,
                'total_items': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        return error_response(f'Failed to fetch products: {str(e)}', 500)


@products_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product details by ID."""
    try:
        product = Product.query.get(product_id)
        
        if not product or not product.is_active:
            return error_response('Product not found', 404)
        
        # Increment view count
        product.increment_view_count()
        db.session.commit()
        
        return success_response(data=product.to_dict())
        
    except Exception as e:
        return error_response(f'Failed to fetch product: {str(e)}', 500)


@products_bp.route('/slug/<slug>', methods=['GET'])
def get_product_by_slug(slug):
    """Get single product details by slug."""
    try:
        product = Product.query.filter_by(slug=slug, is_active=True).first()
        
        if not product:
            return error_response('Product not found', 404)
        
        # Increment view count
        product.increment_view_count()
        db.session.commit()
        
        return success_response(data=product.to_dict())
        
    except Exception as e:
        return error_response(f'Failed to fetch product: {str(e)}', 500)


@products_bp.route('', methods=['POST'])
@jwt_required()
@validate_required_fields(['name', 'category_id', 'brand_id', 'price', 'stock_quantity', 'warranty_period_months', 'short_description', 'long_description'])
def create_product():
    """
    Create a new product (Supplier only).
    
    Request Body:
    - name: string (required)
    - category_id: string (required)
    - brand_id: string (required)
    - price: float (required)
    - stock_quantity: int (required)
    - warranty_period_months: int (required)
    - short_description: string (required, max 200 chars)
    - long_description: string (required)
    - specifications: object (optional, key-value pairs)
    - condition: string (optional, 'new' or 'refurbished', default: 'new')
    - image_url: string (optional, Cloudinary URL)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can create products', 403)
        
        if not user.supplier_profile.is_approved:
            return error_response('Your supplier account is not approved yet', 403)
        
        data = request.get_json()
        
        # Validate category
        category = Category.query.get(data['category_id'])
        if not category or not category.is_active:
            return validation_error_response({'category_id': 'Invalid category'})
        
        # Validate brand
        brand = Brand.query.get(data['brand_id'])
        if not brand or not brand.is_active:
            return validation_error_response({'brand_id': 'Invalid brand'})
        
        # Validate price
        price = float(data['price'])
        if price <= 0:
            return validation_error_response({'price': 'Price must be greater than 0'})
        
        # Validate stock
        stock_quantity = int(data['stock_quantity'])
        if stock_quantity < 0:
            return validation_error_response({'stock_quantity': 'Stock quantity cannot be negative'})
        
        # Generate unique slug
        base_slug = slugify(data['name'])
        slug = base_slug
        counter = 1
        while Product.query.filter_by(slug=slug).first():
            slug = f'{base_slug}-{counter}'
            counter += 1
        
        # Create product
        product = Product(
            supplier_id=user.supplier_profile.id,
            category_id=data['category_id'],
            brand_id=data['brand_id'],
            name=data['name'].strip(),
            slug=slug,
            short_description=data['short_description'].strip()[:200],
            long_description=data['long_description'].strip(),
            specifications=data.get('specifications'),
            condition=data.get('condition', 'new'),
            warranty_period_months=int(data['warranty_period_months']),
            price=price,
            stock_quantity=stock_quantity,
            low_stock_threshold=data.get('low_stock_threshold', 10),
            image_url=data.get('image_url')
        )
        
        # Calculate commission
        product.calculate_commission()
        
        db.session.add(product)
        db.session.commit()
        
        return success_response(
            data=product.to_dict(include_supplier=True),
            message='Product created successfully',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create product: {str(e)}', 500)


@products_bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """
    Update product (Supplier - own products, Admin - all products).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        product = Product.query.get(product_id)
        if not product:
            return error_response('Product not found', 404)
        
        # Check permissions
        is_supplier_owner = (user.role == UserRole.SUPPLIER and 
                            product.supplier_id == user.supplier_profile.id)
        is_admin = user.role in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER]
        
        if not (is_supplier_owner or is_admin):
            return error_response('You do not have permission to update this product', 403)
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            product.name = data['name'].strip()
            # Regenerate slug
            base_slug = slugify(data['name'])
            slug = base_slug
            counter = 1
            while Product.query.filter(Product.slug == slug, Product.id != product_id).first():
                slug = f'{base_slug}-{counter}'
                counter += 1
            product.slug = slug
        
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if category and category.is_active:
                product.category_id = data['category_id']
        
        if 'brand_id' in data:
            brand = Brand.query.get(data['brand_id'])
            if brand and brand.is_active:
                product.brand_id = data['brand_id']
        
        if 'price' in data:
            price = float(data['price'])
            if price > 0:
                product.price = price
                product.calculate_commission()
        
        if 'stock_quantity' in data:
            stock = int(data['stock_quantity'])
            if stock >= 0:
                product.stock_quantity = stock
        
        if 'warranty_period_months' in data:
            product.warranty_period_months = int(data['warranty_period_months'])
        
        if 'short_description' in data:
            product.short_description = data['short_description'].strip()[:200]
        
        if 'long_description' in data:
            product.long_description = data['long_description'].strip()
        
        if 'specifications' in data:
            product.specifications = data['specifications']
        
        if 'condition' in data and data['condition'] in ['new', 'refurbished']:
            product.condition = data['condition']
        
        if 'image_url' in data:
            product.image_url = data['image_url']
        
        if 'is_active' in data and is_admin:  # Only admin can activate/deactivate
            product.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return success_response(
            data=product.to_dict(include_supplier=True),
            message='Product updated successfully'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update product: {str(e)}', 500)


@products_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """
    Delete (deactivate) product (Supplier - own products, Admin - all products).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        product = Product.query.get(product_id)
        if not product:
            return error_response('Product not found', 404)
        
        # Check permissions
        is_supplier_owner = (user.role == UserRole.SUPPLIER and 
                            product.supplier_id == user.supplier_profile.id)
        is_admin = user.role in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER]
        
        if not (is_supplier_owner or is_admin):
            return error_response('You do not have permission to delete this product', 403)
        
        # Soft delete (deactivate)
        product.is_active = False
        db.session.commit()
        
        return success_response(message='Product deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete product: {str(e)}', 500)


# Category routes
@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories."""
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return success_response(data=[cat.to_dict() for cat in categories])
    except Exception as e:
        return error_response(f'Failed to fetch categories: {str(e)}', 500)


# Brand routes
@products_bp.route('/brands', methods=['GET'])
def get_brands():
    """Get all active brands."""
    try:
        brands = Brand.query.filter_by(is_active=True).all()
        return success_response(data=[brand.to_dict() for brand in brands])
    except Exception as e:
        return error_response(f'Failed to fetch brands: {str(e)}', 500)


# Delivery zones (public endpoint)
@products_bp.route('/delivery-zones', methods=['GET'])
def get_delivery_zones():
    """Get all active delivery zones (public endpoint)."""
    try:
        from app.models.order import DeliveryZone
        zones = DeliveryZone.query.filter_by(is_active=True).all()
        return success_response(data=[z.to_dict() for z in zones])
    except Exception as e:
        return error_response(f'Failed to fetch delivery zones: {str(e)}', 500)
