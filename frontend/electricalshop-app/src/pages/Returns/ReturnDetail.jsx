import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReturnDetail = () => {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturn();
  }, [returnId]);

  const fetchReturn = async () => {
    try {
      const response = await axios.get(`${API_URL}/returns/${returnId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReturnData(response.data.data);
    } catch (error) {
      toast.error('Failed to load return');
      navigate('/returns');
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
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusSteps = () => {
    const allSteps = ['pending', 'approved', 'in_transit', 'received', 'refunded'];
    const currentIndex = allSteps.indexOf(returnData.status);
    return allSteps.map((step, index) => ({
      name: step.replace('_', ' '),
      completed: index <= currentIndex || returnData.status === 'refunded',
      current: step === returnData.status
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!returnData) {
    return <div>Return not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/returns')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Returns
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Return {returnData.return_number}</h1>
            <p className="text-gray-600 mt-1">Order: {returnData.order_number}</p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(returnData.status)}`}>
            {returnData.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      {returnData.status !== 'rejected' && returnData.status !== 'cancelled' && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Return Status</h2>
          <div className="space-y-4">
            {getStatusSteps().map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {step.completed ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  )}
                </div>
                <div className="ml-4">
                  <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'} capitalize`}>
                    {step.name}
                  </p>
                  {step.current && <p className="text-sm text-green-600">Current Status</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Message */}
      {returnData.status === 'rejected' && returnData.rejection_reason && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <h3 className="font-bold text-red-900 mb-2">Return Rejected</h3>
          <p className="text-sm text-red-800">{returnData.rejection_reason}</p>
        </div>
      )}

      {/* Product Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Product Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Product Name:</span>
            <span className="font-medium text-gray-900">{returnData.order_item?.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium text-gray-900">{returnData.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium text-gray-900">KES {returnData.order_item?.price}</span>
          </div>
        </div>
      </div>

      {/* Return Details */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Return Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Reason:</span>
            <span className="font-medium text-gray-900 capitalize">{returnData.reason.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-gray-600">Description:</span>
            <p className="mt-1 text-gray-900">{returnData.description}</p>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Requested:</span>
            <span className="font-medium text-gray-900">{formatDate(returnData.created_at)}</span>
          </div>
          {returnData.reviewed_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Reviewed:</span>
              <span className="font-medium text-gray-900">{formatDate(returnData.reviewed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Refund Info */}
      {returnData.refund_amount && (
        <div className="card bg-green-50 border-green-200">
          <h2 className="text-lg font-bold text-green-900 mb-4">Refund Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-700">Refund Amount:</span>
              <span className="font-bold text-green-900">KES {returnData.refund_amount}</span>
            </div>
            {returnData.refund_method && (
              <div className="flex justify-between">
                <span className="text-green-700">Method:</span>
                <span className="font-medium text-green-900 capitalize">{returnData.refund_method.replace('_', ' ')}</span>
              </div>
            )}
            {returnData.refunded_at && (
              <div className="flex justify-between">
                <span className="text-green-700">Refunded:</span>
                <span className="font-medium text-green-900">{formatDate(returnData.refunded_at)}</span>
              </div>
            )}
            {returnData.refund_reference && (
              <div className="flex justify-between">
                <span className="text-green-700">Reference:</span>
                <span className="font-medium text-green-900">{returnData.refund_reference}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnDetail;
