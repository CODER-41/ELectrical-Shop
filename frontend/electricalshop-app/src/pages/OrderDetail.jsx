import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrder, clearCurrentOrder, reset, cancelOrder } from '../store/slices/ordersSlice';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder: order, isLoading, isError, message } = useSelector((state) => state.orders);
  const { initiateMpesaPayment, isProcessing } = usePayment();
  
  const [showPaymentRetry, setShowPaymentRetry] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  useEffect(() => {
    dispatch(getOrder(orderId));
    
    return () => {
      dispatch(clearCurrentOrder());
      dispatch(reset());
    };
  }, [dispatch, orderId]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);
  
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
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      quality_approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      returned: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
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
      
      // Refresh order after 5 seconds
      setTimeout(() => {
        dispatch(getOrder(orderId));
      }, 5000);
    }
  };
  
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    
    try {
      await dispatch(cancelOrder({ orderId, reason: cancelReason })).unwrap();
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      dispatch(getOrder(orderId)); // Refresh order
    } catch (error) {
      toast.error(error || 'Failed to cancel order');
    }
  };
  
  const canCancelOrder = () => {
    return ['pending', 'paid'].includes(order?.status);
  };
  
  // Order status timeline
  const getStatusTimeline = () => {
    const allStatuses = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'paid', label: 'Payment Confirmed' },
      { key: 'processing', label: 'Processing' },
      { key: 'quality_approved', label: 'Quality Approved' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' },
    ];
    
    const currentIndex = allStatuses.findIndex(s => s.key === order?.status);
    
    return allStatuses.map((status, index) => ({
      ...status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          Back to Orders
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/orders')} className="text-primary hover:text-primary-700 mb-4 inline-flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
            <p className="mt-1 text-gray-600">Placed on {formatDate(order.created_at)}</p>
          </div>
          
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
          </span>
        </div>
      </div>
      
      {/* Payment Status Alert */}
      {order.payment_method === 'mpesa' && order.payment_status === 'pending' && (
        <div className="card mb-6 bg-yellow-50 border border-yellow-200">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Payment Pending</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Complete your M-Pesa payment to process this order.
              </p>
              
              <button
                onClick={() => setShowPaymentRetry(!showPaymentRetry)}
                className="mt-3 text-sm font-medium text-yellow-900 hover:text-yellow-700"
              >
                {showPaymentRetry ? 'Cancel' : 'Pay Now'}
              </button>
              
              {showPaymentRetry && (
                <div className="mt-4 space-y-3">
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
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          {!['cancelled', 'returned'].includes(order.status) && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
              
              <div className="relative">
                {getStatusTimeline().map((status, index) => (
                  <div key={status.key} className="flex items-start mb-8 last:mb-0">
                    {/* Timeline Line */}
                    {index < getStatusTimeline().length - 1 && (
                      <div className={`absolute left-4 top-10 w-0.5 h-full ${status.completed ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    )}
                    
                    {/* Status Icon */}
                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      status.completed ? 'bg-primary' : 'bg-gray-200'
                    }`}>
                      {status.completed ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                    
                    {/* Status Info */}
                    <div className="ml-4">
                      <h3 className={`font-semibold ${status.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {status.label}
                      </h3>
                      {status.current && (
                        <p className="text-sm text-primary mt-1">Current Status</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Order Items */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
            
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Price: {formatPrice(item.product_price)}</p>
                    <p className="text-sm text-gray-600">
                      Warranty: {item.warranty_period_months} months
                      {item.warranty_expires_at && (
                        <span className="ml-1">(expires {new Date(item.warranty_expires_at).toLocaleDateString()})</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Delivery Address */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
            
            <div className="text-gray-700">
              <p className="font-semibold">{order.delivery_address?.full_name}</p>
              <p className="text-sm mt-1">{order.delivery_address?.phone_number}</p>
              <p className="text-sm mt-2">{order.delivery_address?.address_line_1}</p>
              {order.delivery_address?.address_line_2 && (
                <p className="text-sm">{order.delivery_address.address_line_2}</p>
              )}
              <p className="text-sm">
                {order.delivery_address?.city}, {order.delivery_address?.county}
              </p>
              {order.delivery_address?.postal_code && (
                <p className="text-sm">{order.delivery_address.postal_code}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Order Summary */}
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-gray-700">
                <span>Delivery ({order.delivery_zone})</span>
                <span className="font-semibold">{formatPrice(order.delivery_fee)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{order.payment_method}</span>
              </div>
              
              <div>
                <span className="text-gray-600">Payment Status:</span>
                <span className={`ml-2 font-medium capitalize ${
                  order.payment_status === 'completed' ? 'text-green-600' :
                  order.payment_status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              
              {order.payment_reference && (
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <span className="ml-2 font-medium text-gray-900">{order.payment_reference}</span>
                </div>
              )}
              
              {order.paid_at && (
                <div>
                  <span className="text-gray-600">Paid At:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(order.paid_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              {canCancelOrder() && (
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel Order
                </button>
              )}
              
              {order.status === 'delivered' && order.items?.length > 0 && (
                <Link 
                  to={`/orders/${order.id}/items/${order.items[0].id}/return`}
                  className="btn btn-primary w-full text-center"
                >
                  Request Return/Refund
                </Link>
              )}
              
              <Link to="/orders" className="btn btn-outline w-full text-center">
                View All Orders
              </Link>
              
              {order.status === 'delivered' && (
                <button className="btn btn-outline w-full">
                  Leave a Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="form-label">Reason for cancellation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Please tell us why you're cancelling..."
                className="input"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="btn btn-outline flex-1"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isLoading}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
