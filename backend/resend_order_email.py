#!/usr/bin/env python3
"""
Utility script to resend order confirmation email for testing purposes.
Usage: python resend_order_email.py ORD-20260203-0001
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.order import Order
from app.services.email_service import send_order_confirmation_email

def resend_order_email(order_number):
    """Resend order confirmation email for a specific order."""
    app = create_app()
    
    with app.app_context():
        # Find the order by order number
        order = Order.query.filter_by(order_number=order_number).first()
        
        if not order:
            print(f"Order {order_number} not found!")
            return False
        
        if not order.customer:
            print(f"Order {order_number} has no customer associated!")
            return False
        
        customer_email = order.customer.user.email
        print(f"Resending order confirmation email for {order_number} to {customer_email}")
        
        try:
            send_order_confirmation_email(order, customer_email)
            print("✅ Email sent successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python resend_order_email.py <ORDER_NUMBER>")
        print("Example: python resend_order_email.py ORD-20260203-0001")
        sys.exit(1)
    
    order_number = sys.argv[1]
    success = resend_order_email(order_number)
    sys.exit(0 if success else 1)