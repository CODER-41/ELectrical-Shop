import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, getBrands } from '../store/slices/productsSlice';
import ProductForm from '../components/ProductForm';

const AddProduct = () => {
  const dispatch = useDispatch();
  const { categories, brands } = useSelector((state) => state.products);
  
  useEffect(() => {
    // Fetch categories and brands if not already loaded
    if (categories.length === 0) {
      dispatch(getCategories());
    }
    if (brands.length === 0) {
      dispatch(getBrands());
    }
  }, [dispatch, categories.length, brands.length]);
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to list a new product
        </p>
      </div>
      
      {/* Form */}
      <ProductForm />
    </div>
  );
};

export default AddProduct;
