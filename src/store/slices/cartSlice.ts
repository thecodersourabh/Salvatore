import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  providerId?: string;
  description?: string;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isCartOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const newItem = action.payload;
      
      const existingItem = state.items.find(item => item.id === newItem.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...newItem, quantity: 1 });
      }
      
      state.isCartOpen = true;
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      
      if (quantity < 1) {
        state.items = state.items.filter(item => item.id !== id);
        return;
      }
      
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
      }
    },
    
    clearCart: (state) => {
      state.items = [];
    },
    
    setIsCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
  },
});

// Persist configuration for cart
const cartPersistConfig = {
  key: 'cart',
  version: 1,
  storage,
};

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setIsCartOpen,
} = cartSlice.actions;

// Selectors with proper typing and null checks
export const selectCartItems = (state: { cart: CartState }) => state.cart?.items || [];
export const selectIsCartOpen = (state: { cart: CartState }) => state.cart?.isCartOpen || false;
export const selectCartTotal = (state: { cart: CartState }) => 
  (state.cart?.items || []).reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
export const selectCartItemCount = (state: { cart: CartState }) =>
  (state.cart?.items || []).reduce((count: number, item: CartItem) => count + item.quantity, 0);

export default persistReducer(cartPersistConfig, cartSlice.reducer);