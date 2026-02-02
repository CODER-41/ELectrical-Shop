"""
Image upload routes for Cloudinary integration.
"""

from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User, UserRole
from app.utils.responses import success_response, error_response
from app.services.cloudinary_service import cloudinary_service, validate_cloudinary_config

uploads_bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')


@uploads_bp.route('/product', methods=['POST'])
@jwt_required()
def upload_product_image():
    """
    Upload a product image.
    Only suppliers and admins can upload product images.

    Accepts:
    - multipart/form-data with 'image' file
    - JSON with 'image' as base64 string or URL

    Optional query params:
    - product_slug: For naming the image
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check permissions
        if user.role not in [UserRole.SUPPLIER, UserRole.ADMIN, UserRole.PRODUCT_MANAGER]:
            return error_response('Only suppliers and admins can upload product images', 403)

        # Check Cloudinary configuration
        config_check = validate_cloudinary_config()
        if not config_check['configured']:
            return error_response(config_check['message'], 500)

        # Get the image
        if 'image' in request.files:
            # File upload
            file = request.files['image']

            if file.filename == '':
                return error_response('No file selected', 400)

            # Validate file size (5MB max)
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to start

            if file_size > 5 * 1024 * 1024:
                return error_response('File size must be less than 5MB', 400)

            # Validate file type
            allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
            ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
            if ext not in allowed_extensions:
                return error_response(f'File type not allowed. Allowed: {", ".join(allowed_extensions)}', 400)

            image = file

        elif request.is_json and request.json.get('image'):
            # Base64 or URL
            image = request.json.get('image')
        else:
            return error_response('No image provided', 400)

        # Get optional product slug
        product_slug = request.args.get('product_slug') or (request.json or {}).get('product_slug')

        # Upload to Cloudinary
        result = cloudinary_service.upload_product_image(image, product_slug)

        if result['success']:
            return success_response(
                data={
                    'url': result['url'],
                    'public_id': result['public_id'],
                    'width': result.get('width'),
                    'height': result.get('height')
                },
                message='Image uploaded successfully'
            )
        else:
            return error_response(result.get('error', 'Upload failed'), 500)

    except Exception as e:
        current_app.logger.error(f'Product image upload error: {str(e)}')
        return error_response(f'Image upload failed: {str(e)}', 500)


@uploads_bp.route('/return', methods=['POST'])
@jwt_required()
def upload_return_image():
    """
    Upload a return proof image.
    Customers can upload images for their return requests.

    Accepts:
    - multipart/form-data with 'image' file

    Required:
    - return_number: The return request number
    """
    try:
        user_id = get_jwt_identity()

        # Check Cloudinary configuration
        config_check = validate_cloudinary_config()
        if not config_check['configured']:
            return error_response(config_check['message'], 500)

        # Get return number
        return_number = request.form.get('return_number') or request.args.get('return_number')
        if not return_number:
            return error_response('Return number is required', 400)

        # Get the image
        if 'image' not in request.files:
            return error_response('No image provided', 400)

        file = request.files['image']

        if file.filename == '':
            return error_response('No file selected', 400)

        # Validate file size (5MB max)
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)

        if file_size > 5 * 1024 * 1024:
            return error_response('File size must be less than 5MB', 400)

        # Upload to Cloudinary
        result = cloudinary_service.upload_return_image(file, return_number)

        if result['success']:
            return success_response(
                data={
                    'url': result['url'],
                    'public_id': result['public_id']
                },
                message='Image uploaded successfully'
            )
        else:
            return error_response(result.get('error', 'Upload failed'), 500)

    except Exception as e:
        current_app.logger.error(f'Return image upload error: {str(e)}')
        return error_response(f'Image upload failed: {str(e)}', 500)


@uploads_bp.route('/brand', methods=['POST'])
@jwt_required()
def upload_brand_logo():
    """
    Upload a brand logo.
    Only admins can upload brand logos.

    Accepts:
    - multipart/form-data with 'image' file

    Required:
    - brand_name: The brand name
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check permissions
        if user.role not in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER]:
            return error_response('Only admins can upload brand logos', 403)

        # Check Cloudinary configuration
        config_check = validate_cloudinary_config()
        if not config_check['configured']:
            return error_response(config_check['message'], 500)

        # Get brand name
        brand_name = request.form.get('brand_name') or request.args.get('brand_name')
        if not brand_name:
            return error_response('Brand name is required', 400)

        # Get the image
        if 'image' not in request.files:
            return error_response('No image provided', 400)

        file = request.files['image']

        if file.filename == '':
            return error_response('No file selected', 400)

        # Upload to Cloudinary
        result = cloudinary_service.upload_brand_logo(file, brand_name)

        if result['success']:
            return success_response(
                data={
                    'url': result['url'],
                    'public_id': result['public_id']
                },
                message='Logo uploaded successfully'
            )
        else:
            return error_response(result.get('error', 'Upload failed'), 500)

    except Exception as e:
        current_app.logger.error(f'Brand logo upload error: {str(e)}')
        return error_response(f'Image upload failed: {str(e)}', 500)


@uploads_bp.route('/signature', methods=['POST'])
@jwt_required()
def get_upload_signature():
    """
    Get a signature for client-side direct uploads to Cloudinary.
    This allows the frontend to upload directly to Cloudinary.

    Expected payload:
    {
        "folder": "products|returns|brands",
        "public_id": "optional-custom-id"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check permissions
        if user.role not in [UserRole.SUPPLIER, UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.CUSTOMER]:
            return error_response('Unauthorized', 403)

        data = request.get_json() or {}
        folder = data.get('folder', 'products')

        # Validate folder
        valid_folders = ['products', 'returns', 'brands']
        if folder not in valid_folders:
            return error_response(f'Invalid folder. Must be one of: {", ".join(valid_folders)}', 400)

        # Customers can only upload to returns folder
        if user.role == UserRole.CUSTOMER and folder != 'returns':
            return error_response('Customers can only upload return images', 403)

        # Prepare params for signing
        params = {
            'folder': cloudinary_service.FOLDERS.get(folder, f'electronics-shop/{folder}')
        }

        if data.get('public_id'):
            params['public_id'] = data['public_id']

        # Generate signature
        signature_data = cloudinary_service.generate_upload_signature(params)

        return success_response(
            data={
                **signature_data,
                'folder': params['folder']
            },
            message='Signature generated successfully'
        )

    except Exception as e:
        current_app.logger.error(f'Signature generation error: {str(e)}')
        return error_response(f'Failed to generate signature: {str(e)}', 500)


@uploads_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_image():
    """
    Delete an image from Cloudinary.
    Only admins can delete images.

    Expected payload:
    {
        "public_id": "the-public-id-to-delete"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check permissions
        if user.role not in [UserRole.ADMIN]:
            return error_response('Only admins can delete images', 403)

        data = request.get_json()
        if not data or not data.get('public_id'):
            return error_response('Public ID is required', 400)

        result = cloudinary_service.delete_image(data['public_id'])

        if result['success']:
            return success_response(message='Image deleted successfully')
        else:
            return error_response(result.get('error', 'Deletion failed'), 500)

    except Exception as e:
        current_app.logger.error(f'Image deletion error: {str(e)}')
        return error_response(f'Image deletion failed: {str(e)}', 500)
