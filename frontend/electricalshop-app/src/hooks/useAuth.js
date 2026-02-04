import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset, updateProfile, changePassword, updateUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const isAuthenticated = !!user && !!token;

  const handleLogout = async () => {
    // Reset state first to clear any stale success/error states
    dispatch(reset());
    await dispatch(logout());
    toast.success('Logged out successfully');
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
  
  const handleUpdateUser = (userData) => {
    dispatch(updateUser(userData));
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
    updateUser: handleUpdateUser,
  };
};
