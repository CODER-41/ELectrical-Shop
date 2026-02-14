"""
Clear old mock notifications and audit logs from seed data.
"""

from app import create_app
from app.models import db
from app.models.notification import Notification
from app.models.audit_log import AuditLog

app = create_app()

with app.app_context():
    print("Clearing old mock data...")
    
    # Delete all notifications
    deleted_notifications = Notification.query.delete()
    print(f"Deleted {deleted_notifications} notifications")
    
    # Delete all audit logs
    deleted_logs = AuditLog.query.delete()
    print(f"Deleted {deleted_logs} audit logs")
    
    db.session.commit()
    print("\n Mock data cleared successfully!")
    print("New notifications and audit logs will be created automatically when actions occur.")
