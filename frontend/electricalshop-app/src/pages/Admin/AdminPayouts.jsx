import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminPayouts = () => {
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('supplier'); // 'supplier' or 'delivery'
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    if (token) fetchPayouts();
  }, [filter, token, activeTab]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      
      if (activeTab === 'supplier') {
        const response = await api.get('/admin/payouts', { params });
        setPayouts(response.data.data.payouts || []);
      } else {
        const response = await api.get('/delivery/admin/delivery-payouts', { params });
        setPayouts(response.data.data.payouts || []);
      }
    } catch (error) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    try {
      if (activeTab === 'supplier') {
        const response = await api.post('/admin/payouts/generate', { period });
        toast.success(response.data.message);
      } else {
        const response = await api.post('/delivery/admin/generate-delivery-payouts');
        toast.success(response.data.message);
      }
      setShowGenerateModal(false);
      fetchPayouts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate payouts');
    }
  };

  const handleProcessPayout = async (payoutId) => {
    const reference = prompt('Enter payment reference number:');
    if (!reference) return;
    try {
      if (activeTab === 'supplier') {
        await api.put(`/admin/payouts/${payoutId}/process`, { payment_reference: reference });
      } else {
        await api.post(`/delivery/admin/delivery-payouts/${payoutId}/complete`, { payment_reference: reference });
      }
      toast.success('Payout processed successfully');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to process payout');
    }
  };

  const handleMpesaPayout = async (payoutId) => {
    if (!window.confirm('Initiate M-Pesa payment for this payout?')) return;
    try {
      if (activeTab === 'supplier') {
        const response = await api.post(`/admin/payouts/${payoutId}/mpesa`);
        toast.success(response.data.message);
      } else {
        const response = await api.post(`/delivery/admin/delivery-payouts/${payoutId}/mpesa`);
        toast.success(response.data.message);
      }
      fetchPayouts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate M-Pesa payout');
    }
  };

  const handleCancelPayout = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    try {
      if (activeTab === 'supplier') {
        await api.post(`/admin/payouts/${selectedPayout.id}/cancel`, { reason: cancelReason });
      } else {
        await api.post(`/delivery/admin/delivery-payouts/${selectedPayout.id}/cancel`, { reason: cancelReason });
      }
      toast.success('Payout cancelled successfully');
      setShowCancelModal(false);
      setSelectedPayout(null);
      setCancelReason('');
      fetchPayouts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel payout');
    }
  };

  const openCancelModal = (payout) => {
    setSelectedPayout(payout);
    setShowCancelModal(true);
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-KE') : 'N/A';

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="mt-2 text-gray-600">Manage supplier and delivery agent payments</p>
        </div>
        <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary">
          Generate Payouts
        </button>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('supplier')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'supplier'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Supplier Payouts
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'delivery'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Delivery Payouts
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Pending</button>
          <button onClick={() => setFilter('processing')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'processing' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Processing</button>
          <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'completed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Completed</button>
          <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'cancelled' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Cancelled</button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="card overflow-x-auto">
        {payouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payouts found. Generate payouts to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'supplier' ? 'Supplier' : 'Delivery Agent'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{payout.payout_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activeTab === 'supplier' 
                      ? (payout.supplier?.business_name || 'N/A')
                      : (payout.recipient?.name || 'N/A')
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(payout.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-bold text-green-600">
                        {formatPrice(activeTab === 'supplier' ? payout.amount : payout.net_amount)}
                      </div>
                      {activeTab === 'delivery' && payout.order_count && (
                        <div className="text-xs text-gray-500">{payout.order_count} orders</div>
                      )}
                      {payout.notes && <div className="text-xs text-gray-500 truncate max-w-xs">{payout.notes}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      payout.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      payout.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payout.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleMpesaPayout(payout.id)} className="text-green-600 hover:text-green-700 font-medium">M-Pesa</button>
                        <button onClick={() => handleProcessPayout(payout.id)} className="text-primary hover:text-primary-dark font-medium">Manual</button>
                        <button onClick={() => openCancelModal(payout)} className="text-red-600 hover:text-red-700 font-medium">Cancel</button>
                      </div>
                    )}
                    {payout.status === 'processing' && (
                      <span className="text-blue-600">Processing...</span>
                    )}
                    {payout.status === 'completed' && (
                      <span className="text-gray-500">Paid {formatDate(payout.paid_at || payout.processed_at)}</span>
                    )}
                    {payout.status === 'cancelled' && (
                      <span className="text-red-500">Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Generate {activeTab === 'supplier' ? 'Supplier' : 'Delivery'} Payouts</h3>
            {activeTab === 'supplier' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Period</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input w-full">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            {activeTab === 'delivery' && (
              <p className="text-sm text-gray-600 mb-4">
                This will generate payouts for all confirmed deliveries that haven't been paid yet.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleGeneratePayouts} className="btn btn-primary flex-1">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Cancel Payout</h3>
            <p className="text-sm text-gray-600 mb-4">
              Payout #{selectedPayout?.payout_number}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="Enter reason for cancelling this payout..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedPayout(null);
                  setCancelReason('');
                }}
                className="btn btn-outline flex-1"
              >
                Close
              </button>
              <button onClick={handleCancelPayout} className="btn bg-red-600 hover:bg-red-700 text-white flex-1">
                Cancel Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;