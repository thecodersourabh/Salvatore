import { api } from './api';
import { ProductResponse, ProductService } from './productService';

export interface ProductFilters {
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  serviceType?: string;
  availability?: 'available' | 'busy' | 'all';
  sortBy?: 'price-low' | 'price-high' | 'rating' | 'distance' | 'latest';
  limit?: number;
  offset?: number;
  searchQuery?: string;
}

export interface ClientProductResponse extends ProductResponse {
  distance?: number;
  providerInfo?: {
    name: string;
    rating: number;
    reviewCount: number;
    responseTime: string;
    verified: boolean;
  };
}

export interface ProductsResponse {
  products: ClientProductResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: ProductFilters;
}

export class ClientProductService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: Map<string, { data: ProductsResponse; timestamp: number }> = new Map();

  /**
   * Get all products with filters for client marketplace view
   */
  static async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const cacheKey = JSON.stringify(filters);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Use the existing ProductService to get all products
      const allProducts = await ProductService.getAllProducts();
      
      // Apply client-side filtering for now (can be moved to backend later)
      let filteredProducts = allProducts.filter(product => {
        // Only show active products
        if (!product.isActive) return false;
        
        // Category filter
        if (filters.category && product.category !== filters.category) return false;
        
        // Search query filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!product.name.toLowerCase().includes(query) && 
              !product.description?.toLowerCase().includes(query) &&
              !product.category?.toLowerCase().includes(query)) {
            return false;
          }
        }
        
        // Price range filter
        if (filters.priceRange) {
          if (filters.priceRange.min && product.price < filters.priceRange.min) return false;
          if (filters.priceRange.max && product.price > filters.priceRange.max) return false;
        }
        
        return true;
      });
      
      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
          case 'latest':
            filteredProducts.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            break;
          case 'rating':
            filteredProducts.sort((a, b) => 
              (b as any).rating - (a as any).rating || 4.5 - 4.0
            );
            break;
        }
      }
      
      // Apply pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      // Transform products and add client-specific data
      const transformedProducts: ClientProductResponse[] = await Promise.all(
        paginatedProducts.map(async (product) => {
          const clientProduct: ClientProductResponse = {
            ...product,
            providerInfo: {
              name: product.createdBy || 'Unknown Provider',
              rating: this.generateRandomRating(), // In real app, fetch from reviews service
              reviewCount: Math.floor(Math.random() * 100),
              responseTime: this.generateResponseTime(),
              verified: Math.random() > 0.3 // 70% verified
            }
          };

          // Calculate distance if location provided
          if (filters.location && product.location) {
            clientProduct.distance = this.calculateDistance(
              filters.location.latitude,
              filters.location.longitude,
              product.location.latitude || 0,
              product.location.longitude || 0
            );
          }

          return clientProduct;
        })
      );

      const result: ProductsResponse = {
        products: transformedProducts,
        total: filteredProducts.length,
        page: Math.floor((offset || 0) / (limit || 20)) + 1,
        limit: limit || 20,
        hasMore: (offset || 0) + (limit || 20) < filteredProducts.length,
        filters
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      
      // Return fallback data
      return {
        products: this.getFallbackProducts(filters),
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
        filters
      };
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, category });
  }

  /**
   * Search products by query
   */
  static async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, searchQuery: query });
  }

  /**
   * Get nearby products based on location
   */
  static async getNearbyProducts(
    latitude: number, 
    longitude: number, 
    radius: number = 10,
    filters: ProductFilters = {}
  ): Promise<ProductsResponse> {
    return this.getProducts({
      ...filters,
      location: { latitude, longitude, radius },
      sortBy: 'distance'
    });
  }

  /**
   * Get popular/trending products
   */
  static async getPopularProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, sortBy: 'rating', limit: 10 });
  }

  /**
   * Get recent products
   */
  static async getRecentProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, sortBy: 'latest', limit: 8 });
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get API URL
   */
  private static getApiUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

  /**
   * Generate random rating for demo purposes
   */
  private static generateRandomRating(): number {
    return parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
  }

  /**
   * Generate response time for demo purposes
   */
  private static generateResponseTime(): string {
    const times = ['5 mins', '15 mins', '30 mins', '1 hour', '2 hours', '1 day'];
    return times[Math.floor(Math.random() * times.length)];
  }

  /**
   * Fallback products for offline/error scenarios
   */
  private static getFallbackProducts(filters: ProductFilters): ClientProductResponse[] {
    const fallbackData: ClientProductResponse[] = [
      {
        id: 'fallback-1',
        productId: 'fallback-1',
        name: 'Home Cleaning Service',
        description: 'Professional home cleaning with eco-friendly products',
        price: 2500,
        currency: 'INR',
        category: 'home-services',
        isActive: true,
        createdBy: 'CleanPro Services',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
        providerInfo: {
          name: 'CleanPro Services',
          rating: 4.5,
          reviewCount: 85,
          responseTime: '15 mins',
          verified: true
        }
      },
      {
        id: 'fallback-2',
        productId: 'fallback-2',
        name: 'Plumbing Repair',
        description: 'Emergency plumbing repairs and maintenance',
        price: 1500,
        currency: 'INR',
        category: 'home-services',
        isActive: true,
        createdBy: 'FixIt Plumbers',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
        providerInfo: {
          name: 'FixIt Plumbers',
          rating: 4.2,
          reviewCount: 67,
          responseTime: '30 mins',
          verified: true
        }
      }
    ];

    // Filter fallback data based on filters
    if (filters.category) {
      return fallbackData.filter(product => product.category === filters.category);
    }
    
    return fallbackData;
  }
}