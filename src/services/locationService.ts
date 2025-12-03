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
   * Get reverse geocoded address from coordinates using free Nominatim API
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress> {
    try {
      // Add retry mechanism and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Salvatore App/1.0 (location service)'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      
      // Just throw the error, don't return fallback data
      // Let the calling code decide what to do with the error
      throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for places using free Nominatim API
   */
  static async searchPlaces(query: string, location?: LocationCoordinates): Promise<any[]> {
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=en`;
      
      if (location) {
        // Add proximity bias for better results near current location
        url += `&viewbox=${location.longitude-0.1},${location.latitude+0.1},${location.longitude+0.1},${location.latitude-0.1}&bounded=1`;
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Salvatore App/1.0 (location service)'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search places');
      }
      
      const data = await response.json();
      
      // Format results to match expected structure
      return data.map((place: any) => ({
        place_id: place.place_id,
        name: place.name || place.display_name.split(',')[0],
        formatted_address: place.display_name,
        geometry: {
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          }
        }
      }));
    } catch (error) {
      console.warn('Places search failed:', error);
      return [];
    }
  }

  /**
   * Get place details by place ID using Nominatim
   */
  static async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/details.php?osmtype=N&osmid=${placeId}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Salvatore App/1.0 (location service)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get place details');
      }
      
      const data = await response.json();
      
      return {
        place_id: placeId,
        name: data.localname || data.names?.name || 'Unknown Place',
        formatted_address: data.addresstags?.['addr:full'] || 'Address not available',
        geometry: {
          location: {
            lat: parseFloat(data.centroid?.coordinates[1] || '0'),
            lng: parseFloat(data.centroid?.coordinates[0] || '0')
          }
        }
      };
    } catch (error) {
      console.warn('Get place details failed:', error);
      throw error;
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

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }
}
