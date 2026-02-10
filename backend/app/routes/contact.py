"""
Contact form routes.
Supports both direct email sending and Web3Forms integration.
"""

import os
import requests
from flask import Blueprint, request
from app.utils.validation import validate_email, validate_required_fields
from app.utils.responses import success_response, error_response, validation_error_response
from app.services.email_service import send_contact_form_notification, send_contact_form_confirmation

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')


@contact_bp.route('', methods=['POST'])
@validate_required_fields(['name', 'email', 'subject', 'message'])
def submit_contact_form():
    """
    Submit contact form.
    Sends email notification to admin and confirmation to user.

    If WEB3FORMS_ACCESS_KEY is set, uses Web3Forms API.
    Otherwise, sends via configured SMTP.
    """
    try:
        data = request.get_json()

        name = data['name'].strip()
        email = data['email'].strip().lower()
        subject = data['subject'].strip()
        message = data['message'].strip()

        # Validate email
        if not validate_email(email):
            return validation_error_response({'email': 'Invalid email format'})

        # Validate message length
        if len(message) < 10:
            return validation_error_response({'message': 'Message must be at least 10 characters'})

        if len(message) > 5000:
            return validation_error_response({'message': 'Message must be less than 5000 characters'})

        # Check if Web3Forms is configured
        web3forms_key = os.getenv('WEB3FORMS_ACCESS_KEY')

        # Always use direct SMTP for now (Web3Forms has restrictions)
        try:
            send_contact_form_notification(name, email, subject, message)
            send_contact_form_confirmation(name, email, subject)
        except Exception as e:
            return error_response(f'Failed to send message: {str(e)}', 500)

        return success_response(
            message='Thank you for your message! We will get back to you soon.',
            status_code=201
        )

    except Exception as e:
        return error_response(f'Failed to submit contact form: {str(e)}', 500)


def send_via_web3forms(access_key, name, email, subject, message):
    """
    Send contact form via Web3Forms API.

    Web3Forms is a free contact form API that handles email delivery.
    Get your access key at: https://web3forms.com/
    """
    try:
        response = requests.post(
            'https://api.web3forms.com/submit',
            json={
                'access_key': access_key,
                'name': name,
                'email': email,
                'subject': f'Contact Form: {subject}',
                'message': message,
                'from_name': 'Electronics Shop Contact Form',
                'replyto': email
            },
            headers={'Content-Type': 'application/json'}
        )

        result = response.json()

        if response.status_code == 200 and result.get('success'):
            return {'success': True}
        else:
            return {
                'success': False,
                'error': result.get('message', 'Failed to send via Web3Forms')
            }

    except Exception as e:
        return {'success': False, 'error': str(e)}


@contact_bp.route('/info', methods=['GET'])
def get_contact_info():
    """Get contact information for the store."""
    return success_response(data={
        'email': os.getenv('CONTACT_EMAIL', 'support@electronicsshop.com'),
        'phone': os.getenv('CONTACT_PHONE', '+254 700 000 000'),
        'address': os.getenv('CONTACT_ADDRESS', 'Nairobi, Kenya'),
        'hours': {
            'weekdays': '8:00 AM - 6:00 PM',
            'saturday': '9:00 AM - 4:00 PM',
            'sunday': 'Closed'
        },
        'social': {
            'facebook': os.getenv('SOCIAL_FACEBOOK', ''),
            'twitter': os.getenv('SOCIAL_TWITTER', ''),
            'instagram': os.getenv('SOCIAL_INSTAGRAM', ''),
            'whatsapp': os.getenv('SOCIAL_WHATSAPP', '')
        }
    })
