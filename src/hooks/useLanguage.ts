import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setLanguage,
  selectLanguage,
  Language,
} from '../store/slices/languageSlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides language functionality using Redux
export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);

  const updateLanguage = useCallback((newLanguage: Language) => {
    dispatch(setLanguage(newLanguage));
  }, [dispatch]);

  return useMemo(() => ({
    language,
    setLanguage: updateLanguage,
  }), [
    language,
    updateLanguage,
  ]);
};