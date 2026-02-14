import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const AdminAnalytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const exportToPDF = () => {
    if (!analytics) {
      toast.error('No data to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const img = new Image();
      img.src = '/elogo.png';
      img.onload = () => {
        doc.addImage(img, 'PNG', 14, 10, 30, 30);
        
        doc.setFontSize(20);
        doc.setTextColor(249, 115, 22);
        doc.text('Platform Analytics Report', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });
      
        let yPos = 45;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Platform Metrics', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', formatPrice(analytics.platform_metrics?.total_revenue || 0)],
          ['Platform Commission', formatPrice(analytics.platform_metrics?.total_commission || 0)],
          ['Commission Rate', `${analytics.platform_metrics?.commission_rate?.toFixed(2) || 0}%`],
          ['MoM Growth', `${analytics.growth_metrics?.mom_growth || 0}%`],
          ['YoY Growth', `${analytics.growth_metrics?.yoy_growth || 0}%`],
          ['Total Customers', analytics.customer_metrics?.total_customers || 0],
          ['Repeat Rate', `${analytics.customer_metrics?.repeat_rate?.toFixed(2) || 0}%`],
          ['Return Rate', `${analytics.return_analysis?.return_rate || 0}%`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.text('Top Products', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Product', 'Qty Sold', 'Revenue', 'Orders']],
        body: analytics.top_products?.slice(0, 15).map(p => [
          p.name,
          p.quantity_sold,
          formatPrice(p.revenue),
          p.orders
        ]) || [],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.text('Top Suppliers', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Supplier', 'Orders', 'Earnings', 'Items Sold']],
        body: analytics.top_suppliers?.slice(0, 15).map(s => [
          s.business_name,
          s.orders,
          formatPrice(s.earnings),
          s.items_sold
        ]) || [],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        doc.save(`platform-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF exported successfully');
        setShowExportMenu(false);
      };
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    if (!analytics) {
      toast.error('No data to export');
      return;
    }

    try {
      let csv = 'Platform Analytics Report\n';
      csv += `Generated: ${new Date().toLocaleString()}\n\n`;

      csv += 'PLATFORM METRICS\n';
      csv += 'Metric,Value\n';
      csv += `Total Revenue,${formatPrice(analytics.platform_metrics?.total_revenue || 0)}\n`;
      csv += `Platform Commission,${formatPrice(analytics.platform_metrics?.total_commission || 0)}\n`;
      csv += `MoM Growth,${analytics.growth_metrics?.mom_growth || 0}%\n`;
      csv += `YoY Growth,${analytics.growth_metrics?.yoy_growth || 0}%\n\n`;

      csv += 'TOP PRODUCTS\n';
      csv += 'Product,Quantity Sold,Revenue,Orders\n';
      analytics.top_products?.forEach(p => {
        csv += `"${p.name}",${p.quantity_sold},${p.revenue},${p.orders}\n`;
      });
      csv += '\n';

      csv += 'TOP SUPPLIERS\n';
      csv += 'Supplier,Orders,Earnings,Items Sold\n';
      analytics.top_suppliers?.forEach(s => {
        csv += `"${s.business_name}",${s.orders},${s.earnings},${s.items_sold}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `platform-analytics-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
      setShowExportMenu(false);
    } catch (error) {
      toast.error('Failed to export CSV');
    }
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Platform Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive business intelligence and insights</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={exportToPDF}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Export as PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Export as CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'revenue', 'users', 'products', 'suppliers', 'delivery'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-800 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {formatPrice(analytics?.platform_metrics?.total_revenue || 0)}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Commission: {formatPrice(analytics?.platform_metrics?.total_commission || 0)}
                  </p>
                </div>
                <svg className="w-10 h-10 text-green-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-800 font-medium">MoM Growth</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {analytics?.growth_metrics?.mom_growth > 0 ? '+' : ''}{analytics?.growth_metrics?.mom_growth || 0}%
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    This Month: {formatPrice(analytics?.growth_metrics?.this_month || 0)}
                  </p>
                </div>
                <svg className="w-10 h-10 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-800 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {analytics?.customer_metrics?.total_customers || 0}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Repeat Rate: {analytics?.customer_metrics?.repeat_rate?.toFixed(1) || 0}%
                  </p>
                </div>
                <svg className="w-10 h-10 text-purple-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-orange-800 font-medium">Return Rate</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">
                    {analytics?.return_analysis?.return_rate || 0}%
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Total Returns: {analytics?.return_analysis?.total_returns || 0}
                  </p>
                </div>
                <svg className="w-10 h-10 text-orange-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue (Last 12 Months)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics?.monthly_revenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="commission" stroke="#f97316" fillOpacity={1} fill="url(#colorCommission)" name="Commission" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Revenue Trend */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Revenue Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.daily_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => name === 'revenue' ? formatPrice(value) : value} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
              {analytics?.category_performance && analytics.category_performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.category_performance.slice(0, 8)}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name.substring(0, 12)}...`}
                    >
                      {analytics.category_performance.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No category data yet</p>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h2>
              {analytics?.payment_methods && analytics.payment_methods.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.payment_methods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No payment data yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {formatPrice(analytics?.platform_metrics?.total_revenue || 0)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Platform Commission</p>
              <p className="text-4xl font-bold text-orange-600 mt-2">
                {formatPrice(analytics?.platform_metrics?.total_commission || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">{analytics?.platform_metrics?.commission_rate?.toFixed(2) || 0}% rate</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">YoY Growth</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {analytics?.growth_metrics?.yoy_growth > 0 ? '+' : ''}{analytics?.growth_metrics?.yoy_growth || 0}%
              </p>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">AOV Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.aov_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Area type="monotone" dataKey="aov" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="AOV" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Sales Hours</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.peak_hours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip formatter={(value, name) => name === 'revenue' ? formatPrice(value) : value} />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-800 font-medium">Total Customers</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">
                {analytics?.customer_metrics?.total_customers || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-800 font-medium">With Orders</p>
              <p className="text-4xl font-bold text-green-900 mt-2">
                {analytics?.customer_metrics?.customers_with_orders || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-sm text-purple-800 font-medium">Repeat Customers</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">
                {analytics?.customer_metrics?.repeat_customers || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <p className="text-sm text-orange-800 font-medium">Conversion Rate</p>
              <p className="text-4xl font-bold text-orange-900 mt-2">
                {analytics?.customer_metrics?.conversion_rate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth (Last 12 Months)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.user_growth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="customers" fill="#3b82f6" name="Customers" />
                <Bar dataKey="suppliers" fill="#10b981" name="Suppliers" />
                <Bar dataKey="delivery_agents" fill="#f59e0b" name="Delivery Agents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
              <div className="space-y-4">
                {analytics?.top_products?.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity_sold} units • {product.orders} orders</p>
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

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Distribution</h2>
              {analytics?.top_products && analytics.top_products.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analytics.top_products.slice(0, 8)}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry) => `${entry.name.substring(0, 15)}...`}
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

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.category_performance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#f97316" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Suppliers Performance</h2>
            <div className="space-y-4">
              {analytics?.top_suppliers?.slice(0, 15).map((supplier, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{supplier.business_name}</p>
                    <p className="text-sm text-gray-600">{supplier.orders} orders • {supplier.items_sold} items sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatPrice(supplier.earnings)}</p>
                    <p className="text-xs text-gray-600">Avg: {formatPrice(supplier.avg_order_value)}</p>
                  </div>
                </div>
              ))}
            </div>
            {(!analytics?.top_suppliers || analytics.top_suppliers.length === 0) && (
              <p className="text-center text-gray-500 py-8">No supplier data yet</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Supplier Earnings Distribution</h2>
            {analytics?.top_suppliers && analytics.top_suppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.top_suppliers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="business_name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Bar dataKey="earnings" fill="#10b981" name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No supplier data yet</p>
            )}
          </div>
        </>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Total Agents</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {analytics?.delivery_metrics?.total_agents || 0}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Active Agents (30d)</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {analytics?.delivery_metrics?.active_agents || 0}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Avg Delivery Time</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {analytics?.delivery_metrics?.avg_delivery_days || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">days</p>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Geographic Revenue Distribution</h2>
            {analytics?.geographic_revenue && analytics.geographic_revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.geographic_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? formatPrice(value) : value} />
                  <Legend />
                  <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No geographic data yet</p>
            )}
          </div>

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
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
