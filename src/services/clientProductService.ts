
import { ProductResponse, ProductService } from './productService';

export interface ProductFilters {
  category?: string;
  subcategory?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
    popularAreas?: string[];
  };
  priceRange?: {
    min?: number;
    max?: number;
    preset?: 'budget' | 'standard' | 'premium' | 'luxury';
  };
  rating?: {
    min?: number;
    includeUnrated?: boolean;
  };
  serviceType?: ('emergency' | 'scheduled' | 'consultation' | 'maintenance')[];
  availability?: 'available' | 'busy' | 'all' | 'available-now' | 'available-today';
  verificationStatus?: {
    verified?: boolean;
    backgroundChecked?: boolean;
    insured?: boolean;
    certified?: boolean;
  };
  responseTime?: {
    max?: number; // in minutes
    priority?: 'instant' | 'fast' | 'standard';
  };
  experienceLevel?: {
    min?: number; // years
    levels?: ('beginner' | 'intermediate' | 'expert' | 'master')[];
  };
  specialFeatures?: {
    available24x7?: boolean;
    emergencyService?: boolean;
    onlineConsultation?: boolean;
    homeVisit?: boolean;
    multiLanguage?: boolean;
    weekendService?: boolean;
  };
  languages?: string[];
  sortBy?: 'price-low' | 'price-high' | 'rating' | 'distance' | 'latest' | 'response-time' | 'experience';
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
    experienceYears?: number;
    completedJobs?: number;
    availability?: 'available' | 'busy' | 'offline';
    languages?: string[];
    specializations?: string[];
    certifications?: string[];
    verificationStatus?: {
      backgroundChecked: boolean;
      insured: boolean;
      certified: boolean;
    };
    features?: {
      available24x7: boolean;
      emergencyService: boolean;
      onlineConsultation: boolean;
      homeVisit: boolean;
      weekendService: boolean;
    };
    lastActiveAt?: string;
    averageResponseTime?: number; // in minutes
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
        // Only show active products (default to true if undefined)
        if (product.isActive === false) return false;
        
        // Category filter - be more flexible with category matching
        if (filters.category && filters.category !== 'all') {
          const productCategory = (product.category || '').toLowerCase();
          const filterCategory = filters.category.toLowerCase();
          if (productCategory !== filterCategory) {
            return false;
          }
        }
        
        // Subcategory filter
        if (filters.subcategory && filters.subcategory.length > 0) {
          const productSubcategory = ((product as any).subcategory || '').toLowerCase();
          if (!filters.subcategory.some(sub => productSubcategory.includes(sub.toLowerCase()))) {
            return false;
          }
        }
        
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
        
        // Rating filter
        if (filters.rating) {
          const productRating = (product as any).rating || 0;
          if (filters.rating.min && productRating < filters.rating.min) {
            if (!filters.rating.includeUnrated || productRating > 0) {
              return false;
            }
          }
        }
        
        // Service type filter
        if (filters.serviceType && filters.serviceType.length > 0) {
          const productServiceType = (product as any).serviceType || 'scheduled';
          if (!filters.serviceType.includes(productServiceType)) {
            return false;
          }
        }
        
        // Availability filter
        if (filters.availability && filters.availability !== 'all') {
          const productAvailability = (product as any).availability || 'available';
          if (filters.availability === 'available-now') {
            if (productAvailability !== 'available') return false;
          } else if (filters.availability === 'available-today') {
            if (productAvailability === 'busy') return false;
          } else if (productAvailability !== filters.availability) {
            return false;
          }
        }
        
        // Verification status filter
        if (filters.verificationStatus) {
          const productVerification = (product as any).verificationStatus || {};
          if (filters.verificationStatus.verified && !productVerification.verified) return false;
          if (filters.verificationStatus.backgroundChecked && !productVerification.backgroundChecked) return false;
          if (filters.verificationStatus.insured && !productVerification.insured) return false;
          if (filters.verificationStatus.certified && !productVerification.certified) return false;
        }
        
        // Response time filter
        if (filters.responseTime) {
          const productResponseTime = (product as any).averageResponseTime || 60; // Default 1 hour
          if (filters.responseTime.max && productResponseTime > filters.responseTime.max) {
            return false;
          }
        }
        
        // Experience level filter
        if (filters.experienceLevel) {
          const productExperience = (product as any).experienceYears || 0;
          if (filters.experienceLevel.min && productExperience < filters.experienceLevel.min) {
            return false;
          }
          if (filters.experienceLevel.levels && filters.experienceLevel.levels.length > 0) {
            let experienceCategory = 'beginner';
            if (productExperience >= 10) experienceCategory = 'master';
            else if (productExperience >= 5) experienceCategory = 'expert';
            else if (productExperience >= 2) experienceCategory = 'intermediate';
            
            if (!filters.experienceLevel.levels.includes(experienceCategory as any)) {
              return false;
            }
          }
        }
        
        // Special features filter
        if (filters.specialFeatures) {
          const productFeatures = (product as any).features || {};
          if (filters.specialFeatures.available24x7 && !productFeatures.available24x7) return false;
          if (filters.specialFeatures.emergencyService && !productFeatures.emergencyService) return false;
          if (filters.specialFeatures.onlineConsultation && !productFeatures.onlineConsultation) return false;
          if (filters.specialFeatures.homeVisit && !productFeatures.homeVisit) return false;
          if (filters.specialFeatures.weekendService && !productFeatures.weekendService) return false;
        }
        
        // Location filter (popular areas)
        if (filters.location?.popularAreas && filters.location.popularAreas.length > 0) {
          const productLocation = (product as any).location || '';
          if (!filters.location.popularAreas.some(area => 
            productLocation.toLowerCase().includes(area.toLowerCase())
          )) {
            return false;
          }
        }
        
        // Languages filter
        if (filters.languages && filters.languages.length > 0) {
          const productLanguages = (product as any).languages || ['English'];
          if (!filters.languages.some(lang => productLanguages.includes(lang))) {
            return false;
          }
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
              ((b as any).rating || 4.0) - ((a as any).rating || 4.0)
            );
            break;
          case 'response-time':
            filteredProducts.sort((a, b) => 
              ((a as any).averageResponseTime || 60) - ((b as any).averageResponseTime || 60)
            );
            break;
          case 'experience':
            filteredProducts.sort((a, b) => 
              ((b as any).experienceYears || 0) - ((a as any).experienceYears || 0)
            );
            break;
          case 'distance':
            // Distance sorting would require actual location calculation
            // For now, sort by random to simulate distance
            filteredProducts.sort(() => Math.random() - 0.5);
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
          if (filters.location && (product as any).location) {
            const productLocation = (product as any).location;
            clientProduct.distance = this.calculateDistance(
              filters.location.latitude,
              filters.location.longitude,
              productLocation.latitude || 0,
              productLocation.longitude || 0
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
        brand: 'CleanPro',
        specifications: {},
        availability: {
          inStock: true,
          quantity: 10
        },
        tags: ['cleaning', 'home-service'],
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
        brand: 'FixIt',
        specifications: {},
        availability: {
          inStock: true,
          quantity: 5
        },
        tags: ['plumbing', 'repair'],
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