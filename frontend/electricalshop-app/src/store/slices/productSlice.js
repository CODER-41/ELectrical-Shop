import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  brands: [],
  pagination: null,
  filters: {
    category: null,
    brand: null,
    search: '',
    min_price: null,
    max_price: null,
    condition: null,
    in_stock: false,
    sort_by: 'newest'
  },
  isLoading: false,
  isError: false,
  message: '',
};

// Get all products with filters
export const getProducts = createAsyncThunk(
  'products/getAll',
  async (params, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page);
      if (params?.per_page) queryParams.append('per_page', params.per_page);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.brand) queryParams.append('brand', params.brand);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.min_price) queryParams.append('min_price', params.min_price);
      if (params?.max_price) queryParams.append('max_price', params.max_price);
      if (params?.condition) queryParams.append('condition', params.condition);
      if (params?.in_stock) queryParams.append('in_stock', params.in_stock);
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
      
      const response = await axios.get(`${API_URL}/products?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch products';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single product by ID
export const getProduct = createAsyncThunk(
  'products/getById',
  async (productId, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/products/${productId}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single product by slug
export const getProductBySlug = createAsyncThunk(
  'products/getBySlug',
  async (slug, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/products/slug/${slug}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all categories
export const getCategories = createAsyncThunk(
  'products/getCategories',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/products/categories`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch categories';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all brands
export const getBrands = createAsyncThunk(
  'products/getBrands',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/products/brands`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch brands';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create product (Supplier only)
export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, thunkAPI) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/products`,
        productData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to create product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ productId, productData }, thunkAPI) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.put(
        `${API_URL}/products/${productId}`,
        productData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to update product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (productId, thunkAPI) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(
        `${API_URL}/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return { productId, ...response.data };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to delete product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get products
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data.products;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single product
      .addCase(getProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.data;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get product by slug
      .addCase(getProductBySlug.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProductBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.data;
      })
      .addCase(getProductBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get categories
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload.data;
      })
      // Get brands
      .addCase(getBrands.fulfilled, (state, action) => {
        state.brands = action.payload.data;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.unshift(action.payload.data);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.data.id);
        if (index !== -1) {
          state.products[index] = action.payload.data;
        }
        if (state.currentProduct?.id === action.payload.data.id) {
          state.currentProduct = action.payload.data;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter(p => p.id !== action.payload.productId);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setFilters, clearFilters, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
