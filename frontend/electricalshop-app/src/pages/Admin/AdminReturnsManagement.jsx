import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminReturnsManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (token) {
      fetchReturns();
      fetchAnalytics();
    }
  }, [filter, pagination.page, token]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, per_page: 20 };
      if (filter !== 'all') params.status = filter;

      const response = await api.get('/admin/returns', { params });
      setReturns(response.data.data.returns || []);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/returns/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics({
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        disputed: 0,
        by_status: []
      });
    }
  };

  const handleReview = async (returnId, action, data = {}) => {
    try {
      await api.put(`/returns/${returnId}/review`, { action, ...data });
      toast.success(`Return ${action}d successfully`);
      fetchReturns();
      fetchAnalytics();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Action failed');
    }
  };

  const handleProcessRefund = async (returnId, method) => {
    if (!window.confirm('Process refund for this return?')) return;
    try {
      await api.post(`/admin/returns/${returnId}/process-refund`, { refund_method: method });
      toast.success('Refund processed successfully');
      fetchReturns();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Refund failed');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(price);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_review: 'bg-blue-100 text-blue-800',
      supplier_review: 'bg-purple-100 text-purple-800',
      disputed: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      refund_completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canReview = (status) =>
    ['pending', 'requested', 'pending_review', 'supplier_review', 'disputed'].includes(status);

  if (loading && !returns.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
        <p className="mt-2 text-gray-600">Review and process product returns</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-sm text-yellow-800 font-medium">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {analytics.pending || 0}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-sm text-red-800 font-medium">Disputed</p>
            <p className="text-3xl font-bold text-red-900 mt-2">
              {analytics.disputed || 0}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-blue-800 font-medium">Approved</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {analytics.approved || 0}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-green-800 font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {analytics.completed || 0}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
            <p className="text-sm text-gray-800 font-medium">Rejected</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analytics.rejected || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Returns' },
            { key: 'pending', label: 'Pending' },
            { key: 'disputed', label: 'Disputed' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table */}
      <div className="card overflow-x-auto">
        {returns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No returns found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">{ret.return_number || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{ret.product_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">Qty: {ret.quantity || 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.customer_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ret.reason}</div>
                    {ret.is_warranty_claim && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded mt-1 inline-block">Warranty</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ret.supplier_action ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        ret.supplier_action === 'accept' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ret.supplier_action === 'accept' ? 'Accepted' : 'Disputed'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No response</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                    {ret.refund_amount ? formatPrice(ret.refund_amount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ret.status)}`}>
                      {(ret.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.created_at ? formatDate(ret.created_at) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {canReview(ret.status) && (
                      <button
                        onClick={() => { setSelectedReturn(ret); setShowModal(true); }}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Review
                      </button>
                    )}
                    {ret.status === 'approved' && (
                      <button
                        onClick={() => handleProcessRefund(ret.id, 'mpesa')}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Process Refund
                      </button>
                    )}
                    {!canReview(ret.status) && ret.status !== 'approved' && (
                      <button
                        onClick={() => { setSelectedReturn(ret); setShowModal(true); }}
                        className="text-gray-600 hover:text-gray-800 font-medium"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-outline disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="btn btn-outline disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review / View Modal */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {canReview(selectedReturn.status) ? 'Review Return Request' : 'Return Details'}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Return Number</p>
                  <p className="font-medium">{selectedReturn.return_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedReturn.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium">{selectedReturn.product_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium">{selectedReturn.quantity || 1}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium">{selectedReturn.reason}</p>
              </div>

              {selectedReturn.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{selectedReturn.description}</p>
                </div>
              )}

              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Customer Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReturn.images.map((img, idx) => (
                      <img key={idx} src={img} alt="Return" className="w-24 h-24 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}

              {/* Supplier Response Section */}
              {selectedReturn.supplier_action && (
                <div className={`border rounded-lg p-4 ${
                  selectedReturn.supplier_action === 'accept' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm font-semibold mb-2">
                    Supplier {selectedReturn.supplier_action === 'accept' ? 'Accepted' : 'Disputed'} This Return
                  </p>
                  {selectedReturn.supplier_response && (
                    <p className="text-sm text-gray-700">{selectedReturn.supplier_response}</p>
                  )}
                  {selectedReturn.supplier_dispute_reason && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Dispute reason:</p>
                      <p className="text-sm text-gray-900">{selectedReturn.supplier_dispute_reason}</p>
                    </div>
                  )}
                  {selectedReturn.supplier_action_at && (
                    <p className="text-xs text-gray-500 mt-2">Responded on {formatDate(selectedReturn.supplier_action_at)}</p>
                  )}
                </div>
              )}

              {/* Financial Impact */}
              {(selectedReturn.refund_amount > 0 || selectedReturn.supplier_deduction > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-2">Financial Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedReturn.refund_amount > 0 && (
                      <div>
                        <span className="text-orange-700">Refund Amount:</span>
                        <span className="ml-2 font-medium">{formatPrice(selectedReturn.refund_amount)}</span>
                      </div>
                    )}
                    {selectedReturn.supplier_deduction > 0 && (
                      <div>
                        <span className="text-orange-700">Supplier Deduction:</span>
                        <span className="ml-2 font-medium">{formatPrice(selectedReturn.supplier_deduction)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline flex-1"
              >
                {canReview(selectedReturn.status) ? 'Cancel' : 'Close'}
              </button>
              {canReview(selectedReturn.status) && (
                <>
                  <button
                    onClick={() => handleReview(selectedReturn.id, 'reject', {
                      rejection_reason: prompt('Rejection reason:')
                    })}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview(selectedReturn.id, 'approve', { refund_method: 'mpesa' })}
                    className="btn btn-primary flex-1"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsManagement;
