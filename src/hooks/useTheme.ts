import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setTheme,
  toggleTheme,
  selectTheme,
  selectIsDarkMode,
} from '../store/slices/themeSlice';
import { useMemo, useCallback } from 'react';
import { Theme } from '../types/theme';

// Custom hook that provides theme functionality using Redux
export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const isDarkMode = useAppSelector(selectIsDarkMode);

  const updateTheme = useCallback((newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  }, [dispatch]);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  return useMemo(() => ({
    theme,
    isDarkMode,
    setTheme: updateTheme,
    toggleTheme: handleToggleTheme,
  }), [
    theme,
    isDarkMode,
    updateTheme,
    handleToggleTheme,
  ]);
};