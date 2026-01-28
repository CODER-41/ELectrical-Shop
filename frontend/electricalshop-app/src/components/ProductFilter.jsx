import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, clearFilters } from '../store/slices/productsSlice';

const ProductFilters = () => {
  const dispatch = useDispatch();
  const { categories, brands, filters } = useSelector((state) => state.products);
  
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    brand: filters.brand || '',
    min_price: filters.min_price || '',
    max_price: filters.max_price || '',
    condition: filters.condition || '',
    in_stock: filters.in_stock || false,
  });
  
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const applyFilters = () => {
    const filtersToApply = {};
    
    if (localFilters.category) filtersToApply.category = localFilters.category;
    if (localFilters.brand) filtersToApply.brand = localFilters.brand;
    if (localFilters.min_price) filtersToApply.min_price = parseFloat(localFilters.min_price);
    if (localFilters.max_price) filtersToApply.max_price = parseFloat(localFilters.max_price);
    if (localFilters.condition) filtersToApply.condition = localFilters.condition;
    if (localFilters.in_stock) filtersToApply.in_stock = true;
    
    dispatch(setFilters(filtersToApply));
  };
  
  const handleClearFilters = () => {
    setLocalFilters({
      category: '',
      brand: '',
      min_price: '',
      max_price: '',
      condition: '',
      in_stock: false,
    });
    dispatch(clearFilters());
  };
  
  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-primary hover:text-primary-700"
        >
          Clear All
        </button>
      </div>
      
      {/* Category Filter */}
      <div>
        <label className="form-label">Category</label>
        <select
          value={localFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="input"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Brand Filter */}
      <div>
        <label className="form-label">Brand</label>
        <select
          value={localFilters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          className="input"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Price Range */}
      <div>
        <label className="form-label">Price Range (KES)</label>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min Price"
            value={localFilters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            className="input"
            min="0"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={localFilters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="input"
            min="0"
          />
        </div>
      </div>
      
      {/* Condition Filter */}
      <div>
        <label className="form-label">Condition</label>
        <select
          value={localFilters.condition}
          onChange={(e) => handleFilterChange('condition', e.target.value)}
          className="input"
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
        </select>
      </div>
      
      {/* In Stock Only */}
      <div className="flex items-center">
        <input
          id="in_stock"
          type="checkbox"
          checked={localFilters.in_stock}
          onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="in_stock" className="ml-2 block text-sm text-gray-900">
          In Stock Only
        </label>
      </div>
      
      {/* Apply Button */}
      <button
        onClick={applyFilters}
        className="btn btn-primary w-full"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default ProductFilters;
