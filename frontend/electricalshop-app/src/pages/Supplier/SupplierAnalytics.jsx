import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const SupplierAnalytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/supplier/analytics`, {
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="mt-2 text-gray-600">Track your performance and sales trends</p>
      </div>

      {/* Monthly Earnings Chart */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Earnings (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics?.monthly_earnings || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatPrice(value)} />
            <Legend />
            <Bar dataKey="earnings" fill="#f97316" name="Earnings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Sales Chart */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Sales (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.daily_sales || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'earnings') return formatPrice(value);
                return value;
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} name="Earnings" />
            <Line yAxisId="right" type="monotone" dataKey="items_sold" stroke="#3b82f6" strokeWidth={2} name="Items Sold" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Selling Products Table */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {analytics?.top_products?.slice(0, 10).map((product, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {product.quantity_sold} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPrice(product.earnings)}</p>
                </div>
              </div>
            ))}
          </div>
          {(!analytics?.top_products || analytics.top_products.length === 0) && (
            <p className="text-center text-gray-500 py-8">No sales data yet</p>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Products by Revenue</h2>
          {analytics?.top_products && analytics.top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={analytics.top_products.slice(0, 8)}
                  dataKey="earnings"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.name.substring(0, 20)}...`}
                >
                  {analytics.top_products.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">Total Items Sold</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {analytics?.daily_sales?.reduce((sum, day) => sum + (day.items_sold || 0), 0) || 0}
              </p>
            </div>
            <svg className="w-12 h-12 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatPrice(analytics?.daily_sales?.reduce((sum, day) => sum + (day.earnings || 0), 0) || 0)}
              </p>
            </div>
            <svg className="w-12 h-12 text-green-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-800 font-medium">Best Selling Product</p>
              <p className="text-lg font-bold text-purple-900 mt-2 truncate">
                {analytics?.top_products?.[0]?.name || 'N/A'}
              </p>
              {analytics?.top_products?.[0] && (
                <p className="text-sm text-purple-700 mt-1">
                  {analytics.top_products[0].quantity_sold} sold
                </p>
              )}
            </div>
            <svg className="w-12 h-12 text-purple-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierAnalytics;


