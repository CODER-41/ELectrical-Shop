#!/usr/bin/env python3
"""
Comprehensive seed script for Electronics Shop.
Creates admin user, sample users, categories, brands, delivery zones, and sample products.

Run: python seed_all.py
"""

import re
from decimal import Decimal
from app import create_app
from app.models import db
from app.models.user import User, UserRole, CustomerProfile, SupplierProfile, AdminProfile, DeliveryAgentProfile
from app.models.product import Category, Brand, Product
from app.models.order import DeliveryZone


def slugify(text):
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def seed_admin_user():
    """Create default admin user."""
    print("\n--- Seeding Admin User ---")

    admin_email = 'admin@electronics.shop'

    # Check if admin exists
    existing = User.query.filter_by(email=admin_email).first()
    if existing:
        print(f"  Admin already exists: {admin_email}")
        return existing

    # Create admin user
    admin = User(
        email=admin_email,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    admin.set_password('Admin@123')

    db.session.add(admin)
    db.session.flush()

    # Create admin profile
    admin_profile = AdminProfile(
        user=admin,
        first_name='System',
        last_name='Admin',
        phone_number='254700000000',
        permissions={
            'manage_users': True,
            'manage_products': True,
            'manage_orders': True,
            'manage_payouts': True
        }
    )
    db.session.add(admin_profile)

    print(f"  Created admin: {admin_email} / Admin@123")
    return admin


def seed_sample_suppliers():
    """Create sample suppliers for testing."""
    print("\n--- Seeding Sample Suppliers ---")

    suppliers = []

    # First supplier
    supplier1_email = 'supplier@test.com'
    existing1 = User.query.filter_by(email=supplier1_email).first()
    if existing1:
        print(f"  Supplier already exists: {supplier1_email}")
        suppliers.append(existing1)
    else:
        supplier1 = User(
            email=supplier1_email,
            role=UserRole.SUPPLIER,
            is_active=True,
            is_verified=True
        )
        supplier1.set_password('Supplier@123')
        db.session.add(supplier1)
        db.session.flush()

        supplier1_profile = SupplierProfile(
            user=supplier1,
            business_name='Tech Electronics Kenya',
            business_registration_number='PVT-2024-001',
            contact_person='John Supplier',
            phone_number='254712345678',
            mpesa_number='254712345678',
            payout_method='phone',
            is_approved=True,
            commission_rate=Decimal('0.10')
        )
        db.session.add(supplier1_profile)
        print(f"  Created supplier: {supplier1_email} / Supplier@123")
        suppliers.append(supplier1)

    # Second supplier
    supplier2_email = 'supplier2@test.com'
    existing2 = User.query.filter_by(email=supplier2_email).first()
    if existing2:
        print(f"  Supplier already exists: {supplier2_email}")
        suppliers.append(existing2)
    else:
        supplier2 = User(
            email=supplier2_email,
            role=UserRole.SUPPLIER,
            is_active=True,
            is_verified=True
        )
        supplier2.set_password('Supplier@123')
        db.session.add(supplier2)
        db.session.flush()

        supplier2_profile = SupplierProfile(
            user=supplier2,
            business_name='Digital Gadgets Hub',
            business_registration_number='PVT-2024-002',
            contact_person='Mary Vendor',
            phone_number='254722334455',
            mpesa_number='254722334455',
            payout_method='phone',
            is_approved=True,
            commission_rate=Decimal('0.10')
        )
        db.session.add(supplier2_profile)
        print(f"  Created supplier: {supplier2_email} / Supplier@123")
        suppliers.append(supplier2)

    return suppliers


def seed_sample_customer():
    """Create sample customer for testing."""
    print("\n--- Seeding Sample Customer ---")

    customer_email = 'customer@test.com'

    existing = User.query.filter_by(email=customer_email).first()
    if existing:
        print(f"  Customer already exists: {customer_email}")
        return existing

    customer = User(
        email=customer_email,
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=True
    )
    customer.set_password('Customer@123')

    db.session.add(customer)
    db.session.flush()

    customer_profile = CustomerProfile(
        user=customer,
        first_name='Jane',
        last_name='Customer',
        phone_number='254798765432',
        mpesa_number='254798765432'
    )
    db.session.add(customer_profile)

    print(f"  Created customer: {customer_email} / Customer@123")
    return customer


def seed_categories():
    """Seed product categories."""
    print("\n--- Seeding Categories ---")

    categories_data = [
        {
            'name': 'Mobile Phones & Tablets',
            'description': 'Smartphones, feature phones, and tablets',
            'suggested_specs': {
                'Screen Size': 'e.g., 6.5 inches',
                'RAM': 'e.g., 8GB',
                'Storage': 'e.g., 128GB',
                'Camera': 'e.g., 48MP',
                'Battery': 'e.g., 5000mAh',
                'Operating System': 'e.g., Android 13'
            }
        },
        {
            'name': 'Laptops & Computers',
            'description': 'Laptops, desktops, and computer accessories',
            'suggested_specs': {
                'Processor': 'e.g., Intel Core i7',
                'RAM': 'e.g., 16GB',
                'Storage': 'e.g., 512GB SSD',
                'Screen Size': 'e.g., 15.6 inches',
                'Graphics Card': 'e.g., NVIDIA GTX 1650'
            }
        },
        {
            'name': 'TVs & Home Entertainment',
            'description': 'Smart TVs, home theaters, and audio systems',
            'suggested_specs': {
                'Screen Size': 'e.g., 55 inches',
                'Resolution': 'e.g., 4K UHD',
                'Smart TV': 'e.g., Yes',
                'Display Type': 'e.g., LED'
            }
        },
        {
            'name': 'Kitchen Appliances',
            'description': 'Refrigerators, microwaves, blenders, and more',
            'suggested_specs': {
                'Capacity': 'e.g., 500L',
                'Power Consumption': 'e.g., 150W',
                'Energy Rating': 'e.g., A+'
            }
        },
        {
            'name': 'Gaming',
            'description': 'Gaming consoles, accessories, and controllers',
            'suggested_specs': {
                'Platform': 'e.g., PlayStation 5',
                'Storage': 'e.g., 825GB',
                'Resolution': 'e.g., 4K'
            }
        },
        {
            'name': 'Accessories',
            'description': 'Chargers, cables, cases, and other accessories',
            'suggested_specs': {
                'Compatibility': 'e.g., Universal',
                'Cable Length': 'e.g., 1.5m',
                'Material': 'e.g., Nylon Braided'
            }
        },
        {
            'name': 'Audio & Headphones',
            'description': 'Headphones, earbuds, speakers, and audio equipment',
            'suggested_specs': {
                'Type': 'e.g., Over-ear',
                'Connectivity': 'e.g., Bluetooth 5.0',
                'Battery Life': 'e.g., 30 hours',
                'Noise Cancellation': 'e.g., Active'
            }
        },
        {
            'name': 'Cameras & Photography',
            'description': 'Digital cameras, DSLRs, and photography equipment',
            'suggested_specs': {
                'Sensor': 'e.g., 24.2MP APS-C',
                'Video': 'e.g., 4K 30fps',
                'ISO Range': 'e.g., 100-51200'
            }
        }
    ]

    categories = {}
    for cat_data in categories_data:
        existing = Category.query.filter_by(name=cat_data['name']).first()
        if not existing:
            category = Category(
                name=cat_data['name'],
                slug=slugify(cat_data['name']),
                description=cat_data['description'],
                suggested_specs=cat_data['suggested_specs']
            )
            db.session.add(category)
            db.session.flush()
            categories[cat_data['name']] = category
            print(f"  + {cat_data['name']}")
        else:
            categories[cat_data['name']] = existing
            print(f"  - {cat_data['name']} (exists)")

    return categories


def seed_brands():
    """Seed product brands."""
    print("\n--- Seeding Brands ---")

    brands_list = [
        'Samsung', 'Apple', 'Huawei', 'Xiaomi', 'OPPO', 'Tecno', 'Infinix',
        'Nokia', 'OnePlus', 'Realme', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer',
        'Microsoft', 'MSI', 'Sony', 'LG', 'TCL', 'Hisense', 'Panasonic',
        'Philips', 'Bosch', 'Whirlpool', 'Electrolux', 'Hotpoint', 'Ramtons',
        'Nintendo', 'Logitech', 'Razer', 'JBL', 'Anker', 'Belkin', 'Sandisk',
        'Canon', 'Nikon', 'Bose', 'Sennheiser', 'Audio-Technica'
    ]

    brands = {}
    for brand_name in sorted(set(brands_list)):
        existing = Brand.query.filter_by(name=brand_name).first()
        if not existing:
            brand = Brand(name=brand_name)
            db.session.add(brand)
            db.session.flush()
            brands[brand_name] = brand
            print(f"  + {brand_name}")
        else:
            brands[brand_name] = existing

    print(f"  Total brands: {len(brands)}")
    return brands


def seed_delivery_zones():
    """Seed delivery zones for Kenya."""
    print("\n--- Seeding Delivery Zones ---")

    existing = DeliveryZone.query.first()
    if existing:
        print("  Delivery zones already exist")
        return

    zones = [
        {'name': 'Nairobi Metro', 'counties': ['Nairobi'], 'delivery_fee': 200, 'estimated_days': 1},
        {'name': 'Central Region', 'counties': ['Kiambu', 'Murang\'a', 'Nyeri', 'Kirinyaga', 'Nyandarua'], 'delivery_fee': 300, 'estimated_days': 2},
        {'name': 'Coast Region', 'counties': ['Mombasa', 'Kilifi', 'Kwale', 'Lamu', 'Taita Taveta'], 'delivery_fee': 500, 'estimated_days': 3},
        {'name': 'Western Region', 'counties': ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'], 'delivery_fee': 450, 'estimated_days': 3},
        {'name': 'Nyanza Region', 'counties': ['Kisumu', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'], 'delivery_fee': 450, 'estimated_days': 3},
        {'name': 'Rift Valley', 'counties': ['Nakuru', 'Narok', 'Kajiado', 'Uasin Gishu', 'Trans Nzoia', 'Kericho'], 'delivery_fee': 400, 'estimated_days': 2},
        {'name': 'Eastern Region', 'counties': ['Machakos', 'Makueni', 'Kitui', 'Embu', 'Meru'], 'delivery_fee': 400, 'estimated_days': 2},
        {'name': 'North Eastern', 'counties': ['Garissa', 'Wajir', 'Mandera', 'Marsabit'], 'delivery_fee': 700, 'estimated_days': 5},
    ]

    for zone_data in zones:
        zone = DeliveryZone(**zone_data, is_active=True)
        db.session.add(zone)
        print(f"  + {zone_data['name']} (KES {zone_data['delivery_fee']})")


def seed_sample_products(suppliers, categories, brands):
    """Create sample products for testing."""
    print("\n--- Seeding Sample Products ---")

    # Get supplier profiles
    supplier_profiles = []
    for supplier in suppliers:
        profile = SupplierProfile.query.filter_by(user_id=supplier.id).first()
        if profile:
            supplier_profiles.append(profile)

    if not supplier_profiles:
        print("  No supplier profiles found")
        return

    products_data = [
        # Mobile Phones & Tablets (6 products)
        {
            'name': 'Samsung Galaxy S24 Ultra',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Samsung',
            'price': 189999,
            'description': 'The ultimate smartphone with S Pen, 200MP camera, and AI features.',
            'specifications': {'Screen Size': '6.8 inches', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '200MP', 'Battery': '5000mAh'},
            'stock_quantity': 50,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'
        },
        {
            'name': 'iPhone 15 Pro Max',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Apple',
            'price': 229999,
            'description': 'Pro. Beyond. The most advanced iPhone ever with A17 Pro chip.',
            'specifications': {'Screen Size': '6.7 inches', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '48MP', 'Battery': '4422mAh'},
            'stock_quantity': 30,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop'
        },
        {
            'name': 'Tecno Spark 20 Pro+',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Tecno',
            'price': 24999,
            'description': 'Budget-friendly smartphone with great camera and large battery.',
            'specifications': {'Screen Size': '6.78 inches', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '108MP', 'Battery': '5000mAh'},
            'stock_quantity': 75,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'
        },
        {
            'name': 'Xiaomi Redmi Note 13 Pro',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Xiaomi',
            'price': 35999,
            'description': 'Mid-range powerhouse with 200MP camera and fast charging.',
            'specifications': {'Screen Size': '6.67 inches', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '200MP', 'Battery': '5100mAh'},
            'stock_quantity': 60,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'
        },
        {
            'name': 'Samsung Galaxy Tab S9',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Samsung',
            'price': 89999,
            'description': 'Premium Android tablet with S Pen and stunning AMOLED display.',
            'specifications': {'Screen Size': '11 inches', 'RAM': '8GB', 'Storage': '128GB', 'Display': 'AMOLED', 'Battery': '8400mAh'},
            'stock_quantity': 25,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'
        },
        {
            'name': 'iPad Air 5th Gen',
            'category': 'Mobile Phones & Tablets',
            'brand': 'Apple',
            'price': 109999,
            'description': 'Powerful tablet with M1 chip for work and creativity.',
            'specifications': {'Screen Size': '10.9 inches', 'Chip': 'M1', 'Storage': '256GB', 'Display': 'Liquid Retina'},
            'stock_quantity': 20,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=400&fit=crop'
        },
        # Laptops & Computers (6 products)
        {
            'name': 'HP Pavilion 15 Laptop',
            'category': 'Laptops & Computers',
            'brand': 'HP',
            'price': 85999,
            'description': 'Powerful laptop for work and play with Intel Core i7 processor.',
            'specifications': {'Processor': 'Intel Core i7', 'RAM': '16GB', 'Storage': '512GB SSD', 'Screen': '15.6 inches'},
            'stock_quantity': 25,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'
        },
        {
            'name': 'MacBook Air M2',
            'category': 'Laptops & Computers',
            'brand': 'Apple',
            'price': 159999,
            'description': 'Supercharged by M2 chip. Ultra-thin and lightweight design.',
            'specifications': {'Chip': 'Apple M2', 'RAM': '8GB', 'Storage': '256GB SSD', 'Screen': '13.6 inches'},
            'stock_quantity': 20,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
        },
        {
            'name': 'Dell Inspiron 14',
            'category': 'Laptops & Computers',
            'brand': 'Dell',
            'price': 65999,
            'description': 'Versatile laptop for everyday computing with sleek design.',
            'specifications': {'Processor': 'Intel Core i5', 'RAM': '8GB', 'Storage': '256GB SSD', 'Screen': '14 inches'},
            'stock_quantity': 35,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=400&fit=crop'
        },
        {
            'name': 'Lenovo ThinkPad X1 Carbon',
            'category': 'Laptops & Computers',
            'brand': 'Lenovo',
            'price': 189999,
            'description': 'Business ultrabook with legendary ThinkPad reliability.',
            'specifications': {'Processor': 'Intel Core i7', 'RAM': '16GB', 'Storage': '512GB SSD', 'Screen': '14 inches'},
            'stock_quantity': 15,
            'warranty_months': 36,
            'image_url': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop'
        },
        {
            'name': 'ASUS ROG Strix G15',
            'category': 'Laptops & Computers',
            'brand': 'Asus',
            'price': 145999,
            'description': 'Gaming laptop with RTX graphics and high refresh rate display.',
            'specifications': {'Processor': 'AMD Ryzen 7', 'RAM': '16GB', 'GPU': 'RTX 4060', 'Screen': '15.6 inches 144Hz'},
            'stock_quantity': 18,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop'
        },
        {
            'name': 'Acer Aspire 5',
            'category': 'Laptops & Computers',
            'brand': 'Acer',
            'price': 55999,
            'description': 'Affordable laptop perfect for students and home users.',
            'specifications': {'Processor': 'Intel Core i5', 'RAM': '8GB', 'Storage': '512GB SSD', 'Screen': '15.6 inches'},
            'stock_quantity': 40,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop'
        },
        # TVs & Home Entertainment (5 products)
        {
            'name': 'Samsung 55" Crystal UHD TV',
            'category': 'TVs & Home Entertainment',
            'brand': 'Samsung',
            'price': 65999,
            'description': 'Smart TV with Crystal Processor 4K and HDR support.',
            'specifications': {'Screen Size': '55 inches', 'Resolution': '4K UHD', 'Smart TV': 'Yes', 'Display': 'Crystal UHD'},
            'stock_quantity': 15,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop'
        },
        {
            'name': 'LG 65" OLED TV',
            'category': 'TVs & Home Entertainment',
            'brand': 'LG',
            'price': 189999,
            'description': 'Stunning OLED display with perfect blacks and infinite contrast.',
            'specifications': {'Screen Size': '65 inches', 'Resolution': '4K', 'Display': 'OLED', 'Smart TV': 'webOS'},
            'stock_quantity': 10,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400&h=400&fit=crop'
        },
        {
            'name': 'Sony Bravia 50" 4K TV',
            'category': 'TVs & Home Entertainment',
            'brand': 'Sony',
            'price': 75999,
            'description': 'Premium picture quality with X1 processor and Triluminos display.',
            'specifications': {'Screen Size': '50 inches', 'Resolution': '4K HDR', 'Processor': 'X1', 'Smart TV': 'Google TV'},
            'stock_quantity': 12,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&fit=crop'
        },
        {
            'name': 'TCL 43" Smart TV',
            'category': 'TVs & Home Entertainment',
            'brand': 'TCL',
            'price': 32999,
            'description': 'Budget-friendly smart TV with Full HD and built-in streaming.',
            'specifications': {'Screen Size': '43 inches', 'Resolution': 'Full HD', 'Smart TV': 'Android TV'},
            'stock_quantity': 30,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=400&h=400&fit=crop'
        },
        {
            'name': 'Hisense 58" 4K Smart TV',
            'category': 'TVs & Home Entertainment',
            'brand': 'Hisense',
            'price': 54999,
            'description': 'Large screen entertainment with Dolby Vision and game mode.',
            'specifications': {'Screen Size': '58 inches', 'Resolution': '4K UHD', 'Smart TV': 'VIDAA', 'HDR': 'Dolby Vision'},
            'stock_quantity': 20,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&h=400&fit=crop'
        },
        # Kitchen Appliances (5 products)
        {
            'name': 'Samsung French Door Refrigerator',
            'category': 'Kitchen Appliances',
            'brand': 'Samsung',
            'price': 185999,
            'description': 'Spacious refrigerator with Family Hub smart screen.',
            'specifications': {'Capacity': '580L', 'Type': 'French Door', 'Energy Rating': 'A++', 'Features': 'Ice Maker'},
            'stock_quantity': 8,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop'
        },
        {
            'name': 'LG Washing Machine 8kg',
            'category': 'Kitchen Appliances',
            'brand': 'LG',
            'price': 45999,
            'description': 'Front load washer with AI Direct Drive technology.',
            'specifications': {'Capacity': '8kg', 'Type': 'Front Load', 'Spin Speed': '1400 RPM', 'Energy': 'A+++'},
            'stock_quantity': 15,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop'
        },
        {
            'name': 'Bosch Microwave Oven',
            'category': 'Kitchen Appliances',
            'brand': 'Bosch',
            'price': 18999,
            'description': 'Built-in microwave with grill and convection cooking.',
            'specifications': {'Capacity': '25L', 'Power': '900W', 'Features': 'Grill, Convection'},
            'stock_quantity': 25,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=400&fit=crop'
        },
        {
            'name': 'Philips Air Fryer XXL',
            'category': 'Kitchen Appliances',
            'brand': 'Philips',
            'price': 24999,
            'description': 'Large capacity air fryer for healthier cooking.',
            'specifications': {'Capacity': '7.3L', 'Power': '2225W', 'Features': 'Digital Display, Rapid Air'},
            'stock_quantity': 35,
            'warranty_months': 24,
            'image_url': '/src/assets/Phiillips Air Fryer.webp'
        },
        {
            'name': 'Ramtons Blender 1.5L',
            'category': 'Kitchen Appliances',
            'brand': 'Ramtons',
            'price': 4999,
            'description': 'Powerful blender for smoothies and food processing.',
            'specifications': {'Capacity': '1.5L', 'Power': '500W', 'Material': 'Glass Jar'},
            'stock_quantity': 50,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop'
        },
        # Gaming (5 products)
        {
            'name': 'Sony PlayStation 5',
            'category': 'Gaming',
            'brand': 'Sony',
            'price': 79999,
            'description': 'Next-gen gaming console with lightning-fast SSD and ray tracing.',
            'specifications': {'Storage': '825GB SSD', 'Resolution': '4K @ 120Hz', 'Controller': 'DualSense'},
            'stock_quantity': 20,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop'
        },
        {
            'name': 'Xbox Series X',
            'category': 'Gaming',
            'brand': 'Microsoft',
            'price': 74999,
            'description': 'Most powerful Xbox ever with 12 teraflops of processing power.',
            'specifications': {'Storage': '1TB SSD', 'Resolution': '4K @ 120Hz', 'Features': 'Quick Resume'},
            'stock_quantity': 15,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=400&fit=crop'
        },
        {
            'name': 'Nintendo Switch OLED',
            'category': 'Gaming',
            'brand': 'Nintendo',
            'price': 44999,
            'description': 'Hybrid console with vibrant OLED screen for gaming on the go.',
            'specifications': {'Screen': '7-inch OLED', 'Storage': '64GB', 'Mode': 'Handheld/TV/Tabletop'},
            'stock_quantity': 25,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop'
        },
        {
            'name': 'Logitech G Pro X Gaming Headset',
            'category': 'Gaming',
            'brand': 'Logitech',
            'price': 15999,
            'description': 'Professional gaming headset with Blue VO!CE microphone.',
            'specifications': {'Type': 'Over-ear', 'Connectivity': 'Wired', 'Features': 'Surround Sound, Blue VO!CE'},
            'stock_quantity': 40,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop'
        },
        {
            'name': 'Razer DeathAdder V3 Mouse',
            'category': 'Gaming',
            'brand': 'Razer',
            'price': 8999,
            'description': 'Ergonomic gaming mouse with Focus Pro optical sensor.',
            'specifications': {'DPI': '30000', 'Buttons': '6', 'Connectivity': 'Wired', 'Weight': '59g'},
            'stock_quantity': 60,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop'
        },
        # Audio & Headphones (5 products)
        {
            'name': 'JBL Flip 6 Bluetooth Speaker',
            'category': 'Audio & Headphones',
            'brand': 'JBL',
            'price': 12999,
            'description': 'Portable waterproof speaker with powerful JBL Original Pro Sound.',
            'specifications': {'Type': 'Portable Speaker', 'Connectivity': 'Bluetooth 5.1', 'Battery': '12 hours', 'Waterproof': 'IP67'},
            'stock_quantity': 100,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'
        },
        {
            'name': 'Sony WH-1000XM5 Headphones',
            'category': 'Audio & Headphones',
            'brand': 'Sony',
            'price': 45999,
            'description': 'Industry-leading noise cancellation with exceptional sound quality.',
            'specifications': {'Type': 'Over-ear', 'ANC': 'Yes', 'Battery': '30 hours', 'Connectivity': 'Bluetooth 5.2'},
            'stock_quantity': 30,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop'
        },
        {
            'name': 'Apple AirPods Pro 2',
            'category': 'Audio & Headphones',
            'brand': 'Apple',
            'price': 35999,
            'description': 'Active noise cancellation with spatial audio and transparency mode.',
            'specifications': {'Type': 'In-ear TWS', 'ANC': 'Yes', 'Battery': '6 hours', 'Features': 'Spatial Audio'},
            'stock_quantity': 45,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop'
        },
        {
            'name': 'Bose SoundLink Revolve+',
            'category': 'Audio & Headphones',
            'brand': 'Bose',
            'price': 32999,
            'description': '360-degree portable speaker with deep, immersive sound.',
            'specifications': {'Type': 'Portable Speaker', 'Battery': '17 hours', 'Features': '360° Sound, Voice Assistant'},
            'stock_quantity': 20,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop'
        },
        {
            'name': 'Sennheiser HD 560S Headphones',
            'category': 'Audio & Headphones',
            'brand': 'Sennheiser',
            'price': 22999,
            'description': 'Reference-class open-back headphones for audiophiles.',
            'specifications': {'Type': 'Over-ear Open-back', 'Impedance': '120 Ohm', 'Frequency': '6Hz-38kHz'},
            'stock_quantity': 15,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop'
        },
        # Accessories (5 products)
        {
            'name': 'Anker 65W USB-C Charger',
            'category': 'Accessories',
            'brand': 'Anker',
            'price': 4999,
            'description': 'Fast charging for laptops, tablets, and phones.',
            'specifications': {'Output': '65W USB-C PD', 'Ports': '1 USB-C', 'Weight': '120g'},
            'stock_quantity': 200,
            'warranty_months': 18,
            'image_url': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop'
        },
        {
            'name': 'Samsung 256GB microSD Card',
            'category': 'Accessories',
            'brand': 'Samsung',
            'price': 3999,
            'description': 'High-speed memory card for phones, cameras, and drones.',
            'specifications': {'Capacity': '256GB', 'Speed': 'U3, A2', 'Read Speed': '160MB/s'},
            'stock_quantity': 150,
            'warranty_months': 60,
            'image_url': 'https://images.unsplash.com/photo-1618410320928-25228d811631?w=400&h=400&fit=crop'
        },
        {
            'name': 'Belkin 3-in-1 Wireless Charger',
            'category': 'Accessories',
            'brand': 'Belkin',
            'price': 14999,
            'description': 'Charge iPhone, AirPods, and Apple Watch simultaneously.',
            'specifications': {'Output': '15W', 'Compatibility': 'iPhone, AirPods, Apple Watch'},
            'stock_quantity': 50,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=400&h=400&fit=crop'
        },
        {
            'name': 'Logitech MX Master 3S Mouse',
            'category': 'Accessories',
            'brand': 'Logitech',
            'price': 12999,
            'description': 'Advanced wireless mouse with MagSpeed scrolling.',
            'specifications': {'DPI': '8000', 'Connectivity': 'Bluetooth/USB', 'Battery': '70 days'},
            'stock_quantity': 40,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop'
        },
        {
            'name': 'SanDisk 1TB Portable SSD',
            'category': 'Accessories',
            'brand': 'Sandisk',
            'price': 15999,
            'description': 'Compact external SSD with fast transfer speeds.',
            'specifications': {'Capacity': '1TB', 'Speed': '1050MB/s', 'Interface': 'USB-C'},
            'stock_quantity': 35,
            'warranty_months': 36,
            'image_url': 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop'
        },
        # Cameras & Photography (5 products)
        {
            'name': 'Canon EOS R6 Mark II',
            'category': 'Cameras & Photography',
            'brand': 'Canon',
            'price': 289999,
            'description': 'Full-frame mirrorless camera with advanced autofocus and 6K video.',
            'specifications': {'Sensor': '24.2MP Full Frame', 'Video': '6K 60fps', 'AF Points': '1053'},
            'stock_quantity': 8,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop'
        },
        {
            'name': 'Sony Alpha A7 IV',
            'category': 'Cameras & Photography',
            'brand': 'Sony',
            'price': 329999,
            'description': 'Hybrid full-frame camera for photo and video professionals.',
            'specifications': {'Sensor': '33MP Full Frame', 'Video': '4K 60fps', 'ISO': '100-51200'},
            'stock_quantity': 6,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop'
        },
        {
            'name': 'Nikon Z50 Mirrorless Camera',
            'category': 'Cameras & Photography',
            'brand': 'Nikon',
            'price': 125999,
            'description': 'Compact mirrorless camera perfect for beginners and travel.',
            'specifications': {'Sensor': '20.9MP APS-C', 'Video': '4K 30fps', 'Screen': '3.2" Tilting'},
            'stock_quantity': 12,
            'warranty_months': 24,
            'image_url': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop'
        },
        {
            'name': 'Canon EF 50mm f/1.8 Lens',
            'category': 'Cameras & Photography',
            'brand': 'Canon',
            'price': 18999,
            'description': 'Versatile prime lens with beautiful bokeh for portraits.',
            'specifications': {'Focal Length': '50mm', 'Aperture': 'f/1.8', 'Mount': 'Canon EF'},
            'stock_quantity': 25,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=400&fit=crop'
        },
        {
            'name': 'DJI Osmo Pocket 3',
            'category': 'Cameras & Photography',
            'brand': 'DJI',
            'price': 75999,
            'description': 'Pocket-sized gimbal camera with 4K video and AI tracking.',
            'specifications': {'Sensor': '1-inch CMOS', 'Video': '4K 120fps', 'Stabilization': '3-axis Gimbal'},
            'stock_quantity': 15,
            'warranty_months': 12,
            'image_url': 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=400&h=400&fit=crop'
        }
    ]

    # Split products between suppliers (first half to supplier1, second half to supplier2)
    half = len(products_data) // 2

    for idx, prod_data in enumerate(products_data):
        # Check if product exists
        existing = Product.query.filter_by(name=prod_data['name']).first()
        if existing:
            print(f"  - {prod_data['name']} (exists)")
            continue

        category = categories.get(prod_data['category'])
        brand = brands.get(prod_data['brand'])

        if not category or not brand:
            print(f"  ! Skipping {prod_data['name']} - missing category or brand")
            continue

        # Assign to supplier based on index (first half to supplier1, second half to supplier2)
        supplier_profile = supplier_profiles[0] if idx < half else supplier_profiles[1] if len(supplier_profiles) > 1 else supplier_profiles[0]

        price = Decimal(str(prod_data['price']))
        product = Product(
            name=prod_data['name'],
            slug=slugify(prod_data['name']),
            short_description=prod_data['description'][:200],
            long_description=prod_data['description'],
            price=price,
            supplier_earnings=price * Decimal('0.75'),
            platform_commission=price * Decimal('0.25'),
            stock_quantity=prod_data['stock_quantity'],
            category_id=category.id,
            brand_id=brand.id,
            supplier_id=supplier_profile.id,
            specifications=prod_data['specifications'],
            warranty_period_months=prod_data['warranty_months'],
            image_url=prod_data.get('image_url'),
            is_active=True
        )
        db.session.add(product)
        print(f"  + {prod_data['name']} - KES {prod_data['price']:,} ({supplier_profile.business_name})")


def seed_delivery_agents():
    """Create sample delivery agents for testing."""
    print("\n--- Seeding Delivery Agents ---")

    agents_data = [
        {
            'email': 'delivery1@test.com',
            'first_name': 'James',
            'last_name': 'Mwangi',
            'phone_number': '254711222333',
            'mpesa_number': '254711222333',  # For automatic weekly payouts
            'id_number': '12345678',
            'vehicle_type': 'motorcycle',
            'vehicle_registration': 'KMCA 123A',
            'assigned_zones': ['Nairobi Metro', 'Central Region']
        },
        {
            'email': 'delivery2@test.com',
            'first_name': 'Grace',
            'last_name': 'Wanjiku',
            'phone_number': '254722333444',
            'mpesa_number': '254722333444',  # For automatic weekly payouts
            'id_number': '87654321',
            'vehicle_type': 'bicycle',
            'vehicle_registration': None,
            'assigned_zones': ['Nairobi Metro']
        }
    ]

    for agent_data in agents_data:
        existing = User.query.filter_by(email=agent_data['email']).first()
        if existing:
            print(f"  Delivery agent already exists: {agent_data['email']}")
            continue

        # Create user
        agent = User(
            email=agent_data['email'],
            role=UserRole.DELIVERY_AGENT,  # Use the enum value
            is_active=True,
            is_verified=True
        )
        agent.set_password('Delivery@123')
        db.session.add(agent)
        db.session.flush()

        # Create profile
        profile = DeliveryAgentProfile(
            user=agent,
            first_name=agent_data['first_name'],
            last_name=agent_data['last_name'],
            phone_number=agent_data['phone_number'],
            mpesa_number=agent_data['mpesa_number'],  # For automatic payouts
            id_number=agent_data['id_number'],
            vehicle_type=agent_data['vehicle_type'],
            vehicle_registration=agent_data['vehicle_registration'],
            assigned_zones=agent_data['assigned_zones'],
            is_available=True
        )
        db.session.add(profile)
        print(f"  Created delivery agent: {agent_data['email']} / Delivery@123")


def main():
    """Run all seed functions."""
    app = create_app()

    with app.app_context():
        print("\n" + "="*50)
        print("  Electronics Shop - Database Seeding")
        print("="*50 + "\n")

        # Seed data
        admin = seed_admin_user()
        suppliers = seed_sample_suppliers()
        seed_sample_customer()
        seed_delivery_agents()
        categories = seed_categories()
        brands = seed_brands()
        seed_delivery_zones()
        seed_sample_products(suppliers, categories, brands)

        # Commit all changes
        db.session.commit()

        # Print summary
        print("\n" + "="*50)
        print("  Seeding Complete!")
        print("="*50)
        print(f"\n  Users: {User.query.count()}")
        print(f"  Categories: {Category.query.count()}")
        print(f"  Brands: {Brand.query.count()}")
        print(f"  Products: {Product.query.count()}")
        print(f"  Delivery Zones: {DeliveryZone.query.count()}")

        print("\n  Test Accounts:")
        print("  -" * 25)
        print("  Admin:      admin@electronics.shop / Admin@123")
        print("  Supplier1:  supplier@test.com / Supplier@123")
        print("  Supplier2:  supplier2@test.com / Supplier@123")
        print("  Customer:   customer@test.com / Customer@123")
        print("  Delivery1:  delivery1@test.com / Delivery@123")
        print("  Delivery2:  delivery2@test.com / Delivery@123")
        print("")


if __name__ == '__main__':
    main()