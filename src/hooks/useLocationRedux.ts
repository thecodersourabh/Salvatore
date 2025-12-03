import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { useAuth } from './useAuth';
import { 
  getCurrentLocationWithAddress, 
  getCurrentLocation,
  clearLocation,
  clearError,
  selectLocationData,
  selectCurrentLocation,
  selectLocationLoading,
  selectLocationError,
  selectLocationCity,
  selectPermissionGranted,
  selectLocationCached
} from '../store/slices/locationSlice';

export const useLocationRedux = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useAuth();
  
  // Selectors
  const locationData = useSelector(selectLocationData);
  const currentLocation = useSelector(selectCurrentLocation);
  const loading = useSelector(selectLocationLoading);
  const error = useSelector(selectLocationError);
  const city = useSelector(selectLocationCity);
  const permissionGranted = useSelector(selectPermissionGranted);
  const isCached = useSelector(selectLocationCached);
  
  // Auto-fetch location on first load if authenticated and no location data
  useEffect(() => {
    if (isAuthenticated && !locationData && !loading && !isCached) {
      dispatch(getCurrentLocationWithAddress());
    }
  }, [dispatch, isAuthenticated, locationData, loading, isCached]);

  // Methods
  const requestLocationWithAddress = () => {
    dispatch(getCurrentLocationWithAddress());
  };

  const requestLocation = () => {
    dispatch(getCurrentLocation());
  };

  const clearLocationData = () => {
    dispatch(clearLocation());
  };

  const clearLocationError = () => {
    dispatch(clearError());
  };

  return {
    // Data
    locationData,
    currentLocation,
    city,
    
    // Status
    loading,
    error,
    permissionGranted,
    isCached,
    
    // Methods
    requestLocationWithAddress,
    requestLocation,
    clearLocationData,
    clearLocationError,
  };
};