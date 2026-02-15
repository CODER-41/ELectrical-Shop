import os
from flask import Flask, redirect, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_swagger_ui import get_swaggerui_blueprint
from flask_compress import Compress
from flask_caching import Cache
from app.config.config import config
from app.models import db
from app.services.email_service import mail
from app.services.scheduler_service import init_scheduler


def _run_startup_fixes(db, Product):
    """One-time data fixes that run on startup. Safe to run multiple times."""
    try:
        image_updates = {
            'Philips Air Fryer XXL': 'https://images.philips.com/is/image/philipsconsumer/vrs_1defac742e4f1743824d94fd3314ecc0a83c0add?$pnglarge$&wid=1250',
            'Hisense 58" 4K Smart TV': 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/75/0209462/1.jpg?6173',
            'Nikon Z50 Mirrorless Camera': 'https://rondamo.co.ke/photok/48033.jpg',
        }
        updated = 0
        for name, url in image_updates.items():
            product = Product.query.filter_by(name=name).first()
            if product and product.image_url != url:
                product.image_url = url
                updated += 1
        if updated:
            db.session.commit()
            print(f"[Startup Fix] Updated {updated} product image(s)")
    except Exception as e:
        db.session.rollback()
        print(f"[Startup Fix] Image update skipped: {e}")


