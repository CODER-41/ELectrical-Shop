import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token && orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [token, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['paid', 'shipped', 'out_for_delivery', 'arrived', 'delivered'];
    return steps.indexOf(status) + 1;
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const currentStep = getStatusStep(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-2">Track Order #{order.order_number}</h1>
        
        {/* Status Timeline */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[
              { step: 1, label: 'Confirmed', icon: '✓' },
              { step: 2, label: 'Accepted', icon: '📦' },
              { step: 3, label: 'Out for Delivery', icon: '🚚' },
              { step: 4, label: 'Arrived', icon: '📍' },
              { step: 5, label: 'Delivered', icon: '🎉' }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= item.step ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  {currentStep >= item.step ? item.icon : item.step}
                </div>
                <p className={`text-sm mt-2 ${currentStep >= item.step ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="font-medium text-blue-900">
            {order.status === 'paid' && 'Order confirmed, waiting for delivery agent'}
            {order.status === 'shipped' && 'Delivery agent accepted your order'}
            {order.status === 'out_for_delivery' && 'Your order is on the way!'}
            {order.status === 'arrived' && 'Delivery agent has arrived at your location'}
            {order.status === 'delivered' && 'Order delivered successfully!'}
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Order Info</h3>
            <p>Total: KES {order.total}</p>
            <p>Payment: {order.payment_method === 'cash' ? 'COD' : order.payment_method}</p>
            <p>Zone: {order.delivery_zone}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            {order.delivery_address && (
              <div>
                <p>{order.delivery_address.full_name}</p>
                <p>{order.delivery_address.address_line_1}</p>
                <p>{order.delivery_address.city}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Auto-refreshes every 10 seconds
        </p>
      </div>
    </div>
  );
};

export default OrderTracking;