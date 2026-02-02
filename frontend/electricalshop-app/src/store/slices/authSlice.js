import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return {
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    };
  }
  return {};
};

// Address Actions
export const getAddresses = createAsyncThunk('orders/getAddresses', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/orders/addresses`, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch addresses');
  }
});

export const createAddress = createAsyncThunk('orders/createAddress', async (addressData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/orders/addresses`, addressData, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to create address');
  }
});

export const updateAddress = createAsyncThunk('orders/updateAddress', async ({ addressId, addressData }, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URL}/orders/addresses/${addressId}`, addressData, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to update address');
  }
});

export const deleteAddress = createAsyncThunk('orders/deleteAddress', async (addressId, thunkAPI) => {
  try {
    await axios.delete(`${API_URL}/orders/addresses/${addressId}`, getAuthHeaders());
    return addressId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to delete address');
  }
});

// Delivery Zones
export const getDeliveryZones = createAsyncThunk('orders/getDeliveryZones', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/orders/delivery-zones`);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch delivery zones');
  }
});

export const calculateDeliveryFee = createAsyncThunk('orders/calculateDeliveryFee', async (county, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/orders/delivery-zones/calculate`, { county });
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Delivery not available for this location');
  }
});

// Order Actions
export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/orders`, orderData, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to create order');
  }
});

export const getOrders = createAsyncThunk('orders/getOrders', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/orders`, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
  }
});

export const getOrder = createAsyncThunk('orders/getOrder', async (orderId, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${orderId}`, getAuthHeaders());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
  }
});

const initialState = {
  addresses: [],
  deliveryZones: [],
  selectedAddress: null,
  deliveryFee: null,
  orders: [],
  currentOrder: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Addresses
      .addCase(getAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload;
      })
      .addCase(getAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Create Address
      .addCase(createAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.addresses.push(action.payload);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update Address
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
      })
      
      // Delete Address
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
      })
      
      // Get Delivery Zones
      .addCase(getDeliveryZones.fulfilled, (state, action) => {
        state.deliveryZones = action.payload;
      })
      
      // Calculate Delivery Fee
      .addCase(calculateDeliveryFee.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(calculateDeliveryFee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveryFee = action.payload;
      })
      .addCase(calculateDeliveryFee.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.deliveryFee = null;
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get Orders
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get Order
      .addCase(getOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setSelectedAddress, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
