# Product Image Override Implementation

## Overview
Implemented a category-aware image override system that prioritizes local assets over Cloudinary URLs for specific products within their designated categories.

## Implementation

### 1. Created Utility Module
**File:** `/frontend/electricalshop-app/src/utils/imageOverrides.js`

- Category-specific mapping of product names to local asset paths
- Priority: Category-specific Local Assets > Cloudinary URLs
- Handles dynamic import of local assets using Vite's import.meta.url
- Only applies overrides when product is in the specified category

### 2. Product Overrides Configured
```javascript
const CATEGORY_OVERRIDES = {
  'TVs': {
    'Hisense 58" 4K Smart TV': '/src/assets/Hisense smart TV.webp',
  },
  'Kitchen Appliances': {
    'Philips Air Fryer XXL': '/src/assets/Phiillips Air Fryer.webp',
  },
  'Accessories': {
    'Nikon Z50 Mirrorless Camera': '/src/assets/Nikon Z50 mirrorless camerra.jpeg',
  },
};
```

### 3. Updated Components
All product display components now use `getProductImage(productName, cloudinaryUrl, categoryName)`:

1. **ProductCard.jsx** - Product listing cards
2. **ProductDetail.jsx** - Product detail page
3. **Cart.jsx** - Shopping cart
4. **Checkout.jsx** - Checkout page (2 locations: review & summary)
5. **Home.jsx** - Homepage hero carousel
6. **AdminProductManagement.jsx** - Admin product list
7. **Supplier/Cart.jsx** - Supplier cart view

## Usage

### Adding New Category-Specific Overrides
Edit `/frontend/electricalshop-app/src/utils/imageOverrides.js`:

```javascript
const CATEGORY_OVERRIDES = {
  'TVs': {
    'Hisense 58" 4K Smart TV': '/src/assets/Hisense smart TV.webp',
  },
  'Kitchen Appliances': {
    'Philips Air Fryer XXL': '/src/assets/Phiillips Air Fryer.webp',
  },
  'Accessories': {
    'Nikon Z50 Mirrorless Camera': '/src/assets/Nikon Z50 mirrorless camerra.jpeg',
  },
  'New Category': {  // Add new category
    'Product Name': '/src/assets/image.jpg',
  },
};
```

### How It Works
1. Component calls `getProductImage(product.name, product.image_url, product.category?.name)`
2. Function checks if category exists in CATEGORY_OVERRIDES
3. If category found, checks if product name exists in that category
4. If match found → returns local asset path
5. If no match → returns original Cloudinary URL
6. Handles fallback for any import errors

## Benefits
- ✅ Category-specific override management
- ✅ Prevents cross-category image conflicts
- ✅ No database changes required
- ✅ Easy to add/remove overrides
- ✅ Maintains backward compatibility
- ✅ Works across all product displays
- ✅ Minimal code changes per component

## Files Modified
- `src/utils/imageOverrides.js` (new)
- `src/components/ProductCard.jsx`
- `src/pages/ProductDetail.jsx`
- `src/pages/Cart.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/Home.jsx`
- `src/pages/Admin/AdminProductManagement.jsx`
- `src/pages/Supplier/Cart.jsx`
