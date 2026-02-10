import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return {
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    };
  }
  return {};
};

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  /**
   * Initiate M-Pesa STK Push payment
   */
  const initiateMpesaPayment = async (orderId, phoneNumber) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/mpesa/initiate`,
        { order_id: orderId, phone_number: phoneNumber },
        getAuthHeaders()
      );
      
      setPaymentStatus('pending');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Payment initiation failed';
      toast.error(errorMessage);
      setPaymentStatus('failed');
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Initiate Paystack card payment
   */
  const initiateCardPayment = async (orderId) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/card/initiate`,
        { order_id: orderId },
        getAuthHeaders()
      );
      
      setPaymentStatus('pending');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Card payment initiation failed';
      toast.error(errorMessage);
      setPaymentStatus('failed');
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Verify Paystack payment after redirect
   */
  const verifyCardPayment = async (reference) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/card/verify`,
        { reference },
        getAuthHeaders()
      );
      
      setPaymentStatus('completed');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Payment verification failed';
      toast.error(errorMessage);
      setPaymentStatus('failed');
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Check payment status
   */
  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(
        `${API_URL}/payments/status/${orderId}`,
        getAuthHeaders()
      );
      
      const status = response.data.data.payment_status;
      setPaymentStatus(status);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check payment status'
      };
    }
  };
  
  /**
   * Query M-Pesa payment status (actively checks with M-Pesa API)
   */
  const queryMpesaStatus = async (orderId) => {
    try {
      const response = await axios.post(
        `${API_URL}/payments/mpesa/query`,
        { order_id: orderId },
        getAuthHeaders()
      );
      
      const status = response.data.data.status;
      setPaymentStatus(status);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to query M-Pesa status'
      };
    }
  };
  
  /**
   * Poll M-Pesa payment status until completed or timeout
   * @param {string} orderId - Order ID to check
   * @param {function} onStatusChange - Callback when status changes
   * @param {number} maxAttempts - Maximum polling attempts (default: 24 = 2 minutes)
   * @param {number} interval - Polling interval in ms (default: 5000 = 5 seconds)
   */
  const pollMpesaStatus = (orderId, onStatusChange, maxAttempts = 24, interval = 5000) => {
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const result = await queryMpesaStatus(orderId);
        
        if (result.success) {
          const status = result.data.status;
          
          // Notify callback
          if (onStatusChange) {
            onStatusChange(status, result.data);
          }
          
          // Stop polling if completed or failed
          if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            clearInterval(pollInterval);
          }
        }
        
        // Stop after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (onStatusChange) {
            onStatusChange('timeout', { message: 'Payment verification timed out' });
          }
        }
      } catch (error) {
        console.error('Error polling M-Pesa status:', error);
      }
    }, interval);
    
    // Return function to stop polling
    return () => clearInterval(pollInterval);
  };
  
  /**
   * Simulate payment (for testing)
   */
  const simulatePayment = async (orderId, success = true) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/simulate`,
        { order_id: orderId, success }
      );
      
      setPaymentStatus(success ? 'completed' : 'failed');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Simulation failed'
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Check if M-Pesa is configured
   */
  const checkMpesaConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments/config`);
      return response.data.data;
    } catch (error) {
      return {
        configured: false,
        error: 'Failed to check M-Pesa configuration'
      };
    }
  };
  
  return {
    isProcessing,
    paymentStatus,
    initiateMpesaPayment,
    initiateCardPayment,
    verifyCardPayment,
    checkPaymentStatus,
    queryMpesaStatus,
    pollMpesaStatus,
    simulatePayment,
    checkMpesaConfig,
    setPaymentStatus
  };
};
