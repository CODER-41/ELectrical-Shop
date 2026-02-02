import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RequestReturn = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [orderItem, setOrderItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: 'defective',
    description: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchOrderItem();
  }, [orderId, itemId]);

  const fetchOrderItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const item = response.data.data.items?.find(i => i.id === itemId);
      if (item) {
        setOrderItem(item);
        setFormData({ ...formData, quantity: item.quantity });
      }
    } catch (error) {
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/returns`,
        {
          order_item_id: itemId,
          ...formData
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      toast.success('Return request submitted successfully');
      navigate(`/returns/${response.data.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit return');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!orderItem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-gray-900">Order item not found</h2>
          <button onClick={() => navigate('/orders')} className="btn btn-primary mt-4">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Return</h1>
      <p className="text-gray-600 mb-8">Submit a return request for your order</p>

      {/* Product Info */}
      <div className="card mb-6 bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-3">Product Details</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Product:</strong> {orderItem.product_name}</p>
          <p><strong>Quantity Ordered:</strong> {orderItem.quantity}</p>
          <p><strong>Price:</strong> KES {orderItem.product_price}</p>
          {orderItem.warranty_period_months && (
            <p><strong>Warranty:</strong> {orderItem.warranty_period_months} months</p>
          )}
        </div>
      </div>

      {/* Return Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Return *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input w-full"
              required
            >
              <option value="defective">Defective/Not Working</option>
              <option value="wrong_item">Wrong Item Received</option>
              <option value="not_as_described">Not as Described</option>
              <option value="damaged">Damaged in Transit</option>
              <option value="changed_mind">Changed Mind</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows="4"
              required
              placeholder="Please describe the issue in detail..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide as much detail as possible to help us process your return quickly
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Return *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="input w-full"
              min="1"
              max={orderItem.quantity}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Return Policy</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Returns accepted within 14 days of delivery</li>
              <li>• Products must be in original condition with packaging</li>
              <li>• Refunds processed within 5-7 business days after approval</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RequestReturn;
