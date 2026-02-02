import { Link } from 'react-router-dom';  
import { useAuth} from '../hooks/useAuth';
import {useSelector } from 'react-redux';

const Header = () => {
  const { isAuthenticated, user, handleLogout } = useAuth();
  const { totalItems } = useSelector((state) => state.cart);
  
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <img 
                src="/elogo.png" 
                alt="Electronics Shop Logo" 
                className="w-16 h-16 mr-3 rounded-full"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-green-800 transition-all duration-200">
                Electronics Shop
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link
              to="/about"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
            >
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border border-blue-200">
                  <span className="text-sm text-blue-800 font-medium">
                    Welcome, <strong>{user?.profile?.first_name || user?.profile?.business_name || user?.email}</strong>
                  </span>
                </div>
                
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/products"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Products
                    </Link>
                    <Link
                      to="/orders"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/cart"
                      className="relative text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50 group"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
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
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/supplier/products"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      My Products
                    </Link>
                    <Link
                      to="/supplier/orders"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Orders
                    </Link>
                  </>
                )}
                
                {(user?.role === 'admin' || user?.role?.includes('manager') || user?.role === 'support') && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/products"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Products
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                    >
                      Orders
                    </Link>
                  </>
                )}
                
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                >
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/products"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                >
                  Products
                </Link>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
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

