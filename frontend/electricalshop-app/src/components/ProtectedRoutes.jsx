import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on their actual role
      if (user.role === 'customer') {
        return <Navigate to="/" replace />;
      } else if (user.role === 'supplier') {
        return <Navigate to="/supplier/dashboard" replace />;
      } else {
        return <Navigate to="/admin/dashboard" replace />;
      }
    }
  }
  
  return children;
};

export default ProtectedRoute;
