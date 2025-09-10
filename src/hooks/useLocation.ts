import { useState, useEffect } from 'react';
import { LocationService, LocationPermissionStatus, LocationCoordinates, LocationData } from '../services/locationService';

export interface UseLocationReturn {
  permissionStatus: LocationPermissionStatus | null;
  location: LocationCoordinates | null;
  locationData: LocationData | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  getCurrentLocationWithAddress: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await LocationService.checkPermissions();
      setPermissionStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permissions');
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await LocationService.requestPermissions();
      setPermissionStatus(status);
      
      if (status.granted) {
        // Automatically get location after permission is granted
        await getCurrentLocation();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coords = await LocationService.getCurrentLocation();
      setLocation(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationWithAddress = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await LocationService.getCurrentLocationWithAddress();
      setLocationData(data);
      setLocation(data); // Also set the coordinates for backward compatibility
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location with address');
    } finally {
      setLoading(false);
    }
  };

  return {
    permissionStatus,
    location,
    locationData,
    loading,
    error,
    requestPermission,
    getCurrentLocation,
    getCurrentLocationWithAddress
  };
};
