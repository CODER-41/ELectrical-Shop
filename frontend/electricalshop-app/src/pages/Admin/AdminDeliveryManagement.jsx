import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminDeliveryManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard stats
  const [stats, setStats] = useState(null);

  // Lists
  const [agents, setAgents] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [zoneRequests, setZoneRequests] = useState([]);
  const [zones, setZones] = useState([]);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'agents') fetchAgents();
    if (token && activeTab === 'orders') fetchUnassignedOrders();
    if (token && activeTab === 'zone-requests') fetchZoneRequests();
    if (token && activeTab === 'zones') fetchZones();
  }, [token, activeTab]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/delivery/admin/dashboard');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get('/delivery/admin/agents');
      setAgents(response.data.data.agents || []);
    } catch (error) {
      toast.error('Failed to load agents');
    }
  };

  const fetchUnassignedOrders = async () => {
    try {
      const response = await api.get('/delivery/admin/orders/unassigned');
      setUnassignedOrders(response.data.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const fetchZoneRequests = async () => {
    try {
      const response = await api.get('/delivery/admin/zone-requests?status=pending');
      setZoneRequests(response.data.data.requests || []);
    } catch (error) {
      toast.error('Failed to load zone requests');
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get('/delivery/admin/delivery-zones');
      setZones(response.data.data.zones || []);
    } catch (error) {
      toast.error('Failed to load zones');
    }
  };

  const handleAssignAgent = async (orderId, agentId) => {
    try {
      await api.post(`/delivery/admin/orders/${orderId}/assign`, { agent_id: agentId });
      toast.success('Agent assigned successfully');
      fetchUnassignedOrders();
      fetchDashboard();
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign agent');
    }
  };

  const handleAutoAssign = async (orderId) => {
    try {
      const response = await api.post(`/delivery/admin/orders/${orderId}/auto-assign`);
      toast.success(response.data.message);
      fetchUnassignedOrders();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to auto-assign');
    }
  };

  const handleAutoAssignAll = async () => {
    try {
      const response = await api.post('/delivery/admin/orders/auto-assign-all');
      toast.success(response.data.message);
      fetchUnassignedOrders();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to auto-assign orders');
    }
  };

  const handleApproveZoneRequest = async (requestId) => {
    try {
      await api.post(`/delivery/admin/zone-requests/${requestId}/approve`);
      toast.success('Zone request approved');
      fetchZoneRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleRejectZoneRequest = async (requestId) => {
    const notes = prompt('Please provide a reason for rejection:');
    if (!notes) return;

    try {
      await api.post(`/delivery/admin/zone-requests/${requestId}/reject`, { notes });
      toast.success('Zone request rejected');
      fetchZoneRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
        <p className="mt-2 text-gray-600">Manage delivery agents, assignments, and zone requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'orders', label: 'Unassigned Orders' },
            { id: 'agents', label: 'Delivery Agents' },
            { id: 'zone-requests', label: 'Zone Requests' },
            { id: 'zones', label: 'Delivery Zones' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'zone-requests' && zoneRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {zoneRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Agents</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.agents.available} / {stats.agents.total}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unassigned Orders</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {stats.orders.unassigned}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered Today</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.orders.delivered_today}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">COD Pending Verification</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatPrice(stats.cod.pending_verification)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Pending Delivery</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.orders.pending_delivery}</p>
              <p className="text-sm text-gray-500 mt-1">Orders out for delivery</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Zone Requests</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.zone_requests_pending}</p>
              <p className="text-sm text-gray-500 mt-1">Pending approval</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Active Disputes</h3>
              <p className="text-3xl font-bold text-red-600">{stats.active_disputes}</p>
              <p className="text-sm text-gray-500 mt-1">Need attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Orders Awaiting Assignment</h2>
            {unassignedOrders.length > 0 && (
              <button
                onClick={handleAutoAssignAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Auto-Assign All
              </button>
            )}
          </div>

          {unassignedOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">All orders assigned</h3>
              <p className="mt-2 text-gray-500">No orders waiting for delivery agent assignment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unassignedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {order.delivery_zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_method === 'cash'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.payment_method === 'cash' ? 'COD' : order.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAutoAssign(order.id)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Auto-Assign
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAssignModal(true);
                              fetchAgents();
                            }}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Manual Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delivery Agents Tab */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Delivery Agents</h2>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No delivery agents found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Deliveries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium">
                              {agent.profile?.first_name?.[0]}{agent.profile?.last_name?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.profile?.first_name} {agent.profile?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {agent.profile?.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 capitalize">
                        {agent.profile?.vehicle_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {agent.profile?.total_deliveries || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.profile?.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {agent.profile?.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.profile?.assigned_zones?.length || 0} zones
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Zone Requests Tab */}
      {activeTab === 'zone-requests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Zone Requests</h2>
          </div>

          {zoneRequests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
              <p className="mt-2 text-gray-500">All zone requests have been processed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {zoneRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{request.agent_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Requesting access to: <span className="font-medium">{request.zone_name}</span>
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}
                      {request.experience && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Experience:</span> {request.experience}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Requested on {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveZoneRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectZoneRequest(request.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delivery Zones Tab */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Delivery Zones</h2>
          </div>

          {zones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No delivery zones configured.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counties</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {zone.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {zone.counties?.slice(0, 3).map((county) => (
                            <span key={county} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {county}
                            </span>
                          ))}
                          {zone.counties?.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{zone.counties.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatPrice(zone.delivery_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {zone.estimated_days} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {zone.agent_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          zone.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Assign Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Delivery Agent
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: <span className="font-medium">{selectedOrder.order_number}</span>
              <br />
              Zone: <span className="font-medium">{selectedOrder.delivery_zone}</span>
            </p>

            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            >
              <option value="">Select an agent</option>
              {agents.filter(a => a.profile?.is_available).map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.profile?.first_name} {agent.profile?.last_name} ({agent.profile?.vehicle_type || 'N/A'})
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedAgent('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignAgent(selectedOrder.id, selectedAgent)}
                disabled={!selectedAgent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryManagement;
