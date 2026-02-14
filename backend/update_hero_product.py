"""
Update hero product from iPad Air to iPhone 15 Pro Max
"""
from app import create_app
from app.models import db
from app.models.product import Product

app = create_app()

with app.app_context():
    # Find iPad Air product
    ipad = Product.query.filter(Product.name.ilike('%ipad%air%')).first()
    
    if ipad:
        print(f"Found product: {ipad.name}")
        print(f"Current details: {ipad.to_dict()}")
        
        # Update to iPhone 15 Pro Max
        ipad.name = "iPhone 15 Pro Max"
        ipad.short_description = "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system"
        ipad.long_description = """
        The iPhone 15 Pro Max features the powerful A17 Pro chip, stunning titanium design, 
        and the most advanced iPhone camera system ever. With ProMotion display, 
        Action button, and USB-C connectivity.
        
        Key Features:
        - A17 Pro chip with 6-core GPU
        - 6.7-inch Super Retina XDR display
        - Pro camera system with 48MP main camera
        - Titanium design
        - Action button
        - USB-C port
        """
        
        # Update slug with unique identifier
        ipad.slug = "iphone-15-pro-max-hero"
        
        db.session.commit()
        print(f"\nUpdated to: {ipad.name}")
        print(f"New slug: {ipad.slug}")
    else:
        print("iPad Air product not found")
        print("\nSearching for any iPad products...")
        ipads = Product.query.filter(Product.name.ilike('%ipad%')).all()
        if ipads:
            print(f"Found {len(ipads)} iPad products:")
            for p in ipads:
                print(f"  - {p.name} (ID: {p.id})")
        else:
            print("No iPad products found in database")
