import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  products: [],
  categories: [],
  brands: [],
  filters: {},
  isLoading: false,
  isError: false,
  message: '',
};

export const getProducts = createAsyncThunk('supplierProducts/getProducts', async (params, thunkAPI) => {
  try {
    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createProduct = createAsyncThunk('supplierProducts/createProduct', async (productData, thunkAPI) => {
  try {
    const response = await api.post('/supplier/products', productData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
  }
});

export const updateProduct = createAsyncThunk('supplierProducts/updateProduct', async ({ id, productData }, thunkAPI) => {
  try {
    const response = await api.put(`/supplier/products/${id}`, productData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
  }
});

export const uploadProductImage = createAsyncThunk('supplierProducts/uploadProductImage', async (imageFile, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/uploads/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getCategories = createAsyncThunk('supplierProducts/getCategories', async (_, thunkAPI) => {
  try {
    const response = await api.get('/products/categories');
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getBrands = createAsyncThunk('supplierProducts/getBrands', async (_, thunkAPI) => {
  try {
    const response = await api.get('/products/brands');
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const supplierProductsSlice = createSlice({
  name: 'supplierProducts',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload?.data?.products || [];
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = 'Product created successfully';
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = 'Product updated successfully';
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(uploadProductImage.fulfilled, (state, action) => {
        // Image upload success handled in component
      })
      .addCase(uploadProductImage.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload?.data || [];
      })
      .addCase(getBrands.fulfilled, (state, action) => {
        state.brands = action.payload?.data || [];
      });
  },
});

export const { reset, setFilters } = supplierProductsSlice.actions;
export default supplierProductsSlice.reducer;