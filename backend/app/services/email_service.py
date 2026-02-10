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
    
    # Determine payment status display
    payment_status = {
        'pending': {'text': 'Payment Pending', 'color': '#eab308', 'bg': '#fef3c7'},
        'paid': {'text': 'Payment Confirmed', 'color': '#10b981', 'bg': '#d1fae5'},
        'failed': {'text': 'Payment Failed', 'color': '#ef4444', 'bg': '#fee2e2'}
    }.get(order.payment_status.value if order.payment_status else 'pending', 
          {'text': 'Payment Pending', 'color': '#eab308', 'bg': '#fef3c7'})
    
    # Calculate order summary
    subtotal = sum(item.subtotal for item in order.items)
    delivery_fee = order.delivery_fee or 0

    # Pre-compute items list (backslashes not allowed in f-string expressions on Python < 3.12)
    items_text = ''.join([f'• {item.product_name} x {item.quantity} - KES {item.subtotal:,.2f}\n    ' for item in order.items])

    text_body = f"""
    Hi {order.customer.first_name if order.customer else 'Customer'},

    Thank you for your order!

    Order Number: {order.order_number}
    Order Date: {order.created_at.strftime('%B %d, %Y')}
    Payment Status: {payment_status['text']}
    Total: KES {order.total:,.2f}

    Order Items:
    {items_text}
    
    Delivery Address:
    {order.delivery_address.full_name if order.delivery_address else 'N/A'}
    {order.delivery_address.address_line_1 if order.delivery_address else ''}
    {order.delivery_address.city if order.delivery_address else ''}, {order.delivery_address.county if order.delivery_address else ''}
    
    We'll send you another email when your order ships.
    
    Thanks,
    Electronics Shop Team
    """
    
    # Frontend URL for order tracking
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    track_url = f"{frontend_url}/orders/{order.id}"
    # Use Cloudinary hosted favicon
    cloudinary_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    logo_url = f"https://res.cloudinary.com/{cloudinary_name}/image/upload/v1/fav.png"
    logo_html = f'''<img src="{logo_url}" alt="Electronics Shop" style="height: 50px; width: auto; margin-bottom: 15px;">'''
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center;">
                {logo_html}
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for shopping with us</p>
            </div>
            
            <!-- Order Status -->
            <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                <div style="display: inline-block; background: {payment_status['bg']}; color: {payment_status['color']}; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                    {payment_status['text']}
                </div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 20px;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">Hi {order.customer.first_name if order.customer else 'Customer'},</p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Thank you for your order! We're getting it ready for you.</p>
                
                <!-- Order Details Card -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">Order Details</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280;">Order Number:</span>
                        <span style="font-weight: bold; color: #1f2937;">{order.order_number}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280;">Order Date:</span>
                        <span style="color: #1f2937;">{order.created_at.strftime('%B %d, %Y at %I:%M %p')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #6b7280;">Payment Method:</span>
                        <span style="color: #1f2937; text-transform: capitalize;">{order.payment_method.value if order.payment_method else 'N/A'}</span>
                    </div>
                    {f'<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Payment Reference:</span><span style="color: #1f2937; font-family: monospace;">{order.payment_reference}</span></div>' if order.payment_reference else ''}
                </div>
                
                <!-- Order Items -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 20px;">Order Items</h3>
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        {''.join([f'''<div style="padding: 15px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">{item.product_name}</div>
                                <div style="color: #6b7280; font-size: 14px;">Quantity: {item.quantity}</div>
                            </div>
                            <div style="font-weight: bold; color: #1f2937;">KES {item.subtotal:,.2f}</div>
                        </div>''' for item in order.items])}
                    </div>
                </div>
                
                <!-- Order Summary -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">Order Summary</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Subtotal:</span>
                        <span style="color: #1f2937;">KES {subtotal:,.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Delivery Fee:</span>
                        <span style="color: #1f2937;">KES {delivery_fee:,.2f}</span>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: bold; color: #1f2937; font-size: 18px;">Total:</span>
                            <span style="font-weight: bold; color: #f97316; font-size: 18px;">KES {order.total:,.2f}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Delivery Information -->
                {f'''<div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">Delivery Information</h3>
                    <div style="color: #374151; line-height: 1.6;">
                        <strong>{order.delivery_address.full_name}</strong><br>
                        {order.delivery_address.phone_number}<br>
                        {order.delivery_address.address_line_1}<br>
                        {order.delivery_address.address_line_2 + '<br>' if order.delivery_address.address_line_2 else ''}
                        {order.delivery_address.city}, {order.delivery_address.county}<br>
                        <strong>Delivery Zone:</strong> {order.delivery_zone or 'Standard'}
                    </div>
                </div>''' if order.delivery_address else ''}
                
                <!-- Action Buttons -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="{track_url}" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">Track Your Order</a>
                    <a href="{frontend_url}/contact" style="display: inline-block; background: transparent; color: #f97316; padding: 14px 28px; text-decoration: none; border: 2px solid #f97316; border-radius: 8px; font-weight: bold;">Contact Support</a>
                </div>
                
                <!-- Next Steps -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e;">What's Next?</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                        {f'<li>Complete your payment to process the order</li>' if order.payment_status and order.payment_status.value == 'pending' else '<li>Your order is being prepared for shipment</li>'}
                        <li>We'll send you a shipping confirmation with tracking details</li>
                        <li>Estimated delivery: 2-5 business days</li>
                    </ul>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px;">
                    <p>Questions? Contact our support team at <a href="mailto:support@electronicsshop.com" style="color: #f97316;">support@electronicsshop.com</a></p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Electronics Shop. All rights reserved.</p>
                <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
                    This email was sent to {customer_email}. If you have any questions, please contact our support team.
                </p>
            </div>
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
            <h1>Payment Confirmed</h1>
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
            <h1>Your Order Has Shipped!</h1>
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
            <h1>Order Delivered</h1>
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
            <h1>Account Approved!</h1>
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
            <h1>Warranty Expiring Soon</h1>
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


def send_otp_email(email, otp_code, purpose='verification'):
    """Send OTP verification email."""
    if purpose == 'verification':
        subject = 'Verify Your Email - Electronics Shop'
        action_text = 'verify your email address'
    elif purpose == 'password_reset':
        subject = 'Password Reset OTP - Electronics Shop'
        action_text = 'reset your password'
    else:
        subject = 'Your OTP Code - Electronics Shop'
        action_text = 'complete your request'

    text_body = f"""
    Hi,

    Your OTP code to {action_text} is:

    {otp_code}

    This code will expire in 10 minutes.

    If you didn't request this code, please ignore this email.

    Thanks,
    Electronics Shop Team
    """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Electronics Shop</h1>
        </div>

        <div style="padding: 30px; text-align: center;">
            <p style="font-size: 16px; color: #374151;">Your OTP code to {action_text} is:</p>

            <div style="background: #f3f4f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h1 style="font-size: 48px; letter-spacing: 10px; color: #f97316; margin: 0;">{otp_code}</h1>
            </div>

            <p style="color: #6b7280; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
        </div>

        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

    send_email(subject, email, text_body, html_body)


def send_welcome_email(email, first_name):
    """Send welcome email to new users."""
    subject = 'Welcome to Electronics Shop!'

    text_body = f"""
    Hi {first_name},

    Welcome to Electronics Shop!

    Thank you for creating an account with us. You now have access to:
    - Browse thousands of electronics products
    - Track your orders
    - Save your favorite items
    - Get exclusive deals and offers

    Start shopping now and find the best electronics at great prices!

    Thanks,
    Electronics Shop Team
    """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to Electronics Shop!</h1>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 18px;">Hi {first_name},</p>
            <p>Thank you for creating an account with us!</p>

            <p>You now have access to:</p>
            <ul style="color: #374151;">
                <li>Browse thousands of electronics products</li>
                <li>Track your orders</li>
                <li>Save your favorite items</li>
                <li>Get exclusive deals and offers</li>
            </ul>

            <div style="margin-top: 30px; text-align: center;">
                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Start Shopping
                </a>
            </div>
        </div>

        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

    send_email(subject, email, text_body, html_body)


def send_contact_form_notification(name, email, subject_line, message):
    """Send notification when someone submits the contact form."""
    admin_email = os.getenv('ADMIN_EMAIL', os.getenv('MAIL_USERNAME'))
    subject = f'New Contact Form Submission: {subject_line}'

    text_body = f"""
    New contact form submission received:

    Name: {name}
    Email: {email}
    Subject: {subject_line}

    Message:
    {message}
    """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>New Contact Form Submission</h1>
        </div>

        <div style="padding: 20px;">
            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
                <p><strong>Subject:</strong> {subject_line}</p>
            </div>

            <h3>Message:</h3>
            <div style="background: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <p style="white-space: pre-wrap;">{message}</p>
            </div>

            <div style="margin-top: 20px;">
                <a href="mailto:{email}?subject=Re: {subject_line}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                    Reply to {name}
                </a>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(subject, admin_email, text_body, html_body)


def send_contact_form_confirmation(name, email, subject_line):
    """Send confirmation to user who submitted contact form."""
    subject = 'We received your message - Electronics Shop'

    text_body = f"""
    Hi {name},

    Thank you for contacting Electronics Shop!

    We have received your message regarding: {subject_line}

    Our team will review your inquiry and get back to you within 24-48 hours.

    Thanks,
    Electronics Shop Team
    """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Message Received!</h1>
        </div>

        <div style="padding: 30px;">
            <p>Hi {name},</p>
            <p>Thank you for contacting Electronics Shop!</p>

            <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Your inquiry:</strong> {subject_line}</p>
            </div>

            <p>Our team will review your message and get back to you within <strong>24-48 hours</strong>.</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If your matter is urgent, please call us directly at our customer service hotline.
            </p>
        </div>

        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2026 Electronics Shop. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

    send_email(subject, email, text_body, html_body)


def send_order_cancellation_email(order, customer_email, reason=''):
    """Send order cancellation confirmation email."""
    subject = f'Order Cancelled - {order.order_number}'
    
    text_body = f"""
    Hi {order.customer.first_name if order.customer else 'Customer'},
    
    Your order has been cancelled.
    
    Order Number: {order.order_number}
    Cancellation Date: {order.updated_at.strftime('%B %d, %Y at %I:%M %p')}
    {f'Reason: {reason}' if reason else ''}
    
    {f'Refund Status: Your payment of KES {order.total:,.2f} will be refunded within 5-7 business days.' if order.payment_status and order.payment_status.value == 'completed' else 'No payment was processed for this order.'}
    
    If you have any questions, please contact our support team.
    
    Thanks,
    Electronics Shop Team
    """
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: #ef4444; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">Order Cancelled</h1>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 16px; color: #374151;">Hi {order.customer.first_name if order.customer else 'Customer'},</p>
                <p style="font-size: 16px; color: #374151;">Your order has been cancelled as requested.</p>
                
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #991b1b;">Cancellation Details</h3>
                    <div style="color: #7f1d1d;">
                        <p style="margin: 8px 0;"><strong>Order Number:</strong> {order.order_number}</p>
                        <p style="margin: 8px 0;"><strong>Cancelled On:</strong> {order.updated_at.strftime('%B %d, %Y at %I:%M %p')}</p>
                        {f'<p style="margin: 8px 0;"><strong>Reason:</strong> {reason}</p>' if reason else ''}
                    </div>
                </div>
                
                {f'''<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e;">Refund Information</h4>
                    <p style="margin: 0; color: #92400e;">Your payment of <strong>KES {order.total:,.2f}</strong> will be refunded to your original payment method within <strong>5-7 business days</strong>.</p>
                </div>''' if order.payment_status and order.payment_status.value == 'completed' else '<div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;"><p style="margin: 0; color: #1e40af;">No payment was processed for this order.</p></div>'}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{frontend_url}/products" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue Shopping</a>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>Questions? Contact us at <a href="mailto:support@electronicsshop.com" style="color: #f97316;">support@electronicsshop.com</a></p>
                </div>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Electronics Shop. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)


def send_order_status_update_email(order, customer_email, old_status, new_status):
    """Send email when order status changes."""
    status_messages = {
        'pending': {'title': 'Order Received', 'message': 'We have received your order and are preparing it for processing.', 'color': '#eab308'},
        'paid': {'title': 'Payment Confirmed', 'message': 'Your payment has been confirmed and your order is being prepared.', 'color': '#10b981'},
        'processing': {'title': 'Order Processing', 'message': 'Your order is being prepared for shipment.', 'color': '#3b82f6'},
        'quality_approved': {'title': 'Quality Check Passed', 'message': 'Your order has passed our quality checks and will be shipped soon.', 'color': '#8b5cf6'},
        'shipped': {'title': 'Order Shipped', 'message': 'Your order is on its way to you!', 'color': '#8b5cf6'},
        'delivered': {'title': 'Order Delivered', 'message': 'Your order has been delivered. We hope you love it!', 'color': '#10b981'},
    }
    
    status_info = status_messages.get(new_status, {'title': 'Order Update', 'message': f'Your order status has been updated to {new_status}.', 'color': '#6b7280'})
    
    subject = f'{status_info["title"]} - {order.order_number}'
    
    text_body = f"""
    Hi {order.customer.first_name if order.customer else 'Customer'},
    
    Your order status has been updated!
    
    Order Number: {order.order_number}
    Status: {new_status.replace('_', ' ').title()}
    
    {status_info['message']}
    
    Track your order for more details.
    
    Thanks,
    Electronics Shop Team
    """
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    track_url = f"{frontend_url}/orders/{order.id}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: {status_info['color']}; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">{status_info['title']}</h1>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 16px; color: #374151;">Hi {order.customer.first_name if order.customer else 'Customer'},</p>
                <p style="font-size: 16px; color: #374151;">{status_info['message']}</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">Order Details</h3>
                    <div style="color: #374151;">
                        <p style="margin: 8px 0;"><strong>Order Number:</strong> {order.order_number}</p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: {status_info['color']}; font-weight: bold;">{new_status.replace('_', ' ').title()}</span></p>
                        <p style="margin: 8px 0;"><strong>Total:</strong> KES {order.total:,.2f}</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{track_url}" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Your Order</a>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>Questions? Contact us at <a href="mailto:support@electronicsshop.com" style="color: #f97316;">support@electronicsshop.com</a></p>
                </div>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Electronics Shop. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, customer_email, text_body, html_body)
