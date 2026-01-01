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
    // Round to nearest integer and format with no fractional digits
    const sanitizedAmount = Number.isFinite(Number(amount)) ? Math.round(Number(amount)) : 0;
    const formatOptions = { style: 'currency', currency: currency === 'INR' ? 'INR' : 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 } as Intl.NumberFormatOptions;
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', formatOptions).format(sanitizedAmount);
    }
    return new Intl.NumberFormat('en-US', formatOptions).format(sanitizedAmount);
  } catch (e) {
    // fallback simple (no decimals)
    const fallback = (Number.isFinite(Number(amount)) ? Math.round(Number(amount)).toFixed(0) : '0');
    return currency === 'INR' ? `₹${fallback}` : `$${fallback}`;
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