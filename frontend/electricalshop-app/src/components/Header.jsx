import { Link } from 'react-router-dom';  
import { useAuth} from '../hooks/useAuth';
import {useSelector } from 'react-redux';

const Header = () => {
  const { isAuthenticated, user, handleLogout } = useAuth();
  const { totalItems } = useSelector((state) => state.cart);
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">
                Electronics Shop
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, <strong>{user?.profile?.first_name || user?.profile?.business_name || user?.email}</strong>
                </span>
                
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/products"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Products
                    </Link>
                    <Link
                      to="/orders"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/cart"
                      className="relative text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <svg className="w-6 h-6 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                
                {user?.role === 'supplier' && (
                  <>
                    <Link
                      to="/supplier/dashboard"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/supplier/products"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Products
                    </Link>
                    <Link
                      to="/supplier/orders"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Orders
                    </Link>
                  </>
                )}
                
                {(user?.role === 'admin' || user?.role?.includes('manager') || user?.role === 'support') && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/products"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Products
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Orders
                    </Link>
                  </>
                )}
                
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/products"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Products
                </Link>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

