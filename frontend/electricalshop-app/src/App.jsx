import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Layouts
import MainLayout from './layouts/MainLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import GoogleCallback from './components/GoogleCallback';
import MaintenancePage from './pages/MaintenancePage';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SupplierProducts from './pages/SupplierProducts';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentVerification from './pages/PaymentVerification';
import PaymentCallback from './pages/PaymentCallback';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import About from './pages/About';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQs from './pages/FAQs';
import ReturnsPolicy from './pages/ReturnsPolicy';
import WarrantyInfo from './pages/WarrantyInfo';
import ContactUs from './pages/ContactUs';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';

// Supplier Pages
import SupplierDashboard from './pages/Supplier/SupplierDashboard';
import SupplierOrders from './pages/Supplier/SupplierOrders';
import SupplierAnalytics from './pages/Supplier/SupplierAnalytics';
import SupplierPayouts from './pages/Supplier/SupplierPayouts';
import SupplierReturns from './pages/Supplier/SupplierReturns';

// Delivery Agent Pages
import DeliveryDashboard from './pages/Delivery/DeliveryDashboard';
import DeliveryOrders from './pages/Delivery/DeliveryOrders';
import DeliveryPayouts from './pages/Delivery/DeliveryPayouts';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminReturns from './pages/Admin/AdminReturns';
import AdminReturnsManagement from './pages/Admin/AdminReturnsManagement';
import AdminPayouts from './pages/Admin/AdminPayouts';
import AdminDeliveryZones from './pages/Admin/AdminDeliveryZones';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminDeliveryManagement from './pages/Admin/AdminDeliveryManagement';
import AdminProductManagement from './pages/Admin/AdminProductManagement';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminAuditLogs from './pages/Admin/AdminAuditLogs';
import AdminFinancialReports from './pages/Admin/AdminFinancialReports';
import AdminNotifications from './pages/Admin/AdminNotifications';
import AdminActivityTimeline from './pages/Admin/AdminActivityTimeline';

// Returns Pages
import RequestReturn from './pages/Returns/RequestReturn';
import MyReturns from './pages/Returns/MyReturns';
import ReturnDetail from './pages/Returns/ReturnDetail';

import { NotFound } from './pages/Placeholders';

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup axios interceptor for maintenance mode
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 503 && error.response?.data?.maintenance_mode) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.role?.toLowerCase() !== 'admin') {
            sessionStorage.setItem('maintenance_mode', 'true');
            setMaintenanceMode(true);
            setIsAdmin(false);
          }
        }
        return Promise.reject(error);
      }
    );

    // Check maintenance mode on mount
    const checkMaintenance = async () => {
      // Check sessionStorage first
      if (sessionStorage.getItem('maintenance_mode') === 'true') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role?.toLowerCase() !== 'admin') {
          setMaintenanceMode(true);
          setIsAdmin(false);
          setLoading(false);
          return;
        } else {
          sessionStorage.removeItem('maintenance_mode');
        }
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
        setMaintenanceMode(false);
        sessionStorage.removeItem('maintenance_mode');
        
        // Check if user is admin
        const token = localStorage.getItem('access_token');
        if (token) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setIsAdmin(user.role?.toLowerCase() === 'admin');
        }
      } catch (error) {
        if (error.response?.status === 503 && error.response?.data?.maintenance_mode) {
          setMaintenanceMode(true);
          
          // Check if user is admin
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setIsAdmin(user.role?.toLowerCase() === 'admin');
        }
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Show maintenance page for non-admin users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (maintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          
          {/* Routes with Layout */}
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faq" element={<FAQs />} />
            <Route path="/returns" element={<ReturnsPolicy />} />
            <Route path="/warranty" element={<WarrantyInfo />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            
            {/* Protected Routes - All Authenticated Users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            {/* Customer Routes */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin', 'order_manager']}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={<Cart />}
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/verify"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <PaymentVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/callback"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <PaymentCallback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId/confirmation"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />
            
            {/* Supplier Routes */}
            <Route
              path="/supplier/dashboard"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/products"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-products"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-product"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/products/new"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/products/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/orders"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/analytics"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/payouts"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierPayouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/returns"
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierReturns />
                </ProtectedRoute>
              }
            />

            {/* Delivery Agent Routes */}
            <Route
              path="/delivery/dashboard"
              element={
                <ProtectedRoute allowedRoles={['delivery_agent']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/orders"
              element={
                <ProtectedRoute allowedRoles={['delivery_agent']}>
                  <DeliveryOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/payouts"
              element={
                <ProtectedRoute allowedRoles={['delivery_agent']}>
                  <DeliveryPayouts />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'product_manager', 'order_manager', 'support']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'order_manager']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'order_manager']}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/returns"
              element={
                <ProtectedRoute allowedRoles={['admin', 'order_manager']}>
                  <AdminReturnsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payouts"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPayouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/delivery-zones"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDeliveryZones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['admin', 'product_manager']}>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/delivery"
              element={
                <ProtectedRoute allowedRoles={['admin', 'support_admin']}>
                  <AdminDeliveryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin', 'product_manager']}>
                  <AdminProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports/financial"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance_admin']}>
                  <AdminFinancialReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminActivityTimeline />
                </ProtectedRoute>
              }
            />
            
            {/* Returns Routes */}
            <Route
              path="/returns"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MyReturns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/returns/:returnId"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <ReturnDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId/items/:itemId/return"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <RequestReturn />
                </ProtectedRoute>
              }
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
