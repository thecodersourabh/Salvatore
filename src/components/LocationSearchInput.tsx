import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader, X } from 'lucide-react';

interface LocationSearchProps {
  onLocationSelect?: (location: {latitude: number, longitude: number, address: string}) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const LocationSearchInput: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Enter location",
  initialValue = "",
  className = ""
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-load current location on component mount
  useEffect(() => {
    if (!hasAutoLoaded && !initialValue) {
      getCurrentLocation();
      setHasAutoLoaded(true);
    }
  }, [hasAutoLoaded, initialValue]);

  // Simple free reverse geocoding using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Get human-readable address
      const address = await reverseGeocode(latitude, longitude);
      
      setQuery(address);
      
      if (onLocationSelect) {
        onLocationSelect({
          latitude,
          longitude,
          address
        });
      }
    } catch (error) {
      console.warn('Failed to get current location:', error);
      if (!hasAutoLoaded) {
        // Show error only for manual requests
        setQuery('Location access denied');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearInput = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          
          {query && !isLoading && (
            <button
              onClick={clearInput}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          
          <button
            onClick={() => {
              setHasAutoLoaded(false); // Reset auto-load flag to allow manual refresh
              getCurrentLocation();
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Refresh current location"
            disabled={isLoading}
          >
            <Search className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};