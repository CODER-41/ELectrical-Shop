// Category-specific product image overrides
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

export const getProductImage = (productName, cloudinaryUrl, categoryName = null) => {
  // Check category-specific override
  if (categoryName && CATEGORY_OVERRIDES[categoryName]?.[productName]) {
    const override = CATEGORY_OVERRIDES[categoryName][productName];
    try {
      const fileName = override.replace('/src/assets/', '');
      return new URL(`../assets/${fileName}`, import.meta.url).href;
    } catch {
      return cloudinaryUrl;
    }
  }
  
  // Handle local asset paths
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
