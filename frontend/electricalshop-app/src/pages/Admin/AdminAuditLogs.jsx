import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminAuditLogs = () => {
  const { token } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entity_type: '', user_id: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (token) fetchLogs();
  }, [filters, pagination.page, token]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, per_page: 50, ...filters };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await api.get('/admin/audit-logs', { params });
      setLogs(response.data.data.logs || []);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('approved')) return 'text-green-600';
    if (action.includes('deleted') || action.includes('rejected')) return 'text-red-600';
    if (action.includes('updated')) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading && !logs.length) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-600">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="input w-full"
            >
              <option value="">All Actions</option>
              <option value="user_registered">User Registered</option>
              <option value="user_login">User Login</option>
              <option value="product_created">Product Created</option>
              <option value="product_updated">Product Updated</option>
              <option value="order_created">Order Created</option>
              <option value="order_paid">Order Paid</option>
              <option value="return_requested">Return Requested</option>
              <option value="supplier_approved">Supplier Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
              className="input w-full"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="return">Return</option>
              <option value="payout">Payout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              placeholder="Filter by user ID"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="input w-full"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({ action: '', entity_type: '', user_id: '' })}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-x-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.user_email || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900">{log.entity_type}</div>
                    {log.entity_id && (
                      <div className="text-xs text-gray-500">{log.entity_id.substring(0, 8)}...</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                    {log.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address || '-'}
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
    </div>
  );
};

export default AdminAuditLogs;
