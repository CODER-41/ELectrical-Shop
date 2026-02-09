import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const AdminFinancialReports = () => {
  const { token } = useSelector((state) => state.auth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (token) fetchReport();
  }, [dateRange, token]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/financial', { params: dateRange });
      setReport(response.data.data);
    } catch (error) {
      console.error('Failed to load financial report:', error);
      toast.error('Failed to load financial report');
      // Set empty report to prevent UI errors
      setReport({
        total_revenue: 0,
        total_commission: 0,
        total_supplier_earnings: 0,
        total_refunds: 0,
        net_revenue: 0,
        order_count: 0,
        revenue_by_category: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const csvContent = [
      ['Financial Report', `${dateRange.start_date} to ${dateRange.end_date}`],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', report.total_revenue],
      ['Platform Commission', report.total_commission],
      ['Supplier Earnings', report.total_supplier_earnings],
      ['Total Refunds', report.total_refunds],
      ['Net Revenue', report.net_revenue],
      ['Order Count', report.order_count],
      [],
      ['Revenue by Category'],
      ['Category', 'Revenue'],
      ...report.revenue_by_category.map(c => [c.category, c.revenue])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.start_date}-${dateRange.end_date}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);

  if (loading && !report) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">Revenue, commission, and financial analytics</p>
        </div>
        <button onClick={exportReport} className="btn btn-primary">
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="input w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="input w-full"
            />
          </div>
          <button onClick={fetchReport} className="btn btn-primary">
            Generate Report
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-800 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{formatPrice(report.total_revenue)}</p>
              <p className="text-sm text-green-700 mt-1">{report.order_count} orders</p>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-800 font-medium">Platform Commission</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{formatPrice(report.total_commission)}</p>
              <p className="text-sm text-blue-700 mt-1">
                {report.total_revenue > 0 ? ((report.total_commission / report.total_revenue) * 100).toFixed(1) : 0}% of revenue
              </p>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-sm text-purple-800 font-medium">Supplier Earnings</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{formatPrice(report.total_supplier_earnings)}</p>
              <p className="text-sm text-purple-700 mt-1">
                {report.total_revenue > 0 ? ((report.total_supplier_earnings / report.total_revenue) * 100).toFixed(1) : 0}% of revenue
              </p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100">
              <p className="text-sm text-red-800 font-medium">Total Refunds</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{formatPrice(report.total_refunds || 0)}</p>
              <p className="text-sm text-red-700 mt-1">
                {report.total_revenue > 0 ? ((report.total_refunds / report.total_revenue) * 100).toFixed(1) : 0}% of revenue
              </p>
            </div>
          </div>

          {/* Net Revenue */}
          <div className="card mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Net Revenue</p>
                <p className="text-4xl font-bold mt-2">{formatPrice(report.net_revenue)}</p>
                <p className="text-indigo-100 text-sm mt-2">After refunds</p>
              </div>
              <svg className="w-16 h-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Category</h2>
              {report.revenue_by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.revenue_by_category}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: ${formatPrice(entry.revenue)}`}
                    >
                      {report.revenue_by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
              {report.revenue_by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.revenue_by_category}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Breakdown by Category</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.revenue_by_category.map((cat, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cat.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                        {formatPrice(cat.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {((cat.revenue / report.total_revenue) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFinancialReports;