def create_app(config_name=None):
    """Application factory"""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # init extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL']}})
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    mail.init_app(app)
    
    # compression for faster responses
    Compress(app)
    
    # caching for frequently accessed data
    cache = Cache(app, config={
        'CACHE_TYPE': 'simple',
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    app.cache = cache
    
    with app.app_context():
        from app.models.user import User, CustomerProfile, SupplierProfile, AdminProfile, DeliveryAgentProfile, DeliveryCompany
        from app.models.session import Session
        from app.models.address import Address
        from app.models.notification import Notification
        from app.models.product import Product, Category, Brand
        from app.models.order import Order, OrderItem, DeliveryZone
        from app.models.returns import Return, SupplierPayout, DeliveryPayout
        from app.models.cart import Cart, CartItem
        from app.models.audit_log import AuditLog
        from app.models.otp import OTP

        # One-time data fix: update product images
        _run_startup_fixes(db, Product)
        
        # Fix missing columns
        try:
            from sqlalchemy import text
            
            # Add new ENUM values to returns.status if they don't exist
            db.session.execute(text("ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'approved'"))
            db.session.execute(text("ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'completed'"))
            db.session.execute(text("ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'refund_completed'"))
            db.session.execute(text("ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'supplier_review'"))
            
            # Add new ENUM values to notificationtype if they don't exist
            db.session.execute(text("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'warning'"))
            db.session.execute(text("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'error'"))
            db.session.commit()
            
            # Returns table columns
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_number VARCHAR(50) UNIQUE"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS description TEXT"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS images JSON"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS is_warranty_claim BOOLEAN DEFAULT FALSE"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(36)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS rejection_reason TEXT"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_policy VARCHAR(50) DEFAULT 'supplier_fault'"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS restocking_fee NUMERIC(12,2) DEFAULT 0"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_deduction NUMERIC(12,2) DEFAULT 0"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS platform_deduction NUMERIC(12,2) DEFAULT 0"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS customer_refund NUMERIC(12,2)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS admin_notes TEXT"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_acknowledged BOOLEAN DEFAULT FALSE"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_acknowledged_at TIMESTAMP"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_response TEXT"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_evidence JSON"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_action VARCHAR(20)"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_action_at TIMESTAMP"))
            db.session.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS supplier_dispute_reason TEXT"))
            
            # Supplier payouts table
            db.session.execute(text("ALTER TABLE supplier_payouts ADD COLUMN IF NOT EXISTS payout_number VARCHAR(50) UNIQUE"))
            db.session.execute(text("ALTER TABLE supplier_payouts ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2)"))
            db.session.execute(text("ALTER TABLE supplier_payouts ADD COLUMN IF NOT EXISTS reference VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE supplier_payouts ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)"))
            
            # Notifications table
            db.session.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255)"))
            
            # Update null values
            db.session.execute(text("UPDATE returns SET return_number = 'RET-' || LPAD(id::text, 8, '0') WHERE return_number IS NULL"))
            db.session.execute(text("UPDATE supplier_payouts SET payout_number = 'PAY-' || LPAD(id::text, 8, '0') WHERE payout_number IS NULL"))
            db.session.commit()
            print("[Startup Fix] ✓ Database columns verified")
        except Exception as e:
            db.session.rollback()
            print(f"[Startup Fix] Column fix: {e}")

    from app.routes.auth import auth_bp
    from app.routes.contact import contact_bp
    from app.routes.products import products_bp
    from app.routes.orders import orders_bp
    from app.routes.payments import payments_bp
    from app.routes.returns import returns_bp
    from app.routes.supplier import supplier_bp
    from app.routes.supplier_terms import supplier_bp as supplier_terms_bp
    from app.routes.admin import admin_bp
    from app.routes.uploads import uploads_bp
    from app.routes.cart import cart_bp
    from app.routes.delivery import delivery_bp
    from app.routes.migrate import migrate_bp


    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(returns_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(supplier_terms_bp, name='supplier_terms')
    app.register_blueprint(admin_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(delivery_bp)
    app.register_blueprint(migrate_bp)

    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return {'error': 'Missing or invalid token'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return {'error': 'Invalid token'}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired'}, 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has been revoked'}, 401

    # Maintenance mode check for all routes
    @app.before_request
    def check_maintenance():
        from flask import request
        from app.utils.maintenance import check_maintenance_mode
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        
        # Skip for health check, admin routes, and login
        if request.path in ['/api/health', '/'] or \
           request.path.startswith('/api/admin') or \
           request.path.startswith('/api/auth/login') or \
           request.path.startswith('/api/auth/register') or \
           request.path.startswith('/api/docs') or \
           request.path.startswith('/api/swagger'):
            return None
        
        # Check if maintenance mode is enabled
        if check_maintenance_mode():
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    from app.models.user import User
                    user = User.query.get(user_id)
                    if user and user.role.lower() == 'admin':
                        return None
            except:
                pass
            
            return jsonify({
                'success': False,
                'error': 'System is under maintenance. Please try again later.',
                'maintenance_mode': True
            }), 503
        
        return None

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'Electronics Shop API is running'}, 200

    @app.route('/')
    def index():
        """Root route - redirect to API docs."""
        return redirect('/api/docs')

    @app.route('/api/docs')
    def api_docs():
        """API documentation - list all available endpoints."""
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                methods = ','.join(sorted([m for m in rule.methods if m not in ['HEAD', 'OPTIONS']]))
                routes.append({
                    'endpoint': rule.endpoint,
                    'methods': methods,
                    'path': str(rule)
                })

        # Sort routes by path
        routes.sort(key=lambda x: x['path'])

        # Group routes by blueprint
        grouped = {}
        for route in routes:
            parts = route['endpoint'].split('.')
            group = parts[0] if len(parts) > 1 else 'core'
            if group not in grouped:
                grouped[group] = []
            grouped[group].append(route)

        return jsonify({
            'api_name': 'Electronics Shop API',
            'version': '1.0.0',
            'description': 'REST API for Electronics Shop e-commerce platform',
            'base_url': app.config.get('BACKEND_URL', 'http://localhost:5000'),
            'endpoints_count': len(routes),
            'groups': grouped,
            'all_routes': routes
        })

    @app.route('/api/swagger.json')
    def swagger_spec():
        """Generate OpenAPI/Swagger specification."""
        spec = {
            'openapi': '3.0.0',
            'info': {
                'title': 'Electronics Shop API',
                'version': '1.0.0',
                'description': 'REST API for Electronics Shop e-commerce platform'
            },
            'servers': [
                {'url': app.config.get('BACKEND_URL', 'http://localhost:5000')}
            ],
            'paths': {}
        }

        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static' and str(rule).startswith('/api'):
                path = str(rule)
                # Convert Flask route params to OpenAPI format
                import re
                path = re.sub(r'<(\w+:)?(\w+)>', r'{\2}', path)

                if path not in spec['paths']:
                    spec['paths'][path] = {}

                for method in rule.methods:
                    if method not in ['HEAD', 'OPTIONS']:
                        spec['paths'][path][method.lower()] = {
                            'summary': rule.endpoint.replace('_', ' ').title(),
                            'tags': [rule.endpoint.split('.')[0] if '.' in rule.endpoint else 'core'],
                            'responses': {
                                '200': {'description': 'Success'},
                                '401': {'description': 'Unauthorized'},
                                '404': {'description': 'Not Found'}
                            }
                        }

        return jsonify(spec)

    # Swagger UI
    SWAGGER_URL = '/api/swagger'
    API_URL = '/api/swagger.json'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={'app_name': 'Electronics Shop API'}
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    # Initialize the scheduler for automated tasks (payouts, confirmations)
    init_scheduler(app)

    return app
