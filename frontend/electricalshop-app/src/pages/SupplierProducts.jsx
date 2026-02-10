import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { toast } from 'react-toastify';

const SupplierProducts = () => {
  const { token } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/supplier/products');
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await api.patch(
        `/supplier/products/${productId}/status`,
        { is_active: !currentStatus }
      );
      toast.success(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update product status');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="mt-2 text-gray-600">Manage your product listings</p>
        </div>
        <Link
          to="/add-product"
          className="mt-4 sm:mt-0 bg-gradient-to-r from-orange-600 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all inline-flex items-center font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-gray-500">Get started by adding your first product.</p>
          <Link to="/add-product" className="mt-4 inline-block bg-gradient-to-r from-orange-600 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all font-medium">
            Add Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card overflow-hidden">
              {/* Product Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category?.name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    product.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg text-sm font-bold">{formatPrice(product.price)}</span>
                  <p className="text-sm text-gray-500">
                    Stock: <span className={product.stock_quantity <= 10 ? 'text-orange-600 font-semibold' : ''}>
                      {product.stock_quantity}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/supplier/products/edit/${product.id}`}
                    className="flex-1 border border-orange-600 text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-sm font-medium text-center transition-all"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(product.id, product.is_active)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      product.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white hover:from-orange-700 hover:to-yellow-700'
                    }`}
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-600">
            Total Products: <strong>{products.length}</strong>
          </span>
          <span className="text-gray-600">
            Active: <strong className="text-green-600">{products.filter(p => p.is_active).length}</strong>
          </span>
          <span className="text-gray-600">
            Inactive: <strong className="text-red-600">{products.filter(p => !p.is_active).length}</strong>
          </span>
          <span className="text-gray-600">
            Low Stock: <strong className="text-orange-600">{products.filter(p => p.stock_quantity <= 10).length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SupplierProducts;
