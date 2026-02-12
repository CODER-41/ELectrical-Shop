// Category-specific product image overrides
const CATEGORY_OVERRIDES = {
  'TVs': {
    'Hisense 58" 4K Smart TV': '/assets/hisense.jpg',
  },
  'Kitchen Appliances': {
    'Philips Air Fryer XXL': '/src/assets/Phiillips Air Fryer.webp',
  },
  'Accessories': {
    'Nikon Z50 Mirrorless Camera': '/assets/nikon-z50-mirrorless-camera.jpg',
  },
};

export const getProductImage = (productName, cloudinaryUrl, categoryName = null) => {
  // Check category-specific override
  if (categoryName && CATEGORY_OVERRIDES[categoryName]?.[productName]) {
    return CATEGORY_OVERRIDES[categoryName][productName];
  }
  
  // Handle local asset paths from public folder
  if (cloudinaryUrl?.startsWith('/assets/')) {
    return cloudinaryUrl;
  }
  
  // Handle old /src/assets/ paths (fallback)
  if (cloudinaryUrl?.startsWith('/src/assets/')) {
    const fileName = cloudinaryUrl.replace('/src/assets/', '');
    try {
      return new URL(`../assets/${fileName}`, import.meta.url).href;
    } catch {
      return cloudinaryUrl;
    }
  }
  
  return cloudinaryUrl;
};
