import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setCredentials } from '../store/slices/authSlice';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      // Get parameters from URL
      const error = searchParams.get('error');
      const accessToken = searchParams.get('access_token');
      const userId = searchParams.get('user_id');
      const success = searchParams.get('success');

      console.log('Callback params:', { error, accessToken: !!accessToken, userId, success });

      // Handle OAuth errors
      if (error) {
        console.error('OAuth error:', error);
        toast.error(`Google authentication failed: ${error}`);
        navigate('/login', { replace: true });
        return;
      }

      // Handle successful backend redirect with tokens
      if (accessToken && userId) {
        try {
          setStatus('Verifying credentials...');
          console.log('Verifying credentials with token');

          // Fetch user data using the access token
          const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Auth/me response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth/me failed:', errorText);
            throw new Error('Failed to verify credentials');
          }

          const data = await response.json();
          console.log('User data received:', data);

          if (!data.success || !data.data) {
            throw new Error('Invalid user data received');
          }

          // Store credentials in Redux
          dispatch(setCredentials({
            user: data.data,
            token: accessToken
          }));

          toast.success('Google authentication successful!');

          // Redirect based on user role
          const role = data.data.role;
          let redirectPath = '/';

          if (role === 'supplier') {
            redirectPath = '/supplier/dashboard';
          } else if (role === 'admin' || role === 'product_manager' || role === 'finance_admin' || role === 'support_admin') {
            redirectPath = '/admin/dashboard';
          }

          navigate(redirectPath, { replace: true });

        } catch (error) {
          console.error('Authentication error:', error);
          toast.error('Authentication failed. Please try again.');
          navigate('/login', { replace: true });
        }
        return;
      }

      // No valid parameters
      console.log('No valid parameters found');
      toast.error('Authentication failed: No credentials received');
      navigate('/login', { replace: true });
    };

    // Small delay to ensure URL parameters are loaded
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-lg shadow-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Google Authentication</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
