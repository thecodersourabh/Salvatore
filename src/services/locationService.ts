import { Capacitor } from '@capacitor/core';

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  asked: boolean;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationAddress {
  city: string;
  state: string;
  country: string;
  fullAddress?: string;
}

export interface LocationData extends LocationCoordinates {
  address?: LocationAddress;
}

export class LocationService {
  /**
   * Request location permissions from the user
   */
  static async requestPermissions(): Promise<LocationPermissionStatus> {
    if (Capacitor.isNativePlatform()) {
      try {
        // For Capacitor apps, we can use the Geolocation plugin
        const { Geolocation } = await import('@capacitor/geolocation');
        const permissions = await Geolocation.requestPermissions();
        
        return {
          granted: permissions.location === 'granted',
          denied: permissions.location === 'denied',
          asked: true
        };
      } catch (error) {
        console.warn('Location permissions not available or plugin not installed:', error);
        // Fallback to web API
        return this.requestWebPermissions();
      }
    } else {
      // For web platforms
      return this.requestWebPermissions();
    }
  }

  /**
   * Check current location permission status
   */
  static async checkPermissions(): Promise<LocationPermissionStatus> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const permissions = await Geolocation.checkPermissions();
        
        return {
          granted: permissions.location === 'granted',
          denied: permissions.location === 'denied',
          asked: permissions.location !== 'prompt'
        };
      } catch (error) {
        console.warn('Location permissions check not available:', error);
        return { granted: false, denied: false, asked: false };
      }
    } else {
      // For web, check if geolocation is available
      return {
        granted: 'geolocation' in navigator,
        denied: false,
        asked: true
      };
    }
  }

  /**
   * Get current location coordinates
   */
  static async getCurrentLocation(): Promise<LocationCoordinates> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (error) {
        throw new Error(`Failed to get location: ${error}`);
      }
    } else {
      // Web fallback
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            reject(new Error(`Location error: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
    }
  }

  /**
   * Get reverse geocoded address from coordinates
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress> {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }
      
      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data found for these coordinates');
      }
      
      const address = data.address;
      
      return {
        city: address.city || address.town || address.village || address.municipality || 'Unknown City',
        state: address.state || address.province || address.region || 'Unknown State',
        country: address.country || 'Unknown Country',
        fullAddress: data.display_name || ''
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      // Return fallback values
      return {
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'Unknown Country',
        fullAddress: 'Address lookup failed'
      };
    }
  }

  /**
   * Get current location with address information
   */
  static async getCurrentLocationWithAddress(): Promise<LocationData> {
    try {
      const coordinates = await this.getCurrentLocation();
      const address = await this.reverseGeocode(coordinates.latitude, coordinates.longitude);
      
      return {
        ...coordinates,
        address
      };
    } catch (error) {
      throw new Error(`Failed to get location with address: ${error}`);
    }
  }

  /**
   * Request web permissions (fallback)
   */
  private static async requestWebPermissions(): Promise<LocationPermissionStatus> {
    try {
      // Try to get location to trigger permission request
      await this.getCurrentLocation();
      return { granted: true, denied: false, asked: true };
    } catch (error) {
      return { granted: false, denied: true, asked: true };
    }
  }
}
