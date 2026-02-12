import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const SupplierReturns = () => {
  const { token } = useSelector((state) => state.auth);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    action: '',
    response: '',
    dispute_reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (token) {
      fetchReturns();
      fetchStats();
    }
  }, [filter, pagination.page, token]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, per_page: 20 };
      if (filter !== 'all') params.status = filter;

      const response = await api.get('/supplier/returns', { params });
      setReturns(response.data.data.returns || []);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/supplier/returns/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({ total: 0, pending: 0, needs_response: 0, disputed: 0, approved: 0, completed: 0, total_deductions: 0 });
    }
  };

  const handleAcknowledge = async (returnId) => {
    try {
      await api.post(`/supplier/returns/${returnId}/acknowledge`);
      toast.success('Return acknowledged');
      fetchReturns();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to acknowledge');
    }
  };

  const handleRespond = async () => {
    if (!responseForm.action) {
      toast.error('Please select an action');
      return;
    }
    if (responseForm.action === 'dispute' && !responseForm.dispute_reason.trim()) {
      toast.error('Please provide a dispute reason');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/supplier/returns/${selectedReturn.id}/respond`, {
        action: responseForm.action,
        response: responseForm.response,
        dispute_reason: responseForm.dispute_reason,
      });
      toast.success(`Return ${responseForm.action === 'accept' ? 'accepted' : 'disputed'} successfully`);
      setShowModal(false);
      setResponseForm({ action: '', response: '', dispute_reason: '' });
      fetchReturns();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const openRespondModal = (ret) => {
    setSelectedReturn(ret);
    setResponseForm({ action: '', response: '', dispute_reason: '' });
    setShowModal(true);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });

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

  const getActionBadge = (ret) => {
    if (!ret.supplier_action) {
      return <span className="text-xs text-gray-500 italic">Not responded</span>;
    }
    if (ret.supplier_action === 'accept') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Accepted</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Disputed</span>;
  };

  const canRespond = (ret) =>
    !ret.supplier_action && ['requested', 'pending', 'supplier_review'].includes(ret.status);

  const canAcknowledge = (ret) =>
    !ret.supplier_acknowledged && ['requested', 'pending', 'supplier_review'].includes(ret.status);

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
        <p className="mt-2 text-gray-600">Review and respond to return requests on your products</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-sm text-yellow-800 font-medium">Needs Your Response</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.needs_response || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-sm text-red-800 font-medium">Disputed</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.disputed || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-blue-800 font-medium">Total Returns</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
            <p className="text-sm text-orange-800 font-medium">Total Deductions</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">{formatPrice(stats.total_deductions || 0)}</p>
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
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No returns found</h3>
            <p className="mt-2 text-gray-600">
              {filter === 'all' ? 'No return requests on your products yet' : `No ${filter} returns`}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Response</th>
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
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ret.reason}</div>
                    {ret.is_warranty_claim && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded mt-1 inline-block">Warranty</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-bold text-gray-900">
                      {ret.refund_amount ? formatPrice(ret.refund_amount) : (ret.item_subtotal ? formatPrice(ret.item_subtotal) : '-')}
                    </div>
                    {ret.supplier_deduction > 0 && (
                      <div className="text-xs text-red-600 mt-0.5">
                        Deduction: {formatPrice(ret.supplier_deduction)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(ret)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ret.status)}`}>
                      {(ret.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.created_at ? formatDate(ret.created_at) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {canAcknowledge(ret) && !canRespond(ret) && (
                      <button
                        onClick={() => handleAcknowledge(ret.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    {canRespond(ret) && (
                      <button
                        onClick={() => openRespondModal(ret)}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Respond
                      </button>
                    )}
                    {!canRespond(ret) && (
                      <button
                        onClick={() => { setSelectedReturn(ret); setShowModal(true); setResponseForm({ action: '', response: '', dispute_reason: '' }); }}
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

      {/* Respond / View Modal */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {canRespond(selectedReturn) ? 'Respond to Return Request' : 'Return Details'}
            </h3>

            {/* Return Info */}
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
                      <img key={idx} src={img} alt="Return evidence" className="w-24 h-24 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Impact */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-800 mb-2">Financial Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Item Price:</span>
                    <span className="ml-2 font-medium">{selectedReturn.item_price ? formatPrice(selectedReturn.item_price) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Return Qty:</span>
                    <span className="ml-2 font-medium">{selectedReturn.quantity || 1}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Return Value:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {formatPrice(selectedReturn.refund_amount || selectedReturn.item_subtotal || 0)}
                    </span>
                  </div>
                  {selectedReturn.supplier_deduction > 0 && (
                    <div>
                      <span className="text-red-700">Your Deduction:</span>
                      <span className="ml-2 font-bold text-red-900">{formatPrice(selectedReturn.supplier_deduction)}</span>
                    </div>
                  )}
                  {selectedReturn.restocking_fee > 0 && (
                    <div>
                      <span className="text-gray-600">Restocking Fee:</span>
                      <span className="ml-2 font-medium">{formatPrice(selectedReturn.restocking_fee)}</span>
                    </div>
                  )}
                  {selectedReturn.refund_policy && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Refund Policy:</span>
                      <span className="ml-2 font-medium capitalize">{(selectedReturn.refund_policy || '').replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Existing supplier response (view mode) */}
              {selectedReturn.supplier_action && (
                <div className={`border rounded-lg p-4 ${
                  selectedReturn.supplier_action === 'accept' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm font-semibold mb-2">
                    {selectedReturn.supplier_action === 'accept' ? 'You Accepted This Return' : 'You Disputed This Return'}
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
            </div>

            {/* Response Form (only if can respond) */}
            {canRespond(selectedReturn) && (
              <div className="border-t pt-4 space-y-4">
                <p className="font-semibold text-gray-900">Your Response</p>

                {/* Action Selection */}
                <div className="flex gap-4">
                  <label className={`flex-1 cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${
                    responseForm.action === 'accept' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="action"
                      value="accept"
                      checked={responseForm.action === 'accept'}
                      onChange={(e) => setResponseForm({ ...responseForm, action: e.target.value })}
                      className="sr-only"
                    />
                    <div className="text-2xl mb-1">&#10003;</div>
                    <p className="font-semibold text-green-700">Accept Return</p>
                    <p className="text-xs text-gray-600 mt-1">Agree with the customer&apos;s request</p>
                  </label>
                  <label className={`flex-1 cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${
                    responseForm.action === 'dispute' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="action"
                      value="dispute"
                      checked={responseForm.action === 'dispute'}
                      onChange={(e) => setResponseForm({ ...responseForm, action: e.target.value })}
                      className="sr-only"
                    />
                    <div className="text-2xl mb-1">&#10007;</div>
                    <p className="font-semibold text-red-700">Dispute Return</p>
                    <p className="text-xs text-gray-600 mt-1">Disagree with the return reason</p>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Notes {responseForm.action === 'accept' ? '(optional)' : ''}
                  </label>
                  <textarea
                    rows={3}
                    value={responseForm.response}
                    onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Add your notes about this return..."
                  />
                </div>

                {/* Dispute Reason */}
                {responseForm.action === 'dispute' && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Dispute Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={responseForm.dispute_reason}
                      onChange={(e) => setResponseForm({ ...responseForm, dispute_reason: e.target.value })}
                      className="w-full border border-red-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Explain why you disagree with this return request..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline flex-1"
              >
                {canRespond(selectedReturn) ? 'Cancel' : 'Close'}
              </button>
              {canRespond(selectedReturn) && (
                <button
                  onClick={handleRespond}
                  disabled={submitting || !responseForm.action}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
                    responseForm.action === 'dispute'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {submitting ? 'Submitting...' : responseForm.action === 'dispute' ? 'Submit Dispute' : 'Submit Response'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReturns;
