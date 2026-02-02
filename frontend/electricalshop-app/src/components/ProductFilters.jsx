import { useDispatch, useSelector } from 'react-redux';
import { setFilters } from '../store/slices/supplierProductsSlice';

const ProductFilters = () => {
  const dispatch = useDispatch();
  const { categories, brands, filters } = useSelector((state) => state.supplierProducts);

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ ...filters, [filterType]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => handleFilterChange('category', e.target.checked ? category.id : null)}
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Brands</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => handleFilterChange('brand', e.target.checked ? brand.id : null)}
              />
              <span className="text-sm">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Price Range</h4>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100000"
            className="w-full"
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>KSh 0</span>
            <span>KSh 100,000+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;