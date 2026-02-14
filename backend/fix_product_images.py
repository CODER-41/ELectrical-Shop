"""Fix product images - upload local images to Cloudinary and update database."""
from app import create_app
from app.models import db
from app.models.product import Product
import cloudinary
import cloudinary.uploader
import os

app = create_app()

with app.app_context():
    print("Fixing product images...\n")
    
    # Get the products
    philips = Product.query.filter_by(name='Philips Air Fryer XXL').first()
    hisense = Product.query.filter_by(name='Hisense 58" 4K Smart TV').first()
    
    if not philips:
        print(" Philips Air Fryer XXL not found")
    else:
        print(f"Current Philips image: {philips.image_url}")
        
    if not hisense:
        print(" Hisense Smart TV not found")
    else:
        print(f"Current Hisense image: {hisense.image_url}")
    
    # Path to assets
    assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend/electricalshop-app/src/assets')
    philips_img = os.path.join(assets_dir, 'Phiillips Air Fryer.webp')
    hisense_img = os.path.join(assets_dir, 'Hisense smart TV.webp')
    
    print(f"\nChecking files:")
    print(f"Philips exists: {os.path.exists(philips_img)}")
    print(f"Hisense exists: {os.path.exists(hisense_img)}")
    
    # Upload to Cloudinary
    try:
        if philips and os.path.exists(philips_img):
            print("\n Uploading Philips Air Fryer image to Cloudinary...")
            result = cloudinary.uploader.upload(
                philips_img,
                folder="products",
                public_id="philips-air-fryer-xxl",
                overwrite=True,
                resource_type="image"
            )
            philips.image_url = result['secure_url']
            print(f" Philips updated: {result['secure_url']}")
        
        if hisense and os.path.exists(hisense_img):
            print("\n Uploading Hisense Smart TV image to Cloudinary...")
            result = cloudinary.uploader.upload(
                hisense_img,
                folder="products",
                public_id="hisense-smart-tv",
                overwrite=True,
                resource_type="image"
            )
            hisense.image_url = result['secure_url']
            print(f" Hisense updated: {result['secure_url']}")
        
        db.session.commit()
        print("\n Database updated successfully!")
        
    except Exception as e:
        print(f"\n Error: {e}")
        print("\nCloudinary might not be configured. Using direct URLs instead...")
        
        # Fallback: Use better placeholder URLs
        if philips:
            philips.image_url = 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&h=800&fit=crop'
            print(f" Philips updated with placeholder")
        
        if hisense:
            hisense.image_url = 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop'
            print(f" Hisense updated with placeholder")
        
        db.session.commit()
        print(" Database updated with placeholders!")
