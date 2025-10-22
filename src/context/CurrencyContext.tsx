import React, { createContext, useContext, useEffect, useState } from 'react';

export type CurrencyCode = 'USD' | 'INR';

export interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
}

const STORAGE_KEY = 'app_currency';

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'USD' || stored === 'INR') return stored;
    } catch (e) {
      // ignore
    }
    return 'INR';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (e) {
      // ignore
    }
  }, [currency]);

  const setCurrency = (c: CurrencyCode) => setCurrencyState(c);

  const formatCurrency = (amount: number) => {
    try {
      if (currency === 'INR') {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
    } catch (e) {
      // fallback simple
      return currency === 'INR' ? `₹${amount}` : `$${amount}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};

export default CurrencyContext;
