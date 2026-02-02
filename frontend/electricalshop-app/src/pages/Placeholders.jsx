// Supplier Dashboard Placeholder
export const SupplierDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Supplier Dashboard</h1>
      <div className="card">
        <p className="text-gray-600">
          Welcome to your supplier dashboard. Product management features coming soon!
        </p>
      </div>
    </div>
  );
};

// Admin Dashboard Placeholder
export const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="card">
        <p className="text-gray-600">
          Welcome to the admin dashboard. Management features coming soon!
        </p>
      </div>
    </div>
  );
};

// Products Page Placeholder
export const ProductsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>
      <div className="card">
        <p className="text-gray-600">
          Product listing coming soon!
        </p>
      </div>
    </div>
  );
};

// Not Found Page
export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <a href="/" className="mt-6 inline-block btn btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
};
