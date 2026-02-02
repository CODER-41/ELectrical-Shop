import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from app.config.config import config
from app.models import db
from app.services.email_service import mail


def create_app(config_name=None):
    """Application factory pattern."""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    #
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL']}})
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    mail.init_app(app)
    
    
    with app.app_context():
        from app.models.user import User, CustomerProfile, SupplierProfile, AdminProfile
        from app.models.session import Session
        from app.models.address import Address
        from app.models.notification import Notification
        from app.models.product import Product, Category, Brand
        from app.models.order import Order, OrderItem, DeliveryZone
        from app.models.returns import Return, SupplierPayout

    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.orders import orders_bp
    from app.routes.payments import payments_bp
    from app.routes.returns import returns_bp
    from app.routes.supplier import supplier_bp
    from app.routes.admin import admin_bp
    
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(returns_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(admin_bp)
    
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
    
    return app
