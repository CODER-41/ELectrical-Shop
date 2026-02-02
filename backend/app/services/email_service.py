"""
Email notification service for sending transactional emails.
"""

import os
from flask import current_app, render_template_string
from flask_mail import Mail, Message
from threading import Thread

mail = Mail()


def send_async_email(app, msg):
    """Send email asynchronously."""
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            current_app.logger.error(f'Failed to send email: {str(e)}')


def send_email(subject, recipients, text_body, html_body):
    """Send email with text and HTML body."""
    msg = Message(
        subject=subject,
        sender=os.getenv('MAIL_DEFAULT_SENDER', 'noreply@electronicsshop.com'),
        recipients=recipients if isinstance(recipients, list) else [recipients]
    )
    msg.body = text_body
    msg.html = html_body
    
    # Send asynchronously
    Thread(target=send_async_email, args=(current_app._get_current_object(), msg)).start()


def send_order_confirmation_email(order, customer_email):
    """Send order confirmation email."""
    subject = f'Order Confirmation - {order.order_number}'
    
    text_body = f"""
    Hi,
    
    Thank you for your order!
    
    Order Number: {order.order_number}
    Order Date: {order.created_at.strftime('%B %d, %Y')}
    Total: KES {order.total:,.2f}
    
    We'll send you another email when your order ships.
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Order Confirmed!</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>Thank you for your order! We're getting it ready for you.</p>
            
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> {order.order_number}</p>
                <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y')}</p>
                <p><strong>Total:</strong> KES {order.total:,.2f}</p>
            </div>
            
            <h3>Order Items</h3>
            {''.join([f'<p>• {item.product_name} x {item.quantity} - KES {item.subtotal:,.2f}</p>' for item in order.items])}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p>We'll send you another email when your order ships.</p>
                <p style="color: #6b7280; font-size: 14px;">
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_payment_confirmation_email(order, customer_email):
    """Send payment confirmation email."""
    subject = f'Payment Confirmed - {order.order_number}'
    
    text_body = f"""
    Hi,
    
    Your payment has been confirmed!
    
    Order Number: {order.order_number}
    Amount Paid: KES {order.total:,.2f}
    Payment Method: {order.payment_method.value.upper()}
    Reference: {order.payment_reference or 'N/A'}
    
    Your order is now being processed.
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>✓ Payment Confirmed</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>Great news! Your payment has been confirmed.</p>
            
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Order Number:</strong> {order.order_number}</p>
                <p><strong>Amount:</strong> KES {order.total:,.2f}</p>
                <p><strong>Method:</strong> {order.payment_method.value.upper()}</p>
                <p><strong>Reference:</strong> {order.payment_reference or 'N/A'}</p>
            </div>
            
            <p>Your order is now being processed and will be shipped soon.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Track Order
                </a>
            </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_shipping_notification_email(order, customer_email):
    """Send shipping notification email."""
    subject = f'Your Order Has Shipped - {order.order_number}'
    
    text_body = f"""
    Hi,
    
    Good news! Your order has been shipped.
    
    Order Number: {order.order_number}
    Estimated Delivery: {order.delivery_zone} - Check your order for details
    
    Your package is on its way!
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #8b5cf6; color: white; padding: 20px; text-align: center;">
            <h1>📦 Your Order Has Shipped!</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>Great news! Your order is on its way to you.</p>
            
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Order Number:</strong> {order.order_number}</p>
                <p><strong>Delivery Zone:</strong> {order.delivery_zone}</p>
            </div>
            
            <p>Your package should arrive soon. We'll notify you when it's delivered.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Track Order
                </a>
            </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_delivery_confirmation_email(order, customer_email):
    """Send delivery confirmation email."""
    subject = f'Order Delivered - {order.order_number}'
    
    text_body = f"""
    Hi,
    
    Your order has been delivered!
    
    Order Number: {order.order_number}
    
    We hope you love your purchase!
    Please consider leaving a review to help other customers.
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>✓ Order Delivered</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>Your order has been successfully delivered!</p>
            
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Order Number:</strong> {order.order_number}</p>
            </div>
            
            <p>We hope you love your purchase!</p>
            <p>If you have any issues or concerns, please don't hesitate to contact us.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
                    Leave a Review
                </a>
            </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_return_confirmation_email(return_request, customer_email):
    """Send return request confirmation email."""
    subject = f'Return Request Received - {return_request.return_number}'
    
    text_body = f"""
    Hi,
    
    We've received your return request.
    
    Return Number: {return_request.return_number}
    Order Number: {return_request.order.order_number}
    Reason: {return_request.reason.value}
    
    We'll review your request and get back to you within 24-48 hours.
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Return Request Received</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>We've received your return request and will review it shortly.</p>
            
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Return Number:</strong> {return_request.return_number}</p>
                <p><strong>Order Number:</strong> {return_request.order.order_number}</p>
                <p><strong>Reason:</strong> {return_request.reason.value.replace('_', ' ').title()}</p>
            </div>
            
            <p>We'll review your request and get back to you within 24-48 hours.</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_supplier_approval_email(supplier_email, business_name):
    """Send supplier approval notification."""
    subject = 'Your Supplier Account Has Been Approved!'
    
    text_body = f"""
    Hi {business_name},
    
    Congratulations! Your supplier account has been approved.
    
    You can now start adding products and selling on Electronics Shop.
    
    Log in to your account to get started.
    
    Welcome aboard!
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>🎉 Account Approved!</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi {business_name},</p>
            <p>Congratulations! Your supplier account has been approved.</p>
            
            <p>You can now:</p>
            <ul>
                <li>Add your products</li>
                <li>Manage inventory</li>
                <li>View orders</li>
                <li>Track earnings</li>
            </ul>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Get Started
                </a>
            </div>
            
            <p style="margin-top: 30px;">Welcome aboard!</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, supplier_email, text_body, html_body)


def send_warranty_expiry_reminder_email(order_item, customer_email, days_remaining):
    """Send warranty expiry reminder."""
    subject = f'Warranty Expiring Soon - {order_item.product_name}'
    
    text_body = f"""
    Hi,
    
    This is a reminder that the warranty for your product is expiring soon.
    
    Product: {order_item.product_name}
    Warranty Period: {order_item.warranty_period_months} months
    Days Remaining: {days_remaining} days
    
    If you have any issues with the product, please contact us before the warranty expires.
    
    Thanks,
    Electronics Shop Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #eab308; color: white; padding: 20px; text-align: center;">
            <h1>⏰ Warranty Expiring Soon</h1>
        </div>
        
        <div style="padding: 20px;">
            <p>Hi,</p>
            <p>This is a reminder that the warranty for your product is expiring soon.</p>
            
            <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #eab308;">
                <p><strong>Product:</strong> {order_item.product_name}</p>
                <p><strong>Warranty Period:</strong> {order_item.warranty_period_months} months</p>
                <p><strong>Days Remaining:</strong> {days_remaining} days</p>
            </div>
            
            <p>If you're experiencing any issues with the product, please contact us before the warranty expires.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Contact Support
                </a>
            </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)
