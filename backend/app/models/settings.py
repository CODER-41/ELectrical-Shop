"""System settings model."""
from app.models import db
from datetime import datetime


class SystemSettings(db.Model):
    """System settings model - stores platform configuration."""
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=False)
    value_type = db.Column(db.String(20), nullable=False)  # 'float', 'int', 'bool', 'string'
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    def to_dict(self):
        """Convert to dictionary."""
        # Convert value based on type
        if self.value_type == 'float':
            value = float(self.value)
        elif self.value_type == 'int':
            value = int(self.value)
        elif self.value_type == 'bool':
            value = self.value.lower() == 'true'
        else:
            value = self.value
            
        return {
            'key': self.key,
            'value': value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_setting(key, default=None):
        """Get a setting value by key."""
        setting = SystemSettings.query.filter_by(key=key).first()
        if not setting:
            return default
        
        # Convert based on type
        if setting.value_type == 'float':
            return float(setting.value)
        elif setting.value_type == 'int':
            return int(setting.value)
        elif setting.value_type == 'bool':
            return setting.value.lower() == 'true'
        return setting.value
    
    @staticmethod
    def set_setting(key, value, user_id=None):
        """Set or update a setting."""
        setting = SystemSettings.query.filter_by(key=key).first()
        
        # Auto-detect value type
        if isinstance(value, bool):
            value_type = 'bool'
        elif isinstance(value, int):
            value_type = 'int'
        elif isinstance(value, float):
            value_type = 'float'
        else:
            value_type = 'string'
        
        if setting:
            setting.value = str(value)
            setting.value_type = value_type
            if user_id:
                setting.updated_by = user_id
        else:
            setting = SystemSettings(
                key=key,
                value=str(value),
                value_type=value_type,
                updated_by=user_id
            )
            db.session.add(setting)
        
        db.session.commit()
        return setting
    
    @staticmethod
    def get_all_settings():
        """Get all settings as a dictionary."""
        settings = SystemSettings.query.all()
        result = {}
        for setting in settings:
            if setting.value_type == 'float':
                result[setting.key] = float(setting.value)
            elif setting.value_type == 'int':
                result[setting.key] = int(setting.value)
            elif setting.value_type == 'bool':
                result[setting.key] = setting.value.lower() == 'true'
            else:
                result[setting.key] = setting.value
        return result
    
    @staticmethod
    def initialize_defaults():
        """Initialize default settings if they don't exist."""
        defaults = {
            'platform_commission_rate': (0.25, 'float', 'Platform commission rate (0.25 = 25%)'),
            'tax_rate': (0.16, 'float', 'VAT tax rate (0.16 = 16%)'),
            'return_window_days': (14, 'int', 'Days customers can return products'),
            'warranty_default_months': (12, 'int', 'Default warranty period in months'),
            'low_stock_threshold': (10, 'int', 'Alert when stock falls below this number'),
            'maintenance_mode': (False, 'bool', 'Enable maintenance mode'),
            'allow_cod': (True, 'bool', 'Allow cash on delivery'),
            'allow_mpesa': (True, 'bool', 'Allow M-Pesa payments'),
            'min_order_amount': (100, 'float', 'Minimum order amount in KES'),
            'max_order_amount': (1000000, 'float', 'Maximum order amount in KES'),
        }
        
        for key, (value, value_type, description) in defaults.items():
            existing = SystemSettings.query.filter_by(key=key).first()
            if not existing:
                setting = SystemSettings(
                    key=key,
                    value=str(value),
                    value_type=value_type,
                    description=description
                )
                db.session.add(setting)
        
        db.session.commit()
