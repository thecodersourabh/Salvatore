import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  designId?: string;
  createdAt: string; // Changed from Date to string for Redux serialization
}

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Omit<WishlistItem, 'createdAt'>>) => {
      const newItem = action.payload;
      const exists = state.items.some(item => item.id === newItem.id);
      
      if (!exists) {
        state.items.push({ ...newItem, createdAt: new Date().toISOString() }); // Convert to ISO string
      }
    },
    
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    clearWishlist: (state) => {
      state.items = [];
    },
    
    updateWishlistItem: (state, action: PayloadAction<{ id: string; updates: Partial<WishlistItem> }>) => {
      const { id, updates } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        Object.assign(item, updates);
      }
    },
  },
});

// Persist configuration for wishlist
const wishlistPersistConfig = {
  key: 'wishlist',
  version: 1,
  storage,
};

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  updateWishlistItem,
} = wishlistSlice.actions;

// Selectors with proper typing and null checks
export const selectWishlistItems = (state: { wishlist: WishlistState }) => state.wishlist?.items || [];
export const selectIsInWishlist = (itemId: string) => (state: { wishlist: WishlistState }) =>
  (state.wishlist?.items || []).some((item: WishlistItem) => item.id === itemId);
export const selectWishlistCount = (state: { wishlist: WishlistState }) => state.wishlist?.items?.length || 0;

export default persistReducer(wishlistPersistConfig, wishlistSlice.reducer);