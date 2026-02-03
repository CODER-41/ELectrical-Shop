import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { logout, reset, updateProfile, changePassword } from '../store/slices/authSlice';

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
  
  const handleUpdateProfile = async (profileData) => {
    return dispatch(updateProfile(profileData)).unwrap();
  };
  
  const handleChangePassword = async (currentPassword, newPassword) => {
    return dispatch(changePassword({ currentPassword, newPassword })).unwrap();
  };
  
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isError,
    isSuccess,
    message,
    logout: handleLogout,
    resetAuthState,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
  };
};
