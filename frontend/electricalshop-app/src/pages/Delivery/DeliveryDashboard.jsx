import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const DeliveryDashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zone request states
  const [zones, setZones] = useState([]);
  const [zoneRequests, setZoneRequests] = useState([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestExperience, setRequestExperience] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchZones();
      fetchZoneRequests();
    }
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/delivery/dashboard');
      setDashboard(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get('/delivery/zones');
      setZones(response.data.data.zones || []);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const fetchZoneRequests = async () => {
    try {
      const response = await api.get('/delivery/zone-requests');
      setZoneRequests(response.data.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch zone requests:', error);
    }
  };

  const handleRequestZone = async () => {
    if (!selectedZone) {
      toast.error('Please select a zone');
      return;
    }

    try {
      await api.post('/delivery/zone-requests', {
        zone_id: selectedZone,
        reason: requestReason,
        experience: requestExperience
      });
      toast.success('Zone request submitted successfully');
      setShowZoneModal(false);
      setSelectedZone('');
      setRequestReason('');
      setRequestExperience('');
      fetchZoneRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit zone request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.post(`/delivery/zone-requests/${requestId}/cancel`);
      toast.success('Zone request cancelled');
      fetchZoneRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel request');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {dashboard?.profile?.first_name || 'Agent'}! Here's your delivery overview.
        </p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {dashboard?.profile?.first_name} {dashboard?.profile?.last_name}
            </h2>
            <p className="text-orange-100 mt-1">{dashboard?.profile?.vehicle_type || 'Delivery Agent'}</p>
            {dashboard?.profile?.vehicle_registration && (
              <p className="text-orange-200 text-sm mt-1">Vehicle: {dashboard.profile.vehicle_registration}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              dashboard?.profile?.is_available
                ? 'bg-orange-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {dashboard?.profile?.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pending Deliveries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Deliveries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.stats?.pending_deliveries || 0}</p>
              <p className="text-sm text-orange-600 mt-1">Awaiting delivery</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Delivered Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.stats?.delivered_today || 0}</p>
              <p className="text-sm text-green-600 mt-1">Completed deliveries</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* COD Collected Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">COD Collected Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(dashboard?.stats?.cod_collected_today || 0)}</p>
              <p className="text-sm text-blue-600 mt-1">Cash on delivery</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Deliveries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.stats?.total_deliveries || 0}</p>
              <p className="text-sm text-purple-600 mt-1">All time</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Earnings</span>
              <span className="text-xl font-bold text-orange-600">{formatPrice(dashboard?.profile?.total_earnings || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Pending Payout</span>
              <span className="text-xl font-bold text-orange-600">{formatPrice(dashboard?.profile?.pending_payout || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">COD Pending Verification</span>
              <span className="text-xl font-bold text-blue-600">{formatPrice(dashboard?.stats?.cod_pending_verification || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Fee Percentage</span>
              <span className="text-xl font-bold text-gray-900">{dashboard?.profile?.delivery_fee_percentage || 70}%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/delivery/orders"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <svg className="w-8 h-8 text-orange-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm font-medium text-gray-700">My Orders</span>
            </Link>
            <Link
              to="/delivery/payouts"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">My Payouts</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">My Profile</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Delivery Zones Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delivery Zones</h3>
          <button
            onClick={() => setShowZoneModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-colors text-sm"
          >
            Request New Zone
          </button>
        </div>

        {/* Assigned Zones */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Assigned Zones</h4>
          {dashboard?.profile?.assigned_zones && dashboard.profile.assigned_zones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {zones.filter(z => dashboard.profile.assigned_zones.includes(z.name)).map((zone) => (
                <span
                  key={zone.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {zone.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No zones assigned yet. Request zones below.</p>
          )}
        </div>

        {/* Pending Zone Requests */}
        {zoneRequests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Zone Requests</h4>
            <div className="space-y-2">
              {zoneRequests.map((request) => (
                <div
                  key={request.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    request.status === 'pending'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : request.status === 'approved'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div>
                    <span className="font-medium text-gray-900">{request.zone_name}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                    {request.admin_notes && (
                      <p className="text-sm text-gray-500 mt-1">Note: {request.admin_notes}</p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zone Request Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request New Delivery Zone</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Zone</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Choose a zone...</option>
                  {zones.filter(z => !z.is_assigned).map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - {formatPrice(zone.delivery_fee)} fee
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want this zone?</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain why you'd like to deliver in this zone..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your experience in this area</label>
                <textarea
                  value={requestExperience}
                  onChange={(e) => setRequestExperience(e.target.value)}
                  placeholder="Describe your familiarity with this area..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowZoneModal(false);
                  setSelectedZone('');
                  setRequestReason('');
                  setRequestExperience('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestZone}
                disabled={!selectedZone}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg hover:from-orange-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
