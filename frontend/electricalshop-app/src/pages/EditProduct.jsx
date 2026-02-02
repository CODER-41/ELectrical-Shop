import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProduct, getCategories, getBrands, clearCurrentProduct } from '../store/slices/productsSlice';
import ProductForm from '../components/ProductForm';

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProduct: product, categories, brands, isLoading } = useSelector(
    (state) => state.products
  );
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Fetch product data
    dispatch(getProduct(id));
    
    // Fetch categories and brands if not already loaded
    if (categories.length === 0) {
      dispatch(getCategories());
    }
    if (brands.length === 0) {
      dispatch(getBrands());
    }
    
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id, categories.length, brands.length]);
  
  // Check if supplier owns this product
  const isOwner = product?.supplier?.id === user?.profile?.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'product_manager';
  
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
  
  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          You don't have permission to edit this product
        </h2>
        <p className="mt-2 text-gray-600">
          You can only edit products that you've created.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-gray-600">
          Update the details for: <strong>{product.name}</strong>
        </p>
      </div>
      
      {/* Form */}
      <ProductForm product={product} isEdit={true} />
    </div>
  );
};

export default EditProduct;
