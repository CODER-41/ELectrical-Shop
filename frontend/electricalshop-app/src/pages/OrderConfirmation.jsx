import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrder, clearCurrentOrder } from '../store/slices/ordersSlice';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-toastify';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, isLoading } = useSelector((state) => state.orders);
  const { initiateMpesaPayment, checkPaymentStatus, isProcessing } = usePayment();
  
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [showPaymentRetry, setShowPaymentRetry] = useState(false);
  const [pollingPaymentStatus, setPollingPaymentStatus] = useState(false);
  
  useEffect(() => {
    dispatch(getOrder(orderId));
    
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, orderId]);
  
  // Poll payment status for M-Pesa orders
  useEffect(() => {
    if (!order || order.payment_method !== 'mpesa' || order.payment_status === 'completed') {
      return;
    }
    
    setPollingPaymentStatus(true);
    
    // Poll every 5 seconds for 2 minutes
    const pollInterval = setInterval(async () => {
      const result = await checkPaymentStatus(orderId);
      if (result.success && result.data.payment_status === 'completed') {
        dispatch(getOrder(orderId)); // Refresh order
        toast.success('Payment confirmed!');
        setPollingPaymentStatus(false);
        clearInterval(pollInterval);
      }
    }, 5000);
    
    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setPollingPaymentStatus(false);
      clearInterval(pollInterval);
    }, 120000);
    
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [order, orderId, checkPaymentStatus, dispatch]);
  
  const handleRetryPayment = async () => {
    if (!mpesaNumber) {
      toast.error('Please enter your M-Pesa number');
      return;
    }
    
    const result = await initiateMpesaPayment(orderId, mpesaNumber);
    if (result.success) {
      toast.success('Check your phone for M-Pesa prompt');
      setShowPaymentRetry(false);
      setMpesaNumber('');
      setPollingPaymentStatus(true);
    }
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <Link to="/orders" className="mt-4 inline-block btn btn-primary">
          View My Orders
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
        <p className="mt-2 text-gray-600">Thank you for your order</p>
        <p className="mt-1 text-lg text-gray-900">
          Order #{order.order_number}
        </p>
      </div>
      
      {/* Order Status */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'paid' ? 'bg-green-100 text-green-800' :
            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        
        {order.payment_method === 'mpesa' && order.payment_status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Complete Your Payment</h3>
                {pollingPaymentStatus ? (
                  <div className="flex items-center text-sm text-blue-800 mt-1">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Waiting for payment confirmation...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-blue-800 mt-1">
                      Check your phone for the M-Pesa STK push notification to complete payment.
                    </p>
                    <button
                      onClick={() => setShowPaymentRetry(!showPaymentRetry)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showPaymentRetry ? 'Cancel' : 'Retry Payment'}
                    </button>
                    
                    {showPaymentRetry && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="tel"
                          value={mpesaNumber}
                          onChange={(e) => setMpesaNumber(e.target.value)}
                          placeholder="254XXXXXXXXX"
                          className="input w-full"
                        />
                        <button
                          onClick={handleRetryPayment}
                          disabled={isProcessing}
                          className="btn btn-primary w-full"
                        >
                          {isProcessing ? 'Processing...' : 'Send Payment Request'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {order.payment_status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">Payment Confirmed</span>
            </div>
          </div>
        )}
        
        {order.payment_method === 'cash' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Payment will be collected when your order is delivered.
            </p>
          </div>
        )}
      </div>
      
      {/* Order Details */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-medium text-gray-900 capitalize">{order.payment_method}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Delivery Address</p>
            <div className="text-gray-900">
              <p className="font-medium">{order.delivery_address?.full_name}</p>
              <p className="text-sm">{order.delivery_address?.phone_number}</p>
              <p className="text-sm">{order.delivery_address?.address_line_1}</p>
              {order.delivery_address?.address_line_2 && (
                <p className="text-sm">{order.delivery_address.address_line_2}</p>
              )}
              <p className="text-sm">
                {order.delivery_address?.city}, {order.delivery_address?.county}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Items */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
        
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between pb-4 border-b last:border-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product_name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-600">
                  Warranty: {item.warranty_period_months} months
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-gray-700">
            <span>Delivery Fee ({order.delivery_zone})</span>
            <span>{formatPrice(order.delivery_fee)}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* What's Next */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
              1
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Order Confirmation</h3>
              <p className="text-sm text-gray-600">
                You'll receive an email/SMS confirmation shortly
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
              2
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Quality Check</h3>
              <p className="text-sm text-gray-600">
                Your order will undergo quality verification
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
              3
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Shipping</h3>
              <p className="text-sm text-gray-600">
                Your order will be shipped to your address
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
              4
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Delivery</h3>
              <p className="text-sm text-gray-600">
                Receive your order at your doorstep
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/orders" className="btn btn-primary flex-1 text-center">
          View My Orders
        </Link>
        <Link to="/products" className="btn btn-outline flex-1 text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
