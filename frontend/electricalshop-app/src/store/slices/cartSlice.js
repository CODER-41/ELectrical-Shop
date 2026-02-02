import { createSlice } from '@reduxjs/toolkit';

// Get cart from localStorage
const cartFromStorage = localStorage.getItem('cart');
const initialCart = cartFromStorage ? JSON.parse(cartFromStorage) : [];

const initialState = {
  items: initialCart,
  totalItems: initialCart.reduce((sum, item) => sum + item.quantity, 0),
  totalPrice: initialCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if we can add more (stock limit)
        if (existingItem.quantity < product.stock_quantity) {
          existingItem.quantity += 1;
        }
      } else {
        // Add new item
        state.items.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          brand: product.brand?.name,
          category: product.category?.name,
          supplier_id: product.supplier?.id,
          quantity: 1,
        });
      }
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.id === productId);
      
      if (item) {
        // Ensure quantity is within valid range
        if (quantity > 0 && quantity <= item.stock_quantity) {
          item.quantity = quantity;
        } else if (quantity > item.stock_quantity) {
          item.quantity = item.stock_quantity;
        }
      }
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    incrementQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(item => item.id === productId);
      
      if (item && item.quantity < item.stock_quantity) {
        item.quantity += 1;
      }
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    decrementQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(item => item.id === productId);
      
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // Remove item if quantity would be 0
          state.items = state.items.filter(i => i.id !== productId);
        }
      }
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      localStorage.removeItem('cart');
    },
    
    // Sync cart with latest product data (prices, stock)
    syncCartWithProducts: (state, action) => {
      const products = action.payload;
      
      state.items = state.items.map(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          return {
            ...item,
            price: product.price,
            stock_quantity: product.stock_quantity,
            // Adjust quantity if stock decreased
            quantity: Math.min(item.quantity, product.stock_quantity),
          };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      // Recalculate totals
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  syncCartWithProducts,
} = cartSlice.actions;

export default cartSlice.reducer;
