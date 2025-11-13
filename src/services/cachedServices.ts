import { UserService as BaseUserService } from './userService';
import { ProductService as BaseProductService } from './productService';
import { orderService as baseOrderService } from './orderService';
import { 
  CACHE_NAMESPACES, 
  CACHE_TTL,
  cacheData,
  getCachedData,
  invalidateCache 
} from '../utils/appCache';
import { 
  emitProductUpdated, 
  emitProductDeleted, 
  emitProductCreated 
} from '../utils/cacheEvents';
import { User } from '../types/user';
import { ProductResponse } from './productService';
import { OrderStats, OrderListResponse } from '../types/order';
import { UserContext } from './ApiService';

/**
 * Cached service wrappers with automatic caching for better performance
 * These services wrap the base API services and add intelligent caching
 */

export class CachedUserService {
  static async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Try cache first
    const cached = getCachedData<User>(CACHE_NAMESPACES.USER, cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const user = await BaseUserService.getUserByEmail(email);
      
      // Cache result
      if (user) {
        cacheData(CACHE_NAMESPACES.USER, cacheKey, user, CACHE_TTL.LONG);
      }
      
      return user;
    } catch (error) {
      console.error('Cached getUserByEmail failed:', error);
      return null;
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const cacheKey = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Try cache first
    const cached = getCachedData<User>(CACHE_NAMESPACES.USER, cacheKey, 'username');
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const user = await BaseUserService.getUserByUsername(username);
      
      // Cache result
      if (user) {
        cacheData(CACHE_NAMESPACES.USER, cacheKey, user, CACHE_TTL.LONG, 'username');
      }
      
      return user;
    } catch (error) {
      console.error('Cached getUserByUsername failed:', error);
      throw error;
    }
  }

  static async searchUsers(params: { email?: string; username?: string; q?: string }, fields?: string[]): Promise<User[]> {
    const cacheKey = JSON.stringify({ params, fields }).replace(/[^a-z0-9]/gi, '_');
    
    // Try cache first (shorter TTL for search results)
    const cached = getCachedData<User[]>(CACHE_NAMESPACES.USER, cacheKey, 'search');
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const users = await BaseUserService.searchUsers(params, fields);
      
      // Cache result
      cacheData(CACHE_NAMESPACES.USER, cacheKey, users, CACHE_TTL.SHORT, 'search');
      
      return users;
    } catch (error) {
      console.error('Cached searchUsers failed:', error);
      throw error;
    }
  }

  static invalidateUserCache(identifier: string): void {
    invalidateCache(CACHE_NAMESPACES.USER, identifier);
  }
}

export class CachedProductService {
  static async getUserProducts(userId: string): Promise<ProductResponse[]> {
    // Try cache first
    const cached = getCachedData<ProductResponse[]>(CACHE_NAMESPACES.PRODUCT, userId, 'list');
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const products = await BaseProductService.getUserProducts(userId);
      
      // Cache result
      cacheData(CACHE_NAMESPACES.PRODUCT, userId, products, CACHE_TTL.MEDIUM, 'list');
      
      return products;
    } catch (error) {
      console.error('Cached getUserProducts failed:', error);
      return [];
    }
  }

  static async getProduct(productId: string): Promise<ProductResponse | null> {
    // Try cache first
    const cached = getCachedData<ProductResponse>(CACHE_NAMESPACES.PRODUCT, productId);
    if (cached) {
      return cached;
    }

    // Fetch from API using base service
    try {
      const product = await BaseProductService.getProductById(productId);
      
      // Cache result
      if (product) {
        cacheData(CACHE_NAMESPACES.PRODUCT, productId, product, CACHE_TTL.MEDIUM);
      }
      
      return product;
    } catch (error) {
      console.error('Cached getProduct failed for:', productId, error);
      return null;
    }
  }

  static async createProduct(productData: any): Promise<ProductResponse> {
    try {
      const product = await BaseProductService.createProduct(productData);
      
      // Invalidate user's product list cache (we'll use a general invalidation)
      invalidateCache(CACHE_NAMESPACES.PRODUCT);
      
      // Emit event to notify other components
      emitProductCreated(product.productId || product.id);
      
      return product;
    } catch (error) {
      console.error('Cached createProduct failed:', error);
      throw error;
    }
  }

  static async updateProduct(productId: string, productData: any): Promise<ProductResponse> {
    try {
      const product = await BaseProductService.updateProduct(productId, productData);
      
      // Invalidate caches
      invalidateCache(CACHE_NAMESPACES.PRODUCT, productId);
      invalidateCache(CACHE_NAMESPACES.PRODUCT);
      
      // Emit event to notify other components
      emitProductUpdated(productId);
      
      return product;
    } catch (error) {
      console.error('Cached updateProduct failed:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      await BaseProductService.deleteProduct(productId);
      
      // Invalidate caches
      invalidateCache(CACHE_NAMESPACES.PRODUCT, productId);
      invalidateCache(CACHE_NAMESPACES.PRODUCT);
      
      // Emit event to notify other components
      emitProductDeleted(productId);
    } catch (error) {
      console.error('Cached deleteProduct failed:', error);
      throw error;
    }
  }

  static invalidateProductCache(identifier: string): void {
    invalidateCache(CACHE_NAMESPACES.PRODUCT, identifier);
  }
}

export class CachedOrderService {
  // Set user context for the base order service
  static setUserContext(user: UserContext): void {
    baseOrderService.setUserContext(user);
  }

  static getUserContext(): UserContext | null {
    return baseOrderService.getUserContext();
  }

  static async getOrderStats(period: 'week' | 'month' | 'year' = 'month'): Promise<OrderStats | null> {
    const userContext = baseOrderService.getUserContext();
    if (!userContext) {
      console.warn('No user context set for order service');
      return null;
    }

    const cacheKey = `${userContext.id}_${period}`;
    
    // Try cache first (shorter TTL for stats)
    const cached = getCachedData<OrderStats>(CACHE_NAMESPACES.STATS, cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const stats = await baseOrderService.getOrderStats(period);
      
      if (stats) {
        // Cache result with shorter TTL for real-time data
        cacheData(CACHE_NAMESPACES.STATS, cacheKey, stats, CACHE_TTL.SHORT);
      }
      
      return stats;
    } catch (error) {
      console.error('Cached getOrderStats failed:', error);
      // Return null instead of throwing to allow graceful degradation
      return null;
    }
  }

  static async getOrders(): Promise<OrderListResponse> {
    try {
      return await baseOrderService.getOrders();
    } catch (error) {
      console.error('Cached getOrders failed:', error);
      return { 
        orders: [], 
        pagination: { total: 0, totalPages: 0, currentPage: 1, limit: 10, hasNext: false, hasPrev: false },
        summary: { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0, currency: 'USD' }
      };
    }
  }

  static invalidateOrderCache(identifier?: string): void {
    if (identifier) {
      invalidateCache(CACHE_NAMESPACES.ORDER, identifier);
    } else {
      invalidateCache(CACHE_NAMESPACES.ORDER);
      invalidateCache(CACHE_NAMESPACES.STATS);
    }
  }
}

// Export services with intuitive names
export const UserService = CachedUserService;
export const ProductService = CachedProductService;
export const orderService = CachedOrderService;

// Keep legacy exports for backward compatibility during transition
export const EnhancedUserService = CachedUserService;
export const EnhancedProductService = CachedProductService;
export const EnhancedOrderService = CachedOrderService;