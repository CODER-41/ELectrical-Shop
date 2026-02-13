import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyReturns = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await axios.get(`${API_URL}/returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReturns(response.data.data);
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_transit: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      refunded: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Returns</h1>
        <p className="mt-2 text-gray-600">View and track your return requests</p>
      </div>

      {returns.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No returns</h3>
          <p className="mt-2 text-gray-600">You haven't requested any returns yet</p>
          <Link to="/orders" className="mt-6 inline-block btn btn-primary">
            View Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Link
              key={ret.id}
              to={`/returns/${ret.id}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ret.return_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ret.status)}`}>
                      {ret.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Order: <span className="font-medium text-gray-900">{ret.order_number}</span>
                    </p>
                    <p className="text-gray-600">
                      Product: <span className="font-medium text-gray-900">{ret.order_item?.product_name}</span>
                    </p>
                    <p className="text-gray-600">
                      Reason: <span className="font-medium text-gray-900 capitalize">{ret.reason.replace('_', ' ')}</span>
                    </p>
                    <p className="text-gray-600">
                      Requested: <span className="font-medium text-gray-900">{formatDate(ret.created_at)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-primary">
                  <span className="text-sm font-medium">View Details</span>
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReturns;
