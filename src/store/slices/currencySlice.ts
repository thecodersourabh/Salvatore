import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export type CurrencyCode = 'USD' | 'INR';

interface CurrencyState {
  currency: CurrencyCode;
}

const initialState: CurrencyState = {
  currency: 'INR',
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<CurrencyCode>) => {
      state.currency = action.payload;
    },
  },
});

// Helper function to format currency (kept outside of Redux for purity)
export const formatCurrencyValue = (amount: number, currency: CurrencyCode): string => {
  try {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR', 
        maximumFractionDigits: 2 
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 2 
    }).format(amount);
  } catch (e) {
    // fallback simple
    return currency === 'INR' ? `₹${amount}` : `$${amount}`;
  }
};

// Persist configuration for currency
const currencyPersistConfig = {
  key: 'currency',
  version: 1,
  storage,
};

export const { setCurrency } = currencySlice.actions;

// Selectors with proper typing
export const selectCurrency = (state: { currency: CurrencyState }) => state.currency?.currency || 'INR';
export const selectFormattedCurrency = (amount: number) => (state: { currency: CurrencyState }) => 
  formatCurrencyValue(amount, state.currency?.currency || 'INR');

export default persistReducer(currencyPersistConfig, currencySlice.reducer);