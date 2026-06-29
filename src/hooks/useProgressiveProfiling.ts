import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { usePlatform } from './usePlatform';
import {
  setProfilingRequired,
  resetProfiling,
  setProfilingComplete,
} from '../store/slices/progressiveProfilingSlice';

/**
 * Hook for managing progressive profiling state and logic
 */
export const useProgressiveProfiling = () => {
  const dispatch = useAppDispatch();
  const profiling = useAppSelector((state) => state.profiling);
  const auth = useAppSelector((state) => state.auth);
  const { isNative } = usePlatform();

  // Determine if profiling is required
  const isProfilingRequired = useMemo(() => {
    const isSellerRole = auth.user?.role === 'seller';

    // Required only for authenticated seller/service provider accounts
    // that have not completed profiling yet.
    if (!auth.isAuthenticated || profiling.profilingComplete || !isSellerRole) return false;

    // Check phone
    if (!profiling.phoneVerified) return true;
    // Check username
    if (!profiling.username || profiling.username.length < 3) return true;
    // Check sectors/services
    if (!profiling.selectedSectors || profiling.selectedSectors.length === 0) return true;
    // All required steps are done
    return false;
  }, [auth.isAuthenticated, auth.user?.role, profiling.profilingComplete, profiling.phoneVerified, profiling.username, profiling.selectedSectors]);

  // Handle requirement check
  const checkProfilingRequired = useCallback(
    (isRequired: boolean) => {
      dispatch(setProfilingRequired(isRequired));
    },
    [dispatch]
  );

  // Handle profiling reset
  const reset = useCallback(() => {
    dispatch(resetProfiling());
  }, [dispatch]);

  // Handle completion
  const markComplete = useCallback(() => {
    dispatch(setProfilingComplete(true));
  }, [dispatch]);

  return {
    ...profiling,
    isProfilingRequired,
    checkProfilingRequired,
    reset,
    markComplete,
  };
};
