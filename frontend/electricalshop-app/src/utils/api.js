import axios from 'axios';
import { store } from '../store/store';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      store.dispatch({ type: 'auth/clearAuth' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Product API functions
export const productAPI = {
  // Get products with filters
  getProducts: (params = {}) => api.get('/products', { params }),
  
  // Get products by category slug
  getProductsByCategory: (categorySlug, params = {}) => 
    api.get('/products', { params: { ...params, category: categorySlug } }),
  
  // Get single product
  getProduct: (id) => api.get(`/products/${id}`),
  
  // Get product by slug
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),
  
  // Get categories
  getCategories: () => api.get('/products/categories'),
  
  // Get brands
  getBrands: () => api.get('/products/brands'),
};

export default api;