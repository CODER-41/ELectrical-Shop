import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrders, reset } from '../store/slices/ordersSlice';
import { toast } from 'react-toastify';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, isError, message } = useSelector((state) => state.orders);
  
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    dispatch(getOrders());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      quality_approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      returned: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      completed: 'text-green-600 bg-green-50',
      failed: 'text-red-600 bg-red-50',
      refunded: 'text-blue-600 bg-blue-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };
  
  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      paid: '✅',
      processing: '🔄',
      quality_approved: '✔️',
      shipped: '🚚',
      delivered: '📦',
      cancelled: '❌',
      returned: '↩️',
    };
    return icons[status] || '📋';
  };
  
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container-responsive py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
                <p className="text-base sm:text-lg text-gray-600">Track and manage your orders</p>
              </div>
              <div className="hidden sm:block">
                <div className="bg-primary-50 p-3 sm:p-4 rounded-xl">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Order Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-xl text-white">
                <div className="text-xl sm:text-2xl font-bold">{orders.length}</div>
                <div className="text-blue-100 text-xs sm:text-sm">Total Orders</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-xl text-white">
                <div className="text-xl sm:text-2xl font-bold">{orders.filter(o => o.status === 'delivered').length}</div>
                <div className="text-green-100 text-xs sm:text-sm">Delivered</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 sm:p-4 rounded-xl text-white">
                <div className="text-xl sm:text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
                <div className="text-yellow-100 text-xs sm:text-sm">Pending</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 sm:p-4 rounded-xl text-white">
                <div className="text-xl sm:text-2xl font-bold">{orders.filter(o => o.status === 'shipped').length}</div>
                <div className="text-purple-100 text-xs sm:text-sm">Shipped</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filter Orders</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {[
              { key: 'all', label: 'All', shortLabel: 'All', count: orders.length },
              { key: 'pending', label: 'Pending', shortLabel: 'Pending', count: orders.filter(o => o.status === 'pending').length },
              { key: 'paid', label: 'Paid', shortLabel: 'Paid', count: orders.filter(o => o.status === 'paid').length },
              { key: 'processing', label: 'Processing', shortLabel: 'Process', count: orders.filter(o => o.status === 'processing').length },
              { key: 'shipped', label: 'Shipped', shortLabel: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
              { key: 'delivered', label: 'Delivered', shortLabel: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 ${
                  statusFilter === filter.key 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.shortLabel}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  statusFilter === filter.key 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-100">
            <div className="bg-gray-100 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
              {statusFilter === 'all' 
                ? 'Start shopping to see your orders here' 
                : 'No orders match this filter'}
            </p>
            {statusFilter === 'all' && (
              <Link to="/products" className="btn btn-primary btn-lg">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4 sm:space-y-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="bg-primary-50 p-2 sm:p-3 rounded-xl">
                          <span className="text-xl sm:text-2xl">{getStatusIcon(order.status)}</span>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                            {order.order_number}
                          </h3>
                          <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Mobile Price */}
                      <div className="text-right sm:hidden">
                        <div className="text-lg font-bold text-primary">{formatPrice(order.total)}</div>
                      </div>
                    </div>
                    
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Order Date</div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(order.created_at)}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Payment Status</div>
                        <div className={`font-semibold capitalize px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Payment Method</div>
                        <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base">{order.payment_method}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Delivery Zone</div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{order.delivery_zone}</div>
                      </div>
                    </div>
                    
                    {/* Delivery Address */}
                    {order.delivery_address && (
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                        <div className="text-xs sm:text-sm text-blue-600 mb-1 font-medium">Delivery Address</div>
                        <div className="text-blue-900 font-semibold text-sm sm:text-base">
                          {order.delivery_address.full_name} • {order.delivery_address.phone_number}
                        </div>
                        <div className="text-blue-800 text-xs sm:text-sm">
                          {order.delivery_address.address_line_1}, {order.delivery_address.city}, {order.delivery_address.county}
                        </div>
                      </div>
                    )}
                    
                    {/* Desktop Price & Action */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between pt-4 border-t border-gray-200">
                      <div className="text-left">
                        <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                        <div className="text-2xl lg:text-3xl font-bold text-primary mb-2">{formatPrice(order.total)}</div>
                        <div className="text-sm text-gray-500">
                          Subtotal: {formatPrice(order.subtotal)} + Delivery: {formatPrice(order.delivery_fee)}
                        </div>
                      </div>
                      
                      <Link 
                        to={`/orders/${order.id}`}
                        className="btn btn-primary group-hover:shadow-lg transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                    
                    {/* Mobile Action Button */}
                    <div className="sm:hidden">
                      <Link 
                        to={`/orders/${order.id}`}
                        className="btn btn-primary w-full"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Order Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
