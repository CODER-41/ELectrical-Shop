import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, incrementQuantity, decrementQuantity, updateQuantity } from '../store/slices/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { getProductImage } from '../../utils/imageOverrides';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, totalItems, totalPrice } = useSelector((state) => state.cart);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      dispatch(updateQuantity({ productId, quantity }));
    }
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Start adding products to your cart!</p>
          <Link to="/products" className="mt-6 inline-block btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mt-2 text-gray-600">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-center space-x-4">
                {/* Product Image */}
                <Link to={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={getProductImage(item.name, item.image_url, item.category)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.slug}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500">{item.brand}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {formatPrice(item.price)}
                  </p>
                  
                  {/* Stock Warning */}
                  {item.quantity >= item.stock_quantity && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Only {item.stock_quantity} in stock
                    </p>
                  )}
                </div>
                
                {/* Quantity Controls */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => dispatch(decrementQuantity(item.id))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max={item.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="w-16 px-2 py-2 text-center border-x border-gray-300 focus:outline-none"
                    />
                    
                    <button
                      onClick={() => dispatch(incrementQuantity(item.id))}
                      disabled={item.quantity >= item.stock_quantity}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Item Total */}
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Continue Shopping */}
          <Link to="/products" className="inline-block text-primary hover:text-primary-700">
            ← Continue Shopping
          </Link>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-semibold">{formatPrice(totalPrice)}</span>
              </div>
              
              {/* Delivery Note */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <svg className="inline w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Delivery fee calculated at checkout
                </p>
              </div>
              
              {/* Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  + delivery fee
                </p>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="btn btn-primary w-full py-3 text-lg"
              >
                Proceed to Checkout
              </button>
              
              {/* Payment Methods */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">We accept:</p>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    M-Pesa
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    Card
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                    Cash
                  </span>
                </div>
              </div>
              
              {/* Security Note */}
              <div className="flex items-center text-xs text-gray-600">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
