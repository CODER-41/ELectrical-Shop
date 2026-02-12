import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductBySlug, clearCurrentProduct, reset } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { getProductImage } from '../utils/imageOverrides';

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct: product, isLoading, isError, message } = useSelector(
    (state) => state.products
  );
  
  useEffect(() => {
    dispatch(getProductBySlug(slug));
    
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, slug]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);
  
  const handleAddToCart = () => {
    dispatch(addToCart(product));
    toast.success('Added to cart!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/products" className="mt-4 inline-block btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link to="/" className="text-gray-500 hover:text-primary">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link to="/products" className="text-gray-500 hover:text-primary">Products</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link to={`/products?category=${product.category?.slug}`} className="text-gray-500 hover:text-primary">{product.category?.name}</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{product.name}</li>
        </ol>
      </nav>
      
      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div>
          <div className="aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={getProductImage(product.name, product.image_url, product.category?.name)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400">
                <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand & Category */}
          <div>
            <p className="text-sm text-gray-500">
              <Link to={`/products?brand=${product.brand?.name}`} className="hover:text-primary">
                {product.brand?.name}
              </Link>
              {' • '}
              <Link to={`/products?category=${product.category?.slug}`} className="hover:text-primary">
                {product.category?.name}
              </Link>
            </p>
          </div>
          
          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          
          {/* Short Description */}
          <p className="text-lg text-gray-600">{product.short_description}</p>
          
          {/* Price */}
          <div>
            <p className="text-4xl font-bold text-primary">{formatPrice(product.price)}</p>
          </div>
          
          {/* Status Badges */}
          <div className="flex items-center space-x-3">
            {product.is_in_stock ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                Out of Stock
              </span>
            )}
            
            {product.condition === 'refurbished' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                Refurbished
              </span>
            )}
            
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
              {product.warranty_period_months} Months Warranty
            </span>
          </div>
          
          {/* Add to Cart Button */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.is_in_stock}
              className="btn btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="btn btn-outline py-3 px-6"
            >
              View Cart
            </button>
          </div>
          
          {/* Key Features */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{product.warranty_period_months} months manufacturer warranty</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Quality checked before delivery</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">7-day return policy</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Product Details Tabs */}
      <div className="border-t pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-sm text-gray-700 whitespace-pre-line">
              {product.long_description}
            </div>
          </div>
          
          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <dl className="space-y-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <dt className="font-medium text-gray-700">{key}</dt>
                      <dd className="text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
