import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUpload from '../components/ImageUpload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    price: '',
    stock_quantity: '',
    warranty_period_months: '',
    short_description: '',
    long_description: '',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const userToken = JSON.parse(localStorage.getItem('user'))?.token;

      // Fetch product, categories, and brands in parallel
      const [productRes, categoriesRes, brandsRes] = await Promise.all([
        axios.get(`${API_URL}/supplier/products/${id}`, {
          headers: { Authorization: `Bearer ${userToken}` }
        }),
        axios.get(`${API_URL}/products/categories`),
        axios.get(`${API_URL}/products/brands`)
      ]);

      const productData = productRes.data.data;
      setProduct(productData);
      setCategories(categoriesRes.data.data || []);
      setBrands(brandsRes.data.data || []);

      // Populate form
      setFormData({
        name: productData.name || '',
        category_id: productData.category?.id || '',
        brand_id: productData.brand?.id || '',
        price: productData.price || '',
        stock_quantity: productData.stock_quantity || '',
        warranty_period_months: productData.warranty_period_months || '',
        short_description: productData.short_description || '',
        long_description: productData.long_description || '',
        image_url: productData.image_url || '',
        is_active: productData.is_active ?? true,
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load product');
      navigate('/supplier/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const userToken = JSON.parse(localStorage.getItem('user'))?.token;

      await axios.put(
        `${API_URL}/supplier/products/${id}`,
        {
          ...formData,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          warranty_period_months: parseInt(formData.warranty_period_months),
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      toast.success('Product updated successfully');
      navigate('/supplier/products');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/supplier/products" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/supplier/products" className="text-primary hover:underline mb-2 inline-block">
          &larr; Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-gray-600">
          Update the details for: <strong>{product.name}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          {/* Basic Info */}
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          {/* Pricing & Stock */}
          <h2 className="text-lg font-semibold mb-4">Pricing & Stock</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (KES) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty (Months) *
              </label>
              <input
                type="number"
                name="warranty_period_months"
                value={formData.warranty_period_months}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          {/* Description */}
          <h2 className="text-lg font-semibold mb-4">Description</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description * <span className="text-gray-500">(max 200 characters)</span>
              </label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Description *
              </label>
              <textarea
                name="long_description"
                value={formData.long_description}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          {/* Image & Status */}
          <h2 className="text-lg font-semibold mb-4">Product Image</h2>

          <div className="space-y-4">
            {/* Image URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can provide a direct image URL or upload a file below
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* File Upload */}
            <ImageUpload
              currentImageUrl={formData.image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              maxSize={5 * 1024 * 1024}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
              showPreview={true}
            />
          </div>
        </div>

        <div className="card p-6">
          {/* Status */}
          <h2 className="text-lg font-semibold mb-4">Product Status</h2>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Product is active and visible to customers
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            to="/supplier/products"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary px-6 py-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
