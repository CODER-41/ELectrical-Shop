import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

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
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

// Supplier Pages
import SupplierDashboard from './pages/Supplier/SupplierDashboard';
import SupplierOrders from './pages/Supplier/SupplierOrders';
import SupplierAnalytics from './pages/Supplier/SupplierAnalytics';
import SupplierPayouts from './pages/Supplier/SupplierPayouts';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminReturns from './pages/Admin/AdminReturns';
import AdminPayouts from './pages/Admin/AdminPayouts';
import AdminDeliveryZones from './pages/Admin/AdminDeliveryZones';
import AdminCategories from './pages/Admin/AdminCategories';

// Returns Pages
import RequestReturn from './pages/Returns/RequestReturn';
import MyReturns from './pages/Returns/MyReturns';
import ReturnDetail from './pages/Returns/ReturnDetail';

import { NotFound } from './pages/Placeholders';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Routes with Layout */}
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
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
                <ProtectedRoute allowedRoles={['customer']}>
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
                  <AdminReturns />
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
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin', 'product_manager']}>
                  <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">Product Management</h1>
                    <p className="mt-4 text-gray-600">Product management coming soon</p>
                  </div>
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
