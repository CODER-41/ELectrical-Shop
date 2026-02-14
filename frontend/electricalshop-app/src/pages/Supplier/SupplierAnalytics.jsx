import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const SupplierAnalytics = () => {
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
        doc.text('Supplier Analytics Report', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });
      
        let yPos = 45;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Summary Metrics', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', formatPrice(analytics.profit_metrics?.total_earnings || 0)],
          ['Profit Margin', `${analytics.profit_metrics?.profit_margin || 0}%`],
          ['MoM Growth', `${analytics.growth_metrics?.mom_growth || 0}%`],
          ['YoY Growth', `${analytics.growth_metrics?.yoy_growth || 0}%`],
          ['Unique Customers', analytics.customer_metrics?.unique_customers || 0],
          ['Repeat Rate', `${analytics.customer_metrics?.repeat_rate || 0}%`],
          ['Return Rate', `${analytics.return_analysis?.return_rate || 0}%`],
          ['Inventory Turnover', `${analytics.inventory_metrics?.turnover_rate || 0}x`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        yPos = doc.lastAutoTable.finalY + 15;

        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Top Selling Products', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Product', 'Qty Sold', 'Revenue', 'Orders']],
        body: analytics.top_products?.slice(0, 10).map(p => [
          p.name,
          p.quantity_sold,
          formatPrice(p.earnings),
          p.orders
        ]) || [],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.text('Monthly Earnings', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
        head: [['Month', 'Earnings', 'Orders']],
        body: analytics.monthly_earnings?.map(m => [
          m.month,
          formatPrice(m.earnings),
          m.orders
        ]) || [],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      });

        if (analytics.category_performance?.length > 0) {
          doc.addPage();
          yPos = 20;

          doc.setFontSize(14);
          doc.text('Category Performance', 14, yPos);
          yPos += 8;

          autoTable(doc, {
            startY: yPos,
          head: [['Category', 'Revenue', 'Quantity']],
          body: analytics.category_performance.map(c => [
            c.name,
            formatPrice(c.earnings),
            c.quantity
          ]),
          theme: 'grid',
          headStyles: { fillColor: [249, 115, 22] }
          });
        }

        doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
      // Prepare CSV content
      let csv = 'Supplier Analytics Report\n';
      csv += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Summary Metrics
      csv += 'SUMMARY METRICS\n';
      csv += 'Metric,Value\n';
      csv += `Total Revenue,${formatPrice(analytics.profit_metrics?.total_earnings || 0)}\n`;
      csv += `Profit Margin,${analytics.profit_metrics?.profit_margin || 0}%\n`;
      csv += `MoM Growth,${analytics.growth_metrics?.mom_growth || 0}%\n`;
      csv += `YoY Growth,${analytics.growth_metrics?.yoy_growth || 0}%\n`;
      csv += `Unique Customers,${analytics.customer_metrics?.unique_customers || 0}\n`;
      csv += `Repeat Rate,${analytics.customer_metrics?.repeat_rate || 0}%\n`;
      csv += `Return Rate,${analytics.return_analysis?.return_rate || 0}%\n`;
      csv += `Inventory Turnover,${analytics.inventory_metrics?.turnover_rate || 0}x\n\n`;

      // Top Products
      csv += 'TOP SELLING PRODUCTS\n';
      csv += 'Product,Quantity Sold,Revenue,Orders\n';
      analytics.top_products?.forEach(p => {
        csv += `"${p.name}",${p.quantity_sold},${p.earnings},${p.orders}\n`;
      });
      csv += '\n';

      // Monthly Earnings
      csv += 'MONTHLY EARNINGS\n';
      csv += 'Month,Earnings,Orders\n';
      analytics.monthly_earnings?.forEach(m => {
        csv += `${m.month},${m.earnings},${m.orders}\n`;
      });
      csv += '\n';

      // Category Performance
      csv += 'CATEGORY PERFORMANCE\n';
      csv += 'Category,Revenue,Quantity\n';
      analytics.category_performance?.forEach(c => {
        csv += `${c.name},${c.earnings},${c.quantity}\n`;
      });

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
      setShowExportMenu(false);
    } catch (error) {
      toast.error('Failed to export report');
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
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Analytics</h1>
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
          {['overview', 'sales', 'products', 'customers', 'inventory'].map(tab => (
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
            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-orange-800 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">
                    {formatPrice(analytics?.profit_metrics?.total_earnings || 0)}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Profit Margin: {analytics?.profit_metrics?.profit_margin || 0}%
                  </p>
                </div>
                <svg className="w-10 h-10 text-orange-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-800 font-medium">MoM Growth</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {analytics?.growth_metrics?.mom_growth > 0 ? '+' : ''}{analytics?.growth_metrics?.mom_growth || 0}%
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    This Month: {formatPrice(analytics?.growth_metrics?.this_month || 0)}
                  </p>
                </div>
                <svg className="w-10 h-10 text-green-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-800 font-medium">Unique Customers</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {analytics?.customer_metrics?.unique_customers || 0}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Repeat Rate: {analytics?.customer_metrics?.repeat_rate || 0}%
                  </p>
                </div>
                <svg className="w-10 h-10 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-800 font-medium">Return Rate</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {analytics?.return_analysis?.return_rate || 0}%
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Total Returns: {analytics?.return_analysis?.total_returns || 0}
                  </p>
                </div>
                <svg className="w-10 h-10 text-purple-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Growth Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Growth Comparison</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Month-over-Month</span>
                    <span className={`text-sm font-bold ${analytics?.growth_metrics?.mom_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics?.growth_metrics?.mom_growth > 0 ? '+' : ''}{analytics?.growth_metrics?.mom_growth || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${analytics?.growth_metrics?.mom_growth >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(Math.abs(analytics?.growth_metrics?.mom_growth || 0), 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Year-over-Year</span>
                    <span className={`text-sm font-bold ${analytics?.growth_metrics?.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics?.growth_metrics?.yoy_growth > 0 ? '+' : ''}{analytics?.growth_metrics?.yoy_growth || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${analytics?.growth_metrics?.yoy_growth >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(Math.abs(analytics?.growth_metrics?.yoy_growth || 0), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Inventory Health</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Turnover Rate</span>
                  <span className="font-bold text-gray-900">{analytics?.inventory_metrics?.turnover_rate || 0}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Inventory</span>
                  <span className="font-bold text-gray-900">{Math.round(analytics?.inventory_metrics?.avg_inventory || 0)} units</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Low Stock Items</span>
                  <span className="font-bold text-orange-600">{analytics?.inventory_metrics?.low_stock_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Earnings */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Performance (Last 12 Months)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics?.monthly_earnings || []}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
                <Area type="monotone" dataKey="earnings" stroke="#f97316" fillOpacity={1} fill="url(#colorEarnings)" name="Earnings" />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <>
          {/* Daily Sales */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Sales Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics?.daily_sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => name === 'earnings' ? formatPrice(value) : value} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} name="Earnings" />
                <Line yAxisId="right" type="monotone" dataKey="items_sold" stroke="#3b82f6" strokeWidth={2} name="Items Sold" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AOV Trend */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Average Order Value Trend</h2>
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

          {/* Peak Hours */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Sales Hours (Last 90 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.peak_hours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip formatter={(value, name) => name === 'earnings' ? formatPrice(value) : value} />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                <Bar dataKey="earnings" fill="#10b981" name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.category_performance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
                <Bar dataKey="earnings" fill="#f97316" name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Products Table */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
              <div className="space-y-4">
                {analytics?.top_products?.map((product, index) => (
                  <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        {product.quantity_sold} units • {product.orders} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(product.earnings)}</p>
                      <p className="text-xs text-gray-500">{formatPrice(product.price)}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
              {(!analytics?.top_products || analytics.top_products.length === 0) && (
                <p className="text-center text-gray-500 py-8">No sales data yet</p>
              )}
            </div>

            {/* Products Pie Chart */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Distribution</h2>
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

          {/* Low Stock Alert */}
          {analytics?.inventory_metrics?.low_stock_products?.length > 0 && (
            <div className="card bg-orange-50 border-orange-200">
              <h2 className="text-xl font-bold text-orange-900 mb-4">⚠️ Low Stock Alert</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.inventory_metrics.low_stock_products.map((product) => (
                  <div key={product.id} className="bg-white p-4 rounded-lg border border-orange-200">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="text-sm font-bold text-orange-600">{product.stock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Threshold:</span>
                      <span className="text-sm text-gray-900">{product.threshold} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-800 font-medium">Total Customers</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">
                {analytics?.customer_metrics?.unique_customers || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-800 font-medium">Repeat Customers</p>
              <p className="text-4xl font-bold text-green-900 mt-2">
                {analytics?.customer_metrics?.repeat_customers || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-sm text-purple-800 font-medium">Repeat Rate</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">
                {analytics?.customer_metrics?.repeat_rate || 0}%
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Insights</h2>
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 mb-2">Customer Loyalty Score</p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-green-500 h-4 rounded-full"
                    style={{ width: `${analytics?.customer_metrics?.repeat_rate || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {analytics?.customer_metrics?.repeat_rate >= 30 ? 'Excellent' : analytics?.customer_metrics?.repeat_rate >= 15 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Inventory Turnover</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {analytics?.inventory_metrics?.turnover_rate || 0}x
              </p>
              <p className="text-sm text-gray-600 mt-1">Times per period</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Average Inventory</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {Math.round(analytics?.inventory_metrics?.avg_inventory || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Units in stock</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
              <p className="text-4xl font-bold text-orange-600 mt-2">
                {analytics?.inventory_metrics?.low_stock_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Needs restocking</p>
            </div>
          </div>

          {/* Return Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Return Analysis</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Returns</span>
                  <span className="font-bold text-gray-900">{analytics?.return_analysis?.total_returns || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Return Rate</span>
                  <span className="font-bold text-orange-600">{analytics?.return_analysis?.return_rate || 0}%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Return Reasons</h2>
              {analytics?.return_analysis?.by_reason?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.return_analysis.by_reason}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analytics.return_analysis.by_reason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No return data</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierAnalytics;
