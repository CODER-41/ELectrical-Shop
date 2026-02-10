import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { logout } from './authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to refresh token
const refreshToken = async (thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const refreshToken = state.auth.user ? JSON.parse(localStorage.getItem('user'))?.refresh_token : null;
    
    if (refreshToken) {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      
      if (response.data.success) {
        const userData = JSON.parse(localStorage.getItem('user'));
        const newAuthData = {
          user: userData.user,
          token: response.data.data.access_token,
          refresh_token: refreshToken
        };
        localStorage.setItem('user', JSON.stringify(newAuthData));
        
        // Update Redux state by dispatching to auth slice
        thunkAPI.dispatch({ type: 'auth/updateToken', payload: response.data.data.access_token });
        
        return response.data.data.access_token;
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  return null;
};

// Helper function to make authenticated requests with token refresh
const makeAuthenticatedRequest = async (requestFn, thunkAPI) => {
  const state = thunkAPI.getState();
  let token = state.auth.token;
  
  if (!token) {
    return thunkAPI.rejectWithValue('Authentication required');
  }
  
  try {
    return await requestFn(token);
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error === 'Token has expired') {
      // Try to refresh token
      const newToken = await refreshToken(thunkAPI);
      if (newToken) {
        // Retry request with new token
        try {
          return await requestFn(newToken);
        } catch (retryError) {
          throw retryError;
        }
      } else {
        // Refresh failed, logout user
        thunkAPI.dispatch(logout());
        return thunkAPI.rejectWithValue('Session expired. Please log in again.');
      }
    }
    throw error;
  }
};

// Address Actions
export const getAddresses = createAsyncThunk('orders/getAddresses', async (_, thunkAPI) => {
  try {
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.get(`${API_URL}/orders/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch addresses');
  }
});

export const createAddress = createAsyncThunk('orders/createAddress', async (addressData, thunkAPI) => {
  try {
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.post(`${API_URL}/orders/addresses`, addressData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to create address');
  }
});

export const updateAddress = createAsyncThunk('orders/updateAddress', async ({ addressId, addressData }, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth.token;
    
    if (!token) {
      return thunkAPI.rejectWithValue('Authentication required');
    }
    
    const response = await axios.put(`${API_URL}/orders/addresses/${addressId}`, addressData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to update address');
  }
});

export const deleteAddress = createAsyncThunk('orders/deleteAddress', async (addressId, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth.token;
    
    if (!token) {
      return thunkAPI.rejectWithValue('Authentication required');
    }
    
    await axios.delete(`${API_URL}/orders/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to create order');
  }
});

export const getOrders = createAsyncThunk('orders/getOrders', async (_, thunkAPI) => {
  try {
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
  }
});

export const getOrder = createAsyncThunk('orders/getOrder', async (orderId, thunkAPI) => {
  try {
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
  }
});

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async ({ orderId, reason }, thunkAPI) => {
  try {
    const result = await makeAuthenticatedRequest(async (token) => {
      const response = await axios.post(`${API_URL}/orders/${orderId}/cancel`, { reason }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    }, thunkAPI);
    
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to cancel order');
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
        // Handle both array and object responses
        state.orders = Array.isArray(action.payload) ? action.payload : (action.payload?.orders || []);
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
      })

      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setSelectedAddress, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
