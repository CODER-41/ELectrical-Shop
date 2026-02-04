import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PaymentPhoneManager = ({ userType = 'supplier' }) => {
  const { token } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    new_phone: '',
    reason: ''
  });

  const isSupplier = userType === 'supplier';
  const apiEndpoint = isSupplier ? '/supplier/profile' : '/delivery/profile';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}${apiEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.new_phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      if (isSupplier) {
        // Suppliers use the approval workflow
        await axios.put(`${API_URL}/supplier/profile/payment-phone`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Phone change request submitted for approval');
      } else {
        // Delivery agents can update directly
        await axios.put(`${API_URL}/delivery/profile`, { mpesa_number: formData.new_phone }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('M-Pesa number updated successfully');
      }
      setFormData({ new_phone: '', reason: '' });
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update phone number');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await axios.post(`${API_URL}/supplier/profile/payment-phone/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Request cancelled');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;

  const hasPendingRequest = isSupplier && profile?.payment_phone_change_status === 'pending';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isSupplier ? 'Payment Phone Number' : 'M-Pesa Payment Number'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current M-Pesa Number</label>
          <p className="mt-1 text-gray-900 font-mono">{profile?.mpesa_number || 'Not set'}</p>
        </div>

        {hasPendingRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Request</p>
                <p className="text-sm text-yellow-700">New number: {profile.payment_phone_pending}</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting admin approval</p>
              </div>
              <button
                onClick={handleCancel}
                className="text-xs text-yellow-800 hover:text-yellow-900 underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!hasPendingRequest && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isSupplier ? 'New M-Pesa Number' : 'Update M-Pesa Number'}
              </label>
              <input
                type="tel"
                value={formData.new_phone}
                onChange={(e) => setFormData({...formData, new_phone: e.target.value})}
                placeholder="0712345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {isSupplier && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Change
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Why do you need to change your payment number?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Updating...' : isSupplier ? 'Request Change' : 'Update Number'}
            </button>
          </form>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          {isSupplier ? (
            <>
              <p>• Phone number changes require admin approval for security</p>
              <p>• You'll receive email notification when approved/rejected</p>
            </>
          ) : (
            <>
              <p>• This is the number where your weekly payouts will be sent</p>
              <p>• Make sure the number is registered for M-Pesa</p>
              <p>• Payouts are processed every Monday at 6 AM</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPhoneManager;
