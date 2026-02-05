import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

// Get user from localStorage
const storedData = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: storedData?.user || null,
  token: storedData?.token || storedData?.access_token || null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Register user
export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    // Backend returns { success: true, data: {...}, message: '...' }
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Login user
export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    // Backend returns { success: true, data: { access_token, refresh_token, user }, message: '...' }
    if (response.data.success && response.data.data) {
      const authData = {
        user: response.data.data.user,
        token: response.data.data.access_token,
        refresh_token: response.data.data.refresh_token
      };
      localStorage.setItem('user', JSON.stringify(authData));
      return authData;
    }
    return thunkAPI.rejectWithValue('Login failed');
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Logout user
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth.token;

    if (token) {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    // Ignore logout errors
  } finally {
    localStorage.removeItem('user');
  }
});

// Update profile
export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth.token;
    
    const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const updatedUser = { ...state.auth.user, profile: response.data.data };
      const authData = {
        user: updatedUser,
        token: state.auth.token
      };
      localStorage.setItem('user', JSON.stringify(authData));
      return updatedUser;
    }
    return thunkAPI.rejectWithValue('Profile update failed');
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Change password
export const changePassword = createAsyncThunk('auth/changePassword', async ({ currentPassword, newPassword }, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth.token;
    
    const response = await axios.put(`${API_URL}/auth/change-password`, {
      current_password: currentPassword,
      new_password: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isSuccess = true;
      state.isError = false;
      state.message = '';
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateToken: (state, action) => {
      state.token = action.payload;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      const authData = {
        user: action.payload,
        token: state.token
      };
      localStorage.setItem('user', JSON.stringify(authData));
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Don't set user on register - they need to login after registration
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isSuccess = false;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setCredentials, updateToken, updateUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
