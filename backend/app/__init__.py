import os
from flask import Flask, redirect, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_swagger_ui import get_swaggerui_blueprint
from app.config.config import config
from app.models import db
from app.services.email_service import mail


def create_app(config_name=None):
    """Application factory pattern."""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL']}})
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    mail.init_app(app)
    
    with app.app_context():
        from app.models.user import User, CustomerProfile, SupplierProfile, AdminProfile
        from app.models.session import Session
        from app.models.address import Address
        from app.models.notifications import Notification
        from app.models.product import Product, Category, Brand
        from app.models.order import Order, OrderItem, DeliveryZone
        from app.models.returns import Return, SupplierPayout
        from app.models.cart import Cart, CartItem
        from app.models.audit_log import AuditLog
        from app.models.otp import OTP

    from app.routes.auth import auth_bp
    from app.routes.contact import contact_bp
    from app.routes.products import products_bp
    from app.routes.orders import orders_bp
    from app.routes.payments import payments_bp
    from app.routes.returns import returns_bp
    from app.routes.supplier import supplier_bp
    from app.routes.admin import admin_bp
    from app.routes.uploads import uploads_bp
    from app.routes.cart import cart_bp


    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(returns_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(contact_bp)

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

    return app
