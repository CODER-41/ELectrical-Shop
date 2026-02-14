import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Building2, Store, DollarSign, BarChart3, Users, ArrowUpRight, ArrowDownRight, FileDown, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
      const data = response.data.data;
      // Store complete API response
      setReport(data);
    } catch (error) {
      console.error('Failed to load financial report:', error);
      toast.error('Failed to load financial report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportToPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    const img = new Image();
    img.src = '/elogo.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 14, 10, 30, 30);
      
      doc.setFontSize(18);
      doc.text('Financial Report', 50, 25);
      doc.setFontSize(11);
      doc.text(`Period: ${dateRange.start_date} to ${dateRange.end_date}`, 50, 33);
    
      autoTable(doc, {
        startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatPrice(report.revenue?.total_revenue || 0)],
        ['Platform Net Earnings', formatPrice(report.earnings?.platform_net_earnings || 0)],
        ['Total Payouts Due', formatPrice((report.earnings?.total_supplier_earnings || 0) + (report.earnings?.delivery_agent_share || 0))],
        ['Total Refunds', formatPrice(report.refunds?.total_refunds_to_customers || 0)],
        ['Total Orders', report.orders?.total_orders || 0],
        ['Gross Margin', `${(report.profit_margins?.gross_profit_margin || 0).toFixed(2)}%`],
        ['Net Margin', `${(report.profit_margins?.net_profit_margin || 0).toFixed(2)}%`]
      ]
    });
    
    if (report.top_categories?.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Category', 'Revenue', '% of Total']],
        body: report.top_categories.map(c => [
          c.name,
          formatPrice(c.revenue),
          `${((c.revenue / (report.revenue?.total_revenue || 1)) * 100).toFixed(2)}%`
        ])
      });
    }
    
    if (report.supplier_performance?.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Supplier', 'Revenue', 'Orders', 'Paid Out', 'Pending']],
        body: report.supplier_performance.map(s => [
          s.name,
          formatPrice(s.revenue),
          s.orders,
          formatPrice(s.paid_out),
          formatPrice(s.pending_payout)
        ])
      });
    }
    
      doc.save(`financial-report-${dateRange.start_date}-${dateRange.end_date}.pdf`);
      toast.success('PDF exported successfully');
      setShowExportMenu(false);
    };
  };

  const exportToCSV = () => {
    if (!report) return;
    
    const csvContent = [
      ['Financial Report', `${dateRange.start_date} to ${dateRange.end_date}`],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', report.revenue?.total_revenue || 0],
      ['Platform Net Earnings', report.earnings?.platform_net_earnings || 0],
      ['Total Payouts Due', (report.earnings?.total_supplier_earnings || 0) + (report.earnings?.delivery_agent_share || 0)],
      ['Total Refunds', report.refunds?.total_refunds_to_customers || 0],
      ['Total Orders', report.orders?.total_orders || 0],
      [],
      ['Revenue by Category'],
      ['Category', 'Revenue', '% of Total'],
      ...(report.top_categories || []).map(c => [
        c.name,
        c.revenue,
        ((c.revenue / (report.revenue?.total_revenue || 1)) * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.start_date}-${dateRange.end_date}.csv`;
    a.click();
    toast.success('CSV exported successfully');
    setShowExportMenu(false);
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
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export Report
            <ChevronDown className="w-4 h-4" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={exportToPDF}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as CSV
              </button>
            </div>
          )}
        </div>
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
              <p className="text-3xl font-bold text-green-900 mt-2">{formatPrice(report.revenue?.total_revenue || 0)}</p>
              <p className="text-sm text-green-700 mt-1">{report.orders?.total_orders || 0} orders</p>
              <p className="text-xs text-green-600 mt-1">Products: {formatPrice(report.revenue?.total_subtotal || 0)}</p>
              <p className="text-xs text-green-600">Delivery: {formatPrice(report.revenue?.total_delivery_fees || 0)}</p>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-800 font-medium">Platform Earnings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{formatPrice(report.earnings?.platform_gross_earnings || 0)}</p>
              <p className="text-sm text-blue-700 mt-1">Commission: {formatPrice(report.earnings?.total_commission || 0)}</p>
              <p className="text-sm text-blue-700">Delivery Cut: {formatPrice(report.earnings?.platform_delivery_earnings || 0)}</p>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <p className="text-sm text-orange-800 font-medium">Payouts (What You Owe)</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{formatPrice((report.earnings?.total_supplier_earnings || 0) + (report.earnings?.delivery_agent_share || 0))}</p>
              <p className="text-sm text-orange-700 mt-1">Suppliers: {formatPrice(report.earnings?.total_supplier_earnings || 0)}</p>
              <p className="text-sm text-orange-700">Delivery: {formatPrice(report.earnings?.delivery_agent_share || 0)}</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100">
              <p className="text-sm text-red-800 font-medium">Refunds Breakdown</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{formatPrice(report.refunds?.total_refunds_to_customers || 0)}</p>
              <p className="text-sm text-red-700 mt-1">Platform: {formatPrice(report.refunds?.platform_paid_refunds || 0)}</p>
              <p className="text-sm text-red-700">Suppliers: {formatPrice(report.refunds?.supplier_paid_refunds || 0)}</p>
            </div>
          </div>

          {/* Net Earnings */}
          <div className="card mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Platform Net Earnings (Your Profit)</p>
                <p className="text-4xl font-bold mt-2">{formatPrice(report.earnings?.platform_net_earnings || 0)}</p>
                <p className="text-indigo-100 text-sm mt-2">Gross Earnings - Platform Paid Refunds</p>
                <p className="text-indigo-100 text-xs mt-1">{formatPrice(report.earnings?.platform_gross_earnings || 0)} - {formatPrice(report.refunds?.platform_paid_refunds || 0)}</p>
              </div>
            </div>
          </div>

          {/* Comprehensive Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Cash Flow */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Cash Flow
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outstanding Supplier Payouts</span>
                  <span className="text-sm font-semibold text-orange-600">{formatPrice(report.cash_flow?.outstanding_supplier_payouts || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outstanding Delivery Payouts</span>
                  <span className="text-sm font-semibold text-orange-600">{formatPrice(report.cash_flow?.outstanding_delivery_payouts || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected Incoming</span>
                  <span className="text-sm font-semibold text-green-600">{formatPrice(report.cash_flow?.expected_incoming_revenue || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-900">Net Cash Position</span>
                  <span className="text-sm font-bold text-blue-600">{formatPrice(report.cash_flow?.net_cash_position || 0)}</span>
                </div>
              </div>
            </div>

            {/* Profit Margins */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Profit Margins
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Profit</span>
                  <span className="text-sm font-semibold">{formatPrice(report.profit_margins?.gross_profit || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Margin</span>
                  <span className="text-sm font-semibold">{(report.profit_margins?.gross_profit_margin || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Net Margin</span>
                  <span className="text-sm font-semibold">{(report.profit_margins?.net_profit_margin || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-900">Profit per Order</span>
                  <span className="text-sm font-bold text-green-600">{formatPrice(report.profit_margins?.profit_per_order || 0)}</span>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Growth
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <span className={`text-sm font-semibold ${(report.growth?.revenue_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(report.growth?.revenue_growth || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Growth</span>
                  <span className={`text-sm font-semibold ${(report.growth?.order_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(report.growth?.order_growth || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Customers</span>
                  <span className="text-sm font-semibold">{report.growth?.new_customers || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-900">Acquisition Cost</span>
                  <span className="text-sm font-bold">{formatPrice(report.growth?.customer_acquisition_cost || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Costs & Tax */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                Operational Costs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">M-Pesa Fees (~1.5%)</span>
                  <span className="text-sm font-semibold text-red-600">{formatPrice(report.operational_costs?.mpesa_fees || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paystack Fees (~2.9%)</span>
                  <span className="text-sm font-semibold text-red-600">{formatPrice(report.operational_costs?.paystack_fees || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-900">Total Transaction Fees</span>
                  <span className="text-sm font-bold text-red-600">{formatPrice(report.operational_costs?.total_transaction_fees || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-900">Net After Fees</span>
                  <span className="text-sm font-bold text-green-600">{formatPrice(report.operational_costs?.net_after_fees || 0)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Tax Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">VAT Collected (16%)</span>
                  <span className="text-sm font-semibold">{formatPrice(report.tax?.vat_collected || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Est. Tax Liability (30%)</span>
                  <span className="text-sm font-semibold text-orange-600">{formatPrice(report.tax?.estimated_tax_liability || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-900">Net After Tax</span>
                  <span className="text-sm font-bold text-green-600">{formatPrice(report.tax?.net_after_tax || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Category</h2>
              {(report.top_categories || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.top_categories}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {report.top_categories.map((entry, index) => (
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
              {(report.top_categories || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.top_categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
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

          {/* Supplier Performance */}
          {(report.supplier_performance || []).length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Store className="w-6 h-6 text-blue-600" />
                Top Supplier Performance
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Payout Days</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.supplier_performance.map((sup, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{sup.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">{formatPrice(sup.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sup.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-blue-600">{formatPrice(sup.paid_out)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-600">{formatPrice(sup.pending_payout)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sup.avg_payout_days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Category Revenue Table */}
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
                  {(report.top_categories || []).map((cat, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                        {formatPrice(cat.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {((cat.revenue / (report.revenue?.total_revenue || 1)) * 100).toFixed(2)}%
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
