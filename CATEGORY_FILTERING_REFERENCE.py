"""
QUICK REFERENCE: Category Filtering Implementation
===================================================

BACKEND ENDPOINT
----------------
Route: GET /api/products
File: backend/app/routes/products.py

Query Parameters:
  - category: string (category slug, case-insensitive)
  - page: int (default: 1)
  - per_page: int (default: 20, max: 100)
  - brand: string
  - search: string
  - min_price: float
  - max_price: float
  - condition: 'new' | 'refurbished'
  - in_stock: boolean
  - sort_by: 'price_asc' | 'price_desc' | 'newest' | 'popular'

Category Filtering Logic:
  1. If category = 'accessories' → Return ALL products
  2. If category = valid slug → Return products WHERE category_id matches
  3. If category = invalid → Return empty array
  4. If no category → Return all products

Example Requests:
  GET /api/products?category=laptops-computers
  GET /api/products?category=gaming&sort_by=price_asc
  GET /api/products?category=accessories&page=2


FRONTEND API HELPER
-------------------
File: frontend/electricalshop-app/src/utils/api.js

Import:
  import { productAPI } from '../utils/api';

Methods:
  productAPI.getProducts(params)
  productAPI.getProductsByCategory(categorySlug, params)
  productAPI.getProduct(id)
  productAPI.getProductBySlug(slug)
  productAPI.getCategories()
  productAPI.getBrands()

Usage Examples:
  // Get laptops
  const { data } = await productAPI.getProductsByCategory('laptops-computers');
  
  // Get gaming products with filters
  const { data } = await productAPI.getProductsByCategory('gaming', {
    max_price: 50000,
    sort_by: 'price_asc',
    page: 1
  });
  
  // Get all products
  const { data } = await productAPI.getProducts({ page: 1 });


CATEGORY SLUGS
--------------
Database Name                → Slug
Mobile Phones & Tablets      → mobile-phones-tablets
Laptops & Computers          → laptops-computers
TVs & Home Entertainment     → tvs-home-entertainment
Kitchen Appliances           → kitchen-appliances
Gaming                       → gaming
Accessories                  → accessories (special: shows ALL)


REDUX INTEGRATION
-----------------
File: frontend/electricalshop-app/src/store/slices/productsSlice.js

Actions:
  getProducts(params)          - Fetch products with filters
  setFilters(filters)          - Update filter state
  clearFilters()               - Clear all filters
  getCategories()              - Fetch all categories
  getBrands()                  - Fetch all brands

State:
  products: []                 - Array of products
  pagination: {}               - Pagination info
  filters: {}                  - Current filters
  categories: []               - All categories
  brands: []                   - All brands
  isLoading: boolean
  isError: boolean
  message: string

Usage in Component:
  import { useDispatch, useSelector } from 'react-redux';
  import { getProducts, setFilters } from '../store/slices/productsSlice';
  
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector(state => state.products);
  
  // Set category filter
  dispatch(setFilters({ category: 'laptops-computers' }));
  
  // Fetch products
  dispatch(getProducts({ category: 'laptops-computers', page: 1 }));


RESPONSE FORMAT
---------------
Success Response:
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "slug": "product-slug",
        "price": 50000.00,
        "stock_quantity": 10,
        "is_in_stock": true,
        "image_url": "https://...",
        "category": {
          "id": "uuid",
          "name": "Laptops & Computers",
          "slug": "laptops-computers"
        },
        "brand": {
          "id": "uuid",
          "name": "HP"
        },
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_items": 95,
      "has_next": true,
      "has_prev": false
    }
  }
}

Error Response:
{
  "success": false,
  "message": "Error message"
}


TESTING CHECKLIST
-----------------
□ Click "Mobile Phones" → Shows only mobile phones
□ Click "Laptops" → Shows only laptops
□ Click "TVs" → Shows only TVs
□ Click "Kitchen" → Shows only kitchen appliances
□ Click "Gaming" → Shows only gaming products
□ Click "Accessories" → Shows ALL products
□ Invalid category → Shows "No products found"
□ Pagination works correctly
□ Sorting works correctly
□ Search works with category filter
□ Price filters work with category filter


TROUBLESHOOTING
---------------
Issue: No products showing
Fix: Check if products exist in that category in database

Issue: Wrong products showing
Fix: Verify category slug matches database (case-insensitive)

Issue: Accessories shows nothing
Fix: Should show ALL products - check backend logic

Issue: API returns 500 error
Fix: Check backend logs, verify database connection

Issue: Frontend not filtering
Fix: Check Redux state, verify URL params are being read


DATABASE QUERIES
----------------
-- Check categories in database
SELECT id, name, slug, is_active FROM categories;

-- Check products by category
SELECT p.name, c.name as category, c.slug 
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE c.slug = 'laptops-computers';

-- Count products per category
SELECT c.name, c.slug, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name, c.slug;
"""
