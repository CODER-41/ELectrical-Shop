import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPayouts = () => {
  const { user } = useSelector((state) => state.auth);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/payouts`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPayouts(response.data.data.payouts);
    } catch (error) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    if (!window.confirm('Generate payouts for all suppliers with completed orders?')) return;
    try {
      const response = await axios.post(`${API_URL}/admin/payouts/generate`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(response.data.message);
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to generate payouts');
    }
  };

  const handleProcessPayout = async (payoutId) => {
    const reference = prompt('Enter M-Pesa reference number:');
    if (!reference) return;
    try {
      await axios.put(`${API_URL}/admin/payouts/${payoutId}/process`, 
        { payment_reference: reference },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Payout processed successfully');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to process payout');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Payouts</h1>
        <button onClick={handleGeneratePayouts} className="btn btn-primary">
          Generate Payouts
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{payout.payout_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatPrice(payout.gross_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-red-600">-{formatPrice(payout.return_deductions)}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{formatPrice(payout.net_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payout.status === 'pending' && (
                    <button
                      onClick={() => handleProcessPayout(payout.id)}
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      Process
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayouts;
