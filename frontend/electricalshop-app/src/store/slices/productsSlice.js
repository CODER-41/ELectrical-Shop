import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  brands: [],
  filters: {},
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

export const getProducts = createAsyncThunk('products/getProducts', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getProductBySlug = createAsyncThunk('products/getProductBySlug', async (slug, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/products/${slug}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getProduct = createAsyncThunk('products/getProduct', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getCategories = createAsyncThunk('products/getCategories', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getBrands = createAsyncThunk('products/getBrands', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/brands`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getProductBySlug.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(getBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
      });
  },
});

export const { reset, clearCurrentProduct, setFilters, clearFilters } = productsSlice.actions;
export default productsSlice.reducer;