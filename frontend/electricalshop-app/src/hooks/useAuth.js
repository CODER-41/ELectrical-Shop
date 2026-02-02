import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { logout, reset } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, token, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  const isAuthenticated = !!user && !!token;
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const resetAuthState = () => {
    dispatch(reset());
  };
  
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isError,
    isSuccess,
    message,
    handleLogout,
    resetAuthState,
  };
};
