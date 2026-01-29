import {link} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import {addToCart} from '../store/slices/cartslice';
import {toast} from 'react-toastify';

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
      <div className="card hover:shadow-xl transition-shadow duration-300 p-4">
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
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
            </div>
          )}
          
          {!product.is_in_stock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
          
          {product.is_low_stock && product.is_in_stock && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              Low Stock
            </div>
          )}
          
          {product.condition === 'refurbished' && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
              Refurbished
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.brand?.name}
          </p>
          
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.short_description}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </p>
              <p className="text-xs text-gray-500">
                {product.warranty_period_months} months warranty
              </p>
            </div>
            
            <div className="text-xs text-gray-400">
              {product.view_count} views
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock}
            className="w-full mt-3 btn btn-primary py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.is_in_stock ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </span>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
