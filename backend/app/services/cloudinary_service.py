"""
Cloudinary service for image uploads.
Handles product images and return proof images.
"""

import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app


# Configure Cloudinary
def configure_cloudinary():
    """Configure Cloudinary with environment variables."""
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET'),
        secure=True
    )


class CloudinaryService:
    """Service for handling Cloudinary image uploads."""

    # Allowed image formats
    ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    # Maximum file size (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024

    # Image folders
    FOLDERS = {
        'products': 'electronics-shop/products',
        'returns': 'electronics-shop/returns',
        'brands': 'electronics-shop/brands',
        'users': 'electronics-shop/users'
    }

    def __init__(self):
        """Initialize the service and configure Cloudinary."""
        configure_cloudinary()

    def upload_image(self, file, folder='products', public_id=None, transformation=None):
        """
        Upload an image to Cloudinary.

        Args:
            file: File object or base64 string or URL
            folder: Folder name (products, returns, brands, users)
            public_id: Optional custom public ID
            transformation: Optional transformation dict

        Returns:
            dict: Upload result with URL and public_id
        """
        try:
            folder_path = self.FOLDERS.get(folder, f'electronics-shop/{folder}')

            # Default transformation for product images
            if transformation is None and folder == 'products':
                transformation = {
                    'width': 800,
                    'height': 800,
                    'crop': 'limit',
                    'quality': 'auto:good',
                    'fetch_format': 'auto'
                }

            upload_options = {
                'folder': folder_path,
                'resource_type': 'image',
                'allowed_formats': self.ALLOWED_FORMATS,
                'transformation': transformation
            }

            if public_id:
                upload_options['public_id'] = public_id
                upload_options['overwrite'] = True

            result = cloudinary.uploader.upload(file, **upload_options)

            return {
                'success': True,
                'url': result.get('secure_url'),
                'public_id': result.get('public_id'),
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'bytes': result.get('bytes')
            }

        except cloudinary.exceptions.Error as e:
            current_app.logger.error(f'Cloudinary upload error: {str(e)}')
            return {
                'success': False,
                'error': f'Image upload failed: {str(e)}'
            }
        except Exception as e:
            current_app.logger.error(f'Unexpected upload error: {str(e)}')
            return {
                'success': False,
                'error': f'Image upload failed: {str(e)}'
            }

    def upload_product_image(self, file, product_slug=None):
        """
        Upload a product image with optimized settings.

        Args:
            file: Image file
            product_slug: Optional product slug for naming

        Returns:
            dict: Upload result
        """
        transformation = {
            'width': 800,
            'height': 800,
            'crop': 'limit',
            'quality': 'auto:good',
            'fetch_format': 'auto'
        }

        public_id = product_slug if product_slug else None

        return self.upload_image(
            file,
            folder='products',
            public_id=public_id,
            transformation=transformation
        )

    def upload_return_image(self, file, return_number):
        """
        Upload a return proof image.

        Args:
            file: Image file
            return_number: Return request number

        Returns:
            dict: Upload result
        """
        transformation = {
            'width': 1200,
            'height': 1200,
            'crop': 'limit',
            'quality': 'auto:good'
        }

        return self.upload_image(
            file,
            folder='returns',
            public_id=f'{return_number}-{os.urandom(4).hex()}',
            transformation=transformation
        )

    def upload_brand_logo(self, file, brand_name):
        """
        Upload a brand logo.

        Args:
            file: Image file
            brand_name: Brand name for naming

        Returns:
            dict: Upload result
        """
        transformation = {
            'width': 200,
            'height': 200,
            'crop': 'fit',
            'quality': 'auto:good',
            'fetch_format': 'auto'
        }

        # Sanitize brand name for public_id
        public_id = brand_name.lower().replace(' ', '-').replace('/', '-')

        return self.upload_image(
            file,
            folder='brands',
            public_id=public_id,
            transformation=transformation
        )

    def upload_profile_image(self, file, user_id):
        """
        Upload a profile image.

        Args:
            file: Image file
            user_id: User ID for naming

        Returns:
            dict: Upload result
        """
        transformation = {
            'width': 300,
            'height': 300,
            'crop': 'fill',
            'gravity': 'face',
            'quality': 'auto:good',
            'fetch_format': 'auto'
        }

        return self.upload_image(
            file,
            folder='users',
            public_id=f'profile-{user_id}',
            transformation=transformation
        )

    def delete_image(self, public_id):
        """
        Delete an image from Cloudinary.

        Args:
            public_id: The public ID of the image to delete

        Returns:
            dict: Deletion result
        """
        try:
            result = cloudinary.uploader.destroy(public_id)

            return {
                'success': result.get('result') == 'ok',
                'result': result.get('result')
            }

        except cloudinary.exceptions.Error as e:
            current_app.logger.error(f'Cloudinary delete error: {str(e)}')
            return {
                'success': False,
                'error': f'Image deletion failed: {str(e)}'
            }

    def get_optimized_url(self, public_id, width=None, height=None, crop='fill'):
        """
        Get an optimized URL for an image.

        Args:
            public_id: The public ID of the image
            width: Desired width
            height: Desired height
            crop: Crop mode

        Returns:
            str: Optimized image URL
        """
        transformations = {
            'quality': 'auto',
            'fetch_format': 'auto'
        }

        if width:
            transformations['width'] = width
        if height:
            transformations['height'] = height
        if width or height:
            transformations['crop'] = crop

        return cloudinary.CloudinaryImage(public_id).build_url(**transformations)

    def generate_upload_signature(self, params):
        """
        Generate a signature for client-side uploads.

        Args:
            params: Parameters to sign

        Returns:
            dict: Signature and timestamp
        """
        import time

        timestamp = int(time.time())
        params['timestamp'] = timestamp

        signature = cloudinary.utils.api_sign_request(
            params,
            os.getenv('CLOUDINARY_API_SECRET')
        )

        return {
            'signature': signature,
            'timestamp': timestamp,
            'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
            'api_key': os.getenv('CLOUDINARY_API_KEY')
        }


def validate_cloudinary_config():
    """Validate Cloudinary configuration."""
    required_vars = [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ]

    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)

    if missing:
        return {
            'configured': False,
            'missing': missing,
            'message': f"Missing Cloudinary configuration: {', '.join(missing)}"
        }

    return {
        'configured': True,
        'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'message': 'Cloudinary configuration is valid'
    }


# Initialize service instance
cloudinary_service = CloudinaryService()
