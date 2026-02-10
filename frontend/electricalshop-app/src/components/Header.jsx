import { Link } from 'react-router-dom';  
import { useAuth} from '../hooks/useAuth';
import {useSelector } from 'react-redux';
import { useState } from 'react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useSelector((state) => state.cart);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <img 
                src="/elogo.png" 
                alt="Electronics Shop Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mr-2 sm:mr-3 rounded-full"
              />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent group-hover:from-black group-hover:to-black transition-all duration-200">
                <span className="hidden sm:inline">Electronics Shop</span>
                <span className="sm:hidden">E-Shop</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              to="/"
              className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            >
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="hidden xl:flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border border-blue-200">
                  <span className="text-sm text-blue-800 font-medium">
                    Welcome, <strong>{user?.profile?.first_name || user?.profile?.business_name || user?.email}</strong>
                  </span>
                </div>
                
                {user?.role === 'customer' && (
                  <>
                    <Link to="/products" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Products</Link>
                    <Link to="/orders" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Orders</Link>
                    <Link to="/cart" className="relative text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">{totalItems}</span>
                      )}
                    </Link>
                  </>
                )}
                
                {user?.role === 'supplier' && (
                  <>
                    <Link to="/supplier/dashboard" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Dashboard</Link>
                    <Link to="/supplier/products" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Products</Link>
                  </>
                )}

                {user?.role === 'delivery_agent' && (
                  <>
                    <Link to="/delivery/dashboard" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Dashboard</Link>
                    <Link to="/delivery/orders" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">My Deliveries</Link>
                  </>
                )}

                {(user?.role === 'admin' || user?.role === 'support_admin') && (
                  <>
                    <Link to="/admin/dashboard" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Dashboard</Link>
                    <Link to="/admin/orders" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Orders</Link>
                    <Link to="/admin/delivery" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Delivery</Link>
                  </>
                )}

                <Link to="/profile" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Profile</Link>
                <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200">Logout</button>
              </>
            ) : (
              <>
                <Link to="/products" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Products</Link>
                <Link to="/login" className="text-orange-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-200">Sign Up</Link>
              </>
            )}
          </div>
          
          {/* Mobile Cart & Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            {isAuthenticated && user?.role === 'customer' && (
              <Link to="/cart" className="relative p-2 text-gray-700 hover:text-green-600 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{totalItems}</span>
                )}
              </Link>
            )}
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
            <Link to="/" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/about" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            
            {isAuthenticated ? (
              <>
                <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 mx-2">
                  <span className="text-sm text-blue-800 font-medium">
                    Welcome, <strong>{user?.profile?.first_name || user?.profile?.business_name || user?.email}</strong>
                  </span>
                </div>
                
                {user?.role === 'customer' && (
                  <>
                    <Link to="/products" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
                    <Link to="/orders" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>My Orders</Link>
                  </>
                )}
                
                {user?.role === 'supplier' && (
                  <>
                    <Link to="/supplier/dashboard" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    <Link to="/supplier/products" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>My Products</Link>
                    <Link to="/supplier/orders" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
                  </>
                )}

                {user?.role === 'delivery_agent' && (
                  <>
                    <Link to="/delivery/dashboard" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    <Link to="/delivery/orders" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>My Deliveries</Link>
                    <Link to="/delivery/payouts" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Payouts</Link>
                  </>
                )}

                {(user?.role === 'admin' || user?.role === 'support_admin' || user?.role?.includes('manager')) && (
                  <>
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/orders" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
                    <Link to="/admin/delivery" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Delivery Management</Link>
                  </>
                )}
                
                <Link to="/profile" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Logout</button>
              </>
            ) : (
              <>
                <Link to="/products" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
                <Link to="/login" className="block px-4 py-2 text-orange-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;