import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const AdminAnalytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-2 text-gray-600">Comprehensive insights and performance metrics</p>
      </div>

      {/* Revenue Trend Chart */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics?.daily_revenue || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue') return [formatPrice(value), 'Revenue'];
                return [value, 'Orders'];
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Revenue"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Orders"
              dot={{ fill: '#3b82f6', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products & Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {analytics?.top_products?.slice(0, 10).map((product, index) => (
              <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                  {index + 1}
                </div>
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.quantity_sold} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
          {(!analytics?.top_products || analytics.top_products.length === 0) && (
            <p className="text-center text-gray-500 py-8">No sales data yet</p>
          )}
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Suppliers</h2>
          <div className="space-y-4">
            {analytics?.top_suppliers?.slice(0, 10).map((supplier, index) => (
              <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{supplier.business_name}</p>
                  <p className="text-sm text-gray-600">{supplier.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPrice(supplier.earnings)}</p>
                  <p className="text-xs text-gray-600">Supplier earnings</p>
                </div>
              </div>
            ))}
          </div>
          {(!analytics?.top_suppliers || analytics.top_suppliers.length === 0) && (
            <p className="text-center text-gray-500 py-8">No supplier data yet</p>
          )}
        </div>
      </div>

      {/* Order Status & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status Distribution</h2>
          {analytics?.order_status && analytics.order_status.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.order_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {analytics.order_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No order data yet</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods Performance</h2>
          {analytics?.payment_methods && analytics.payment_methods.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.payment_methods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return [formatPrice(value), 'Revenue'];
                    return [value, 'Orders'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Orders" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No payment data yet</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatPrice(analytics?.daily_revenue?.reduce((sum, day) => sum + (day.revenue || 0), 0) || 0)}
              </p>
              <p className="text-sm text-green-700 mt-1">Last 30 days</p>
            </div>
            <svg className="w-12 h-12 text-green-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {analytics?.daily_revenue?.reduce((sum, day) => sum + (day.orders || 0), 0) || 0}
              </p>
              <p className="text-sm text-blue-700 mt-1">Last 30 days</p>
            </div>
            <svg className="w-12 h-12 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-800 font-medium">Average Order Value</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {formatPrice(
                  (analytics?.daily_revenue?.reduce((sum, day) => sum + (day.revenue || 0), 0) || 0) /
                  (analytics?.daily_revenue?.reduce((sum, day) => sum + (day.orders || 0), 0) || 1)
                )}
              </p>
              <p className="text-sm text-purple-700 mt-1">Per order</p>
            </div>
            <svg className="w-12 h-12 text-purple-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
