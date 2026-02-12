import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const SupplierDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);
  
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/supplier/dashboard');
      setDashboard(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
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
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
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
        <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your business</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.products?.total || 0}</p>
              <p className="text-sm text-green-600 mt-1">
                {dashboard?.products?.active || 0} active
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          {dashboard?.products?.low_stock > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-orange-600">
                {dashboard.products.low_stock} low stock items - attention needed
              </p>
            </div>
          )}
        </div>
        
        {/* Total Orders */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.orders?.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">
                {dashboard?.orders?.items_sold || 0} items sold
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Total Earnings */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {formatPrice(dashboard?.earnings?.total || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Lifetime earnings
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Pending: <span className="font-semibold text-gray-900">{formatPrice(dashboard?.earnings?.pending || 0)}</span>
            </p>
          </div>
        </div>
        
        {/* This Month */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {formatPrice(dashboard?.earnings?.this_month || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Revenue
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Returns Alert */}
      {dashboard?.returns > 0 && (
        <Link to="/supplier/returns" className="block mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-900">You have {dashboard.returns} return request(s)</p>
              <p className="text-sm text-yellow-800 mt-1">Click to review and respond to customer return requests</p>
            </div>
          </div>
        </Link>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Link to="/add-product" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Add Product</h3>
              <p className="text-sm text-gray-600">List a new product</p>
            </div>
          </div>
        </Link>

        <Link to="/supplier-products" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">View Products</h3>
              <p className="text-sm text-gray-600">Manage your products</p>
            </div>
          </div>
        </Link>

        <Link to="/supplier/orders" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-600">View customer orders</p>
            </div>
          </div>
        </Link>

        <Link to="/supplier/returns" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Returns</h3>
              <p className="text-sm text-gray-600">Review return requests</p>
            </div>
          </div>
        </Link>

        <Link to="/supplier/analytics" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">View insights</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Status */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Product Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Products</span>
              <span className="font-semibold text-green-600">{dashboard?.products?.active || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Products</span>
              <span className="font-semibold text-gray-900">{dashboard?.products?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Stock</span>
              <span className="font-semibold text-orange-600">{dashboard?.products?.low_stock || 0}</span>
            </div>
          </div>
          <Link to="/supplier-products" className="mt-4 btn btn-outline w-full">
            Manage Products
          </Link>
        </div>
        
        {/* Earnings Breakdown */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lifetime Earnings</span>
              <span className="font-semibold text-gray-900">{formatPrice(dashboard?.earnings?.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payment</span>
              <span className="font-semibold text-yellow-600">{formatPrice(dashboard?.earnings?.pending || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-green-600">{formatPrice(dashboard?.earnings?.this_month || 0)}</span>
            </div>
          </div>
          <Link to="/supplier/payouts" className="mt-4 btn btn-outline w-full">
            View Payouts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
