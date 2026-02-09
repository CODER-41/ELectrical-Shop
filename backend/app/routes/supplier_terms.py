from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import db
from app.models.user import User, UserRole, SupplierProfile
from app.utils.responses import success_response, error_response

supplier_bp = Blueprint('supplier', __name__, url_prefix='/api/supplier')

@supplier_bp.route('/terms', methods=['GET'])
def get_terms():
    """Get supplier terms and conditions."""
    terms = {
        'version': '1.0',
        'effective_date': '2026-02-01',
        'sections': {
            'commission': {
                'platform_rate': 0.25,
                'supplier_rate': 0.75,
                'description': 'Platform charges 25% commission on all sales. Supplier receives 75% of product price.'
            },
            'refund_policies': [
                {
                    'type': 'supplier_fault',
                    'name': 'Supplier Fault',
                    'description': 'Defective/wrong product',
                    'supplier_pays': '100%',
                    'customer_gets': '100%',
                    'platform_pays': '0%'
                },
                {
                    'type': 'customer_changed_mind',
                    'name': 'Customer Changed Mind',
                    'description': 'Buyer remorse, no longer wants product',
                    'supplier_pays': '63.75%',
                    'customer_gets': '85%',
                    'restocking_fee': '15%',
                    'platform_keeps': 'Original commission'
                },
                {
                    'type': 'shipping_damage',
                    'name': 'Shipping Damage',
                    'description': 'Product damaged during delivery',
                    'supplier_pays': '0%',
                    'customer_gets': '100%',
                    'platform_pays': '100%'
                },
                {
                    'type': 'fraud',
                    'name': 'Fraud/Counterfeit',
                    'description': 'Counterfeit product or severe misrepresentation',
                    'supplier_pays': '110%',
                    'customer_gets': '100%',
                    'penalty': '10%',
                    'consequences': 'Account suspension/termination'
                }
            ],
            'return_window': {
                'standard_products': '14 days',
                'electronics_unopened': '7 days',
                'custom_orders': 'Non-returnable unless defective'
            },
            'performance_metrics': {
                'excellent': '0-2% return rate',
                'good': '2-5% return rate',
                'warning': '5-10% return rate',
                'suspension': '>10% return rate'
            },
            'payout_terms': {
                'schedule': 'Weekly or monthly',
                'minimum': 'Ksh 1,000',
                'method': 'M-Pesa or bank transfer',
                'deductions': 'Refunds deducted from next payout'
            }
        },
        'full_document_url': '/docs/SUPPLIER_TERMS.md'
    }
    return success_response(data=terms)


@supplier_bp.route('/terms/accept', methods=['POST'])
@jwt_required()
def accept_terms():
    """Accept supplier terms and conditions."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can accept terms', 403)
        
        supplier = user.supplier_profile
        if not supplier:
            return error_response('Supplier profile not found', 404)
        
        if supplier.terms_accepted:
            return error_response('Terms already accepted', 400)
        
        # Record acceptance
        supplier.terms_accepted = True
        supplier.terms_accepted_at = datetime.utcnow()
        supplier.terms_version = '1.0'
        supplier.terms_ip_address = request.remote_addr
        
        db.session.commit()
        
        return success_response(
            message='Terms and conditions accepted successfully',
            data={
                'terms_accepted': True,
                'terms_version': '1.0',
                'accepted_at': supplier.terms_accepted_at.isoformat()
            }
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to accept terms: {str(e)}', 500)


@supplier_bp.route('/terms/status', methods=['GET'])
@jwt_required()
def get_terms_status():
    """Check if supplier has accepted terms."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != UserRole.SUPPLIER:
            return error_response('Only suppliers can check terms status', 403)
        
        supplier = user.supplier_profile
        if not supplier:
            return error_response('Supplier profile not found', 404)
        
        return success_response(data={
            'terms_accepted': supplier.terms_accepted or False,
            'terms_version': supplier.terms_version,
            'accepted_at': supplier.terms_accepted_at.isoformat() if supplier.terms_accepted_at else None,
            'current_version': '1.0',
            'needs_reacceptance': False
        })
    except Exception as e:
        return error_response(f'Failed to get terms status: {str(e)}', 500)
