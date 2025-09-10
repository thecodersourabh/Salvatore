import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '../hooks/useLocation';

interface LocationRequestProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void;
  onLocationDenied?: () => void;
  className?: string;
}

export const LocationRequest: React.FC<LocationRequestProps> = ({
  onLocationGranted,
  onLocationDenied,
  className = ''
}) => {
  const { permissionStatus, location, loading, error, requestPermission } = useLocation();

  const handleRequestLocation = async () => {
    await requestPermission();
    
    // Call callbacks based on result
    if (permissionStatus?.granted && location) {
      onLocationGranted?.(location);
    } else if (permissionStatus?.denied) {
      onLocationDenied?.();
    }
  };

  // Don't show on web if geolocation is not supported
  if (!Capacitor.isNativePlatform() && !('geolocation' in navigator)) {
    return null;
  }

  // Don't show if already granted and we have location
  if (permissionStatus?.granted && location) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="text-green-600 mr-2">📍</div>
          <span className="text-sm text-green-800">
            Location access granted! Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-blue-600 mr-2">📍</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Location Access</h3>
            <p className="text-xs text-blue-700">
              {permissionStatus?.denied 
                ? 'Location access was denied. Please enable it in your device settings.'
                : 'Allow location access to find services near you'
              }
            </p>
          </div>
        </div>
        
        {!permissionStatus?.denied && (
          <button
            onClick={handleRequestLocation}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Requesting...' : 'Allow Location'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
};
