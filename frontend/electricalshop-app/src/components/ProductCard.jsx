import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import {toast} from 'react-toastify';

// Helper to get image URL (handles both local and remote images)
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // If it's a local asset path, import it dynamically
  if (imageUrl.startsWith('/src/assets/')) {
    const fileName = imageUrl.replace('/src/assets/', '');
    try {
      return new URL(`../assets/${fileName}`, import.meta.url).href;
    } catch {
      return imageUrl; // Fallback to original URL
    }
  }
  return imageUrl; // Return remote URL as-is
};

const ProductCard = ({product}) => {
    const dispatch = useDispatch();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
   const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(product));
    toast.success('Added to cart!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  return (
    <Link to={`/products/${product.slug}`} className="group">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image_url ? (
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <div class="text-center">
                      <svg class="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p class="text-xs">No Image</p>
                    </div>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs">No Image</p>
              </div>
            </div>
          )}
          
          {!product.is_in_stock && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Out of Stock
            </div>
          )}
          
          {product.is_low_stock && product.is_in_stock && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Low Stock
            </div>
          )}
          
          {product.condition === 'refurbished' && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Refurbished
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-orange-600 uppercase tracking-wide font-semibold bg-orange-50 px-2 py-1 rounded-full">
                {product.brand?.name || 'Electronics'}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {product.view_count}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
              {product.name}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  {formatPrice(product.price)}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {product.warranty_period_months} months warranty
                </div>
              </div>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!product.is_in_stock}
              className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all duration-200 transform ${
                product.is_in_stock
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white hover:from-orange-700 hover:to-yellow-700 hover:scale-105 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.is_in_stock ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Out of Stock
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-orange-600 to-yellow-600"></div>
      </div>
    </Link>
  );
};

export default ProductCard;
