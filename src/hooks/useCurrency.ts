import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setCurrency,
  selectCurrency,
  formatCurrencyValue,
  CurrencyCode,
} from '../store/slices/currencySlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides currency functionality using Redux
export const useCurrency = () => {
  const dispatch = useAppDispatch();
  const currency = useAppSelector(selectCurrency);

  const updateCurrency = useCallback((newCurrency: CurrencyCode) => {
    dispatch(setCurrency(newCurrency));
  }, [dispatch]);

  const formatCurrency = useCallback((amount: number) => {
    return formatCurrencyValue(amount, currency);
  }, [currency]);

  return useMemo(() => ({
    currency,
    setCurrency: updateCurrency,
    formatCurrency,
  }), [
    currency,
    updateCurrency,
    formatCurrency,
  ]);
};