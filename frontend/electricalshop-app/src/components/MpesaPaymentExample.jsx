/**
 * Example: How to use M-Pesa payment with polling
 * 
 * This example shows how to implement M-Pesa payment with automatic status polling
 * to handle cases where the callback doesn't reach the server.
 */

import React, { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MpesaPaymentExample = ({ orderId, orderTotal }) => {
  const navigate = useNavigate();
  const { 
    initiateMpesaPayment, 
    pollMpesaStatus, 
    isProcessing 
  } = usePayment();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('');
  const [stopPolling, setStopPolling] = useState(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, [stopPolling]);

  const handleMpesaPayment = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Initiate payment
    const result = await initiateMpesaPayment(orderId, phoneNumber);
    
    if (result.success) {
      toast.success(result.message || 'Please check your phone and enter M-Pesa PIN');
      setPaymentInitiated(true);
      setPollingStatus('Waiting for payment...');
      
      // Start polling for payment status
      const stopFn = pollMpesaStatus(
        orderId,
        (status, data) => {
          console.log('Payment status:', status, data);
          
          switch (status) {
            case 'completed':
              setPollingStatus('Payment successful!');
              toast.success('Payment completed successfully!');
              // Redirect to success page after 2 seconds
              setTimeout(() => {
                navigate(`/order-success/${orderId}`);
              }, 2000);
              break;
              
            case 'failed':
              setPollingStatus('Payment failed');
              toast.error('Payment failed. Please try again.');
              setPaymentInitiated(false);
              break;
              
            case 'cancelled':
              setPollingStatus('Payment cancelled');
              toast.warning('Payment was cancelled');
              setPaymentInitiated(false);
              break;
              
            case 'timeout':
              setPollingStatus('Verification timed out');
              toast.warning(
                'Payment verification timed out. Please check your order status or contact support.',
                { autoClose: 8000 }
              );
              setPaymentInitiated(false);
              break;
              
            default:
              setPollingStatus(`Checking payment status... (${status})`);
          }
        },
        24,  // Max 24 attempts (2 minutes)
        5000 // Check every 5 seconds
      );
      
      setStopPolling(() => stopFn);
    }
  };

  const handleCancelPayment = () => {
    if (stopPolling) {
      stopPolling();
    }
    setPaymentInitiated(false);
    setPollingStatus('');
    toast.info('Payment cancelled');
  };

  return (
    <div className="mpesa-payment-container">
      <h3>Pay with M-Pesa</h3>
      <p className="text-gray-600">Amount: KES {orderTotal}</p>
      
      {!paymentInitiated ? (
        <div className="payment-form">
          <div className="form-group">
            <label htmlFor="phone">M-Pesa Phone Number</label>
            <input
              type="tel"
              id="phone"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-control"
              disabled={isProcessing}
            />
            <small className="text-gray-500">
              Enter your Safaricom number (e.g., 0712345678)
            </small>
          </div>
          
          <button
            onClick={handleMpesaPayment}
            disabled={isProcessing || !phoneNumber}
            className="btn btn-primary w-full"
          >
            {isProcessing ? 'Processing...' : 'Pay with M-Pesa'}
          </button>
        </div>
      ) : (
        <div className="payment-status">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
          
          <p className="text-center text-lg font-medium mb-2">
            {pollingStatus}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal">
              <li>Check your phone for M-Pesa prompt</li>
              <li>Enter your M-Pesa PIN</li>
              <li>Wait for confirmation</li>
            </ol>
          </div>
          
          <button
            onClick={handleCancelPayment}
            className="btn btn-secondary w-full"
          >
            Cancel
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            We're automatically checking your payment status...
          </p>
        </div>
      )}
    </div>
  );
};

export default MpesaPaymentExample;


/**
 * USAGE IN YOUR CHECKOUT COMPONENT:
 * 
 * import MpesaPaymentExample from './MpesaPaymentExample';
 * 
 * // In your checkout page:
 * <MpesaPaymentExample 
 *   orderId={order.id} 
 *   orderTotal={order.total} 
 * />
 */
