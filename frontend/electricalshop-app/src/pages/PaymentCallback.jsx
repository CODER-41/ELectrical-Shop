import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-toastify';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyCardPayment } = usePayment();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      
      if (!reference) {
        toast.error('Invalid payment reference');
        setStatus('failed');
        setTimeout(() => navigate('/orders'), 3000);
        return;
      }

      try {
        const result = await verifyCardPayment(reference);
        
        if (result.success) {
          setStatus('success');
          toast.success('Payment successful!');
          setTimeout(() => {
            navigate(`/orders/${result.data.order_id}/confirmation`);
          }, 2000);
        } else {
          setStatus('failed');
          toast.error(result.error || 'Payment verification failed');
          setTimeout(() => navigate('/orders'), 3000);
        }
      } catch (error) {
        setStatus('failed');
        toast.error('Payment verification failed');
        setTimeout(() => navigate('/orders'), 3000);
      }
    };

    verifyPayment();
  }, [searchParams, verifyCardPayment, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="mb-6">
              <svg className="animate-spin h-16 w-16 mx-auto text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your payment has been confirmed.</p>
            <p className="text-sm text-gray-500">Redirecting to order confirmation...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">We couldn't verify your payment.</p>
            <p className="text-sm text-gray-500">Redirecting to orders page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
