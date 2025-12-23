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
    // Required if:
    // 1. User is authenticated as a seller/service provider
    // 2. Not yet completed
    // 3. Any step (phone, username, sectors) is incomplete
    if (!auth.isAuthenticated || profiling.profilingComplete) return false;

    // Check phone
    if (!profiling.phoneVerified) return true;
    // Check username
    if (!profiling.username || profiling.username.length < 3) return true;
    // Check sectors/services
    if (!profiling.selectedSectors || profiling.selectedSectors.length === 0) return true;
    // All required steps are done
    return false;
  }, [auth.isAuthenticated, profiling.profilingComplete, profiling.phoneVerified, profiling.username, profiling.selectedSectors]);

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
