import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const DeliveryOrders = () => {
  const { token } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/delivery/orders');
      setOrders(response.data.data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAgentEarning = (deliveryFee) => {
    // Default percentage is 70% if not specified
    const percentage = 70; // This could come from user profile in future
    return (deliveryFee * percentage) / 100;
  };

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
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'arrived': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/delivery/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleCollectCOD = async (orderId, amount) => {
    try {
      await api.post(`/delivery/orders/${orderId}/collect-cod`, { amount: amount });
      toast.success('COD collection recorded');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record COD');
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await api.post(`/delivery/orders/${orderId}/confirm-delivery`, {
        notes: 'Delivered successfully'
      });
      toast.success('Delivery confirmed');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to confirm delivery');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
        <p className="mt-2 text-gray-600">Manage your assigned delivery orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'paid', 'processing', 'shipped', 'out_for_delivery', 'arrived', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'out_for_delivery' ? 'Out for Delivery' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-2 text-gray-500">You don't have any assigned orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Zone:</span> {order.delivery_zone}
                  </p>
                  <p className="text-sm text-green-600 font-medium mb-2">
                    Your Earning: {formatPrice(calculateAgentEarning(order.delivery_fee))}
                  </p>
                  {order.delivery_address && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Deliver to:</span> {order.delivery_address.full_name}, {order.delivery_address.address_line_1}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Your Earning: {formatPrice(calculateAgentEarning(order.delivery_fee))}
                  </div>
                  {order.payment_method === 'cash' && !order.cod_collected_at && (
                    <span className="text-sm text-orange-600 font-medium">COD: {formatPrice(order.total)}</span>
                  )}
                  {order.cod_collected_at && (
                    <span className="text-sm text-green-600 font-medium">COD Collected</span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                {order.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Delivery
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Delivery
                  </button>
                )}
                {order.status === 'shipped' && (
                  <>
                    <button
                      onClick={() => handleConfirmDelivery(order.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Confirm Delivery
                    </button>
                  </>
                )}
                {order.status === 'delivered' && order.payment_method === 'cash' && !order.cod_collected_at && (
                  <button
                    onClick={() => handleCollectCOD(order.id, order.total)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    Collect COD Payment
                  </button>
                )}
                {order.status === 'delivered' && (order.payment_method !== 'cash' || order.cod_collected_at) && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    {order.payment_method === 'cash' ? 'Delivered & COD Collected' : 'Delivered Successfully'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">{formatPrice(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Delivery Earning</p>
                    <p className="font-semibold text-green-600">{formatPrice(calculateAgentEarning(selectedOrder.delivery_fee))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Delivery Fee</p>
                    <p className="font-semibold text-gray-500">{formatPrice(selectedOrder.delivery_fee)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold">{selectedOrder.payment_method === 'cash' ? 'Cash on Delivery' : selectedOrder.payment_method.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Zone</p>
                    <p className="font-semibold">{selectedOrder.delivery_zone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{selectedOrder.delivery_address.full_name}</p>
                    <p className="text-gray-700">{selectedOrder.delivery_address.phone_number}</p>
                    <p className="text-gray-700 mt-1">
                      {selectedOrder.delivery_address.address_line_1}
                      {selectedOrder.delivery_address.address_line_2 && `, ${selectedOrder.delivery_address.address_line_2}`}
                    </p>
                    <p className="text-gray-700">{selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.county}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, 'shipped');
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Accept Order
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, 'shipped');
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Accept Order
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, 'out_for_delivery');
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Start Delivery
                  </button>
                )}
                {selectedOrder.status === 'out_for_delivery' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, 'arrived');
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Mark as Arrived
                  </button>
                )}
                {selectedOrder.status === 'arrived' && (
                  <button
                    onClick={() => {
                      handleConfirmDelivery(selectedOrder.id);
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Confirm Delivery
                  </button>
                )}
                {selectedOrder.status === 'delivered' && selectedOrder.payment_method === 'cash' && !selectedOrder.cod_collected_at && (
                  <button
                    onClick={() => {
                      handleCollectCOD(selectedOrder.id, selectedOrder.total);
                      setShowOrderModal(false);
                    }}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Collect COD Payment
                  </button>
                )}
                {selectedOrder.status === 'delivered' && (selectedOrder.payment_method !== 'cash' || selectedOrder.cod_collected_at) && (
                  <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
                    {selectedOrder.payment_method === 'cash' ? 'Delivered & COD Collected' : 'Delivered Successfully'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOrders;
