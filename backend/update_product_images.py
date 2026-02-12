"""Update product images to use local assets."""
from app import create_app
from app.models import db
from app.models.product import Product

app = create_app()

with app.app_context():
    # Update Philips Air Fryer
    philips = Product.query.filter_by(name='Philips Air Fryer XXL').first()
    if philips:
        philips.image_url = '/src/assets/Phiillips Air Fryer.webp'
        print(f"✓ Updated Philips Air Fryer image")
    
    # Update Hisense TV
    hisense = Product.query.filter_by(name='Hisense 58" 4K Smart TV').first()
    if hisense:
        hisense.image_url = '/src/assets/Hisense smart TV.webp'
        print(f"✓ Updated Hisense Smart TV image")
    
    db.session.commit()
    print("\n✓ Product images updated successfully")
