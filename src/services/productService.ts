import { api } from './api';
import { ImageService } from './imageService';

// Service Tier Specifications
export interface ServiceTierDetails {
  deliveryTime?: string;
  revisions?: string;
  price?: number;
  features?: string[];
  support?: string;
  [key: string]: any; // Allow additional custom fields
}

export interface TierBasedSpecifications {
  Basic?: ServiceTierDetails;
  Standard?: ServiceTierDetails;
  Premium?: ServiceTierDetails;
}

// Legacy form data interface (from ProductForm component)
export interface LegacyFormData {
  sku: string;
  title: string;
  category: string | null; // renamed from sector
  subCategory?: string; // service template or sub-category
  name: string; // renamed from serviceName or productName
  serviceNames: string[];
  tier: string;
  prices: Record<string, number | "">;
  deliveryTimes: Record<string, number | "">;
  fullFormAnswersPerTier: Record<string, Record<string, string>>;
  tags: string[]; // renamed from selectedSkills
  // Optional product-specific fields
  type?: 'product' | 'service';
  productName?: string;
  productDescription?: string;
  brand?: string;
  currency?: string;
  productUnit?: string;
  unit?: string;
  stock?: number | string;
  price?: number;
  id?: string;
}


// Interface matching the API structure from your PowerShell example
export interface CreateProductRequest {
  type?: 'product' | 'service';
  name: string;
  description: string;
  brand: string;
  price: number;
  category: string;
  subcategory?: string;
  currency: string;
  images: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  videoKey?: string;
  videoUrl?: string;
  specifications?: TierBasedSpecifications | null;
  availability: {
    inStock: boolean;
    quantity: number;
  };
  tags: string[];
  skills: string[]; // Global skills array
  isActive?: boolean; // Allow updating product status
}

// Interface for product with media files
export interface CreateProductWithMediaRequest {
  productData: LegacyFormData; // Use legacy form data structure
  images?: File[];
  video?: File | null;
}

// Response interface matching the API structure
export interface ProductResponse {
  id?: string;
  productId?: string;  // API returns productId instead of id
  type?: 'product' | 'service';
  name: string;
  title?: string; // Custom business name/title separate from product name
  description?: string;
  brand?: string;
  price?: number;
  category?: string;
  currency?: string;
  unit?: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  specifications?: TierBasedSpecifications | null;
  availability?: {
    inStock?: boolean;
    quantity?: number;
  };
  tags?: string[];
  skills?: string[];  // Made optional to match API
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;  // Added for product status management
  // API specific fields
  createdBy?: string;
  createdByName?: string;
  averageRating?: number;
  totalRatings?: number;
  totalReviews?: number;
  // Internal CDN management fields
  imageKeys?: string[];
  videoKey?: string;
}

export class ProductService {
  
  /**
   * Gets the Products API base URL from environment variables.
   */
  private static getApiUrl(): string {
    return import.meta.env.VITE_PRODUCTS_API;
  }

  /**
   * Create a new product with optional media files
   * Uses ImageService (CDN) for image uploads and sends JSON data to API
   */
  static async createProduct(request: CreateProductWithMediaRequest): Promise<ProductResponse> {
    try {
      // Get username from auth context or localStorage
      const username = localStorage.getItem('username') || localStorage.getItem('x-user-id')||'';
      
      // Upload images to CDN first
      const imageKeys: string[] = [];
      const cdnImageUrls: string[] = [];
      
      if (request.images && request.images.length > 0) {
        
        for (let i = 0; i < request.images.length; i++) {
          const image = request.images[i];
          console.log(`Processing image ${i + 1}:`, image.name, image.size, image.type);
          try {
            const imageKey = await ImageService.uploadImage({
              username,
              file: image,
              folder: 'products'
            });
            imageKeys.push(imageKey);
            const cdnUrl = ImageService.getImageUrl(imageKey);
            cdnImageUrls.push(cdnUrl);
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            throw new Error(`Failed to upload image ${i + 1}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          }
        }
        
      } else {
      }

      // Upload video to CDN if provided (handle like images)
      let videoKey: string | undefined;
      let videoUrl: string | undefined;
      if (request.video) {
        try {
          const usernamePart = username;
          // Upload video using the same pattern as images for consistency
          videoKey = await ImageService.uploadImage({
            username: usernamePart,
            file: request.video,
            folder: 'products/videos'
          });
          videoUrl = ImageService.getImageUrl(videoKey);
        } catch (uploadError) {
          console.error('Failed to upload video:', uploadError);
          throw new Error(`Failed to upload video: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Transform form data to API format
      const apiProductData = ProductService.transformFormDataToApiFormat(request.productData, cdnImageUrls);

      // Attach video metadata if uploaded
      if (videoKey) {
        (apiProductData as any).videoKey = videoKey;
        (apiProductData as any).videoUrl = videoUrl;
      }

      // Create product via API with JSON data (no FormData needed)
      const result = await this.createProductJson(apiProductData);
      
      return result;
      
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  }

  /**
   * Transform form data to the API format expected by the backend
   */
  static transformFormDataToApiFormat(
    formData: LegacyFormData, 
    cdnImageUrls: string[]
  ): CreateProductRequest {
    // Get the selected tier and its details
    const selectedTier = formData.tier || 'Basic';
    const price = Number(formData.prices?.[selectedTier]) || 0;
    
    // Create tags from various sources
    const apiTags: string[] = [];
    if (formData.category) apiTags.push(formData.category.toLowerCase());

    // Sub-category is a common field for both products and services. Prefer it when present for tags and payloads.
    // If subCategory is missing, fall back to the name so the API receives a useful subcategory value.
    const subCatRaw = (formData as any).subCategory || (formData as any).subcategory || (formData.name || undefined);
    if (subCatRaw) {
      apiTags.push(String(subCatRaw).toLowerCase().replace(/\s+/g, '-'));
    } else if (formData.name) {
      apiTags.push(formData.name.toLowerCase().replace(/\s+/g, '-'));
    }

    if (formData.tags) {
      formData.tags.forEach((skill: string) => {
        apiTags.push(skill.toLowerCase().replace(/\s+/g, '-'));
      });
    }
    apiTags.push(selectedTier.toLowerCase());

    // Build tier-based specifications (only for services)
    const tierSpecifications: TierBasedSpecifications = {};
    
    // Process all three tiers when this is not a product
    if (formData.type !== 'product') {
      ['Basic', 'Standard', 'Premium'].forEach(tierName => {
        const tierPrice = formData.prices && formData.prices[tierName] !== undefined && formData.prices[tierName] !== '' ? Number(formData.prices?.[tierName]) : undefined;
        const tierDeliveryTimeRaw = formData.deliveryTimes?.[tierName];
        const tierDeliveryTime = tierDeliveryTimeRaw ? `${tierDeliveryTimeRaw} ${formData.name?.includes('day') ? '' : 'days'}`.trim() : undefined;
        const tierAnswers = formData.fullFormAnswersPerTier?.[tierName] || {};
        
        // Extract features from tier answers (excluding standard fields)
        const features: string[] = [];
        Object.entries(tierAnswers).forEach(([key, value]) => {
          if (value && !['description', 'brand', 'revisions'].includes(key)) {
            features.push(`${key}: ${value}`);
          }
        });
        
        const revisions = tierAnswers.revisions || undefined;
        const support = tierAnswers.support || (tierName === 'Premium' ? 'Priority Support' : tierName === 'Standard' ? 'Standard Support' : undefined);
        
        tierSpecifications[tierName as keyof TierBasedSpecifications] = {
          deliveryTime: tierDeliveryTime,
          revisions: revisions,
          price: tierPrice,
          features: features.length > 0 ? features : undefined,
          support: support
        };
      });
    }

    return {
      type: formData.type || (Object.keys(tierSpecifications).length ? 'service' : 'product'),
      name: formData.name,
      description: formData.type === 'product' ? (formData.productDescription || '') : (formData.fullFormAnswersPerTier?.[selectedTier]?.description || `Professional ${formData.name || 'service'} with ${selectedTier} tier features`),
      brand: formData.brand || formData.fullFormAnswersPerTier?.[selectedTier]?.brand || localStorage.getItem('username') || 'Provider',
      price: price,
      category: formData.category,
      subcategory: subCatRaw ? String(subCatRaw) : undefined,
      currency: formData.currency, // Prefer form-supplied currency when available
      images: cdnImageUrls.map((url, index) => ({
        url: url,
        isPrimary: index === 0,
        order: index + 1
      })),
      specifications: formData.type === 'product' ? null : tierSpecifications,
      availability: {
        inStock: (Number(formData.stock) || 0) > 0,
        quantity: Number(formData.stock) || 1
      },
      tags: apiTags,
      skills: formData.tags || []
    };
  }

  /**
   * Create a product without media files (JSON only)
   */
  static async createProductJson(productData: CreateProductRequest): Promise<ProductResponse> {
    const apiUrl = this.getApiUrl();
    
    try {
      const response = await api.post<ProductResponse>(apiUrl, productData);
      return response;
    } catch (error) {
      console.error('Product JSON creation error:', error);
      throw error;
    }
  }

  /**
   * Get products for a specific user/provider
   * Uses the new endpoint pattern: /users/{userId}/products
   */
  static async getUserProducts(userId?: string): Promise<ProductResponse[]> {
    // Get user ID from parameter, localStorage, or context
    const targetUserId = userId || 
      localStorage.getItem('x-user-id') || 
      (window as any).__USER_ID__ || 
      localStorage.getItem('username');
    
    if (!targetUserId) {
      console.warn('No user ID available for fetching products');
      return [];
    }

    // Use the new endpoint pattern: /users/{userId}/products
    const apiUrl = this.getApiUrl();
    const url = `${apiUrl.replace(/\/products$/, '')}/users/${targetUserId}/products`;
    
    try {
      const response = await api.get<{
        success: boolean;
        data: ProductResponse[];
        pagination?: any;
        filters?: any;
        timestamp?: string;
        requestId?: string;
      }>(url);
      
      // Extract the data array from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray(response.data) ? response.data : [];
      }
      
      // Fallback: if response is already an array (for backward compatibility)
      if (Array.isArray(response)) {
        return response as ProductResponse[];
      }
      
      console.warn('Unexpected API response format:', typeof response);
      return [];
    } catch (error) {
      console.error('Get user products error:', error);
      throw error;
    }
  }

  /**
   * Get all products (for marketplace/public view) 
   * This method can be used when you need to show all products regardless of user
   */
  static async getAllProducts(): Promise<ProductResponse[]> {
    const apiUrl = this.getApiUrl();
    
    try {
      const response = await api.get<{
        success: boolean;
        data: ProductResponse[];
        pagination?: any;
        filters?: any;
        timestamp?: string;
        requestId?: string;
      }>(apiUrl);
      
      // Extract the data array from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray(response.data) ? response.data : [];
      }
      
      // Fallback: if response is already an array (for backward compatibility)
      if (Array.isArray(response)) {
        return response as ProductResponse[];
      }
      
      console.warn('Unexpected API response format for all products:', typeof response);
      return [];
    } catch (error) {
      console.error('Get all products error:', error);
      throw error;
    }
  }

  /**
   * Get products by a specific user ID (for viewing another user's products)
   */
  static async getProductsByUserId(userId: string): Promise<ProductResponse[]> {
    if (!userId) {
      console.warn('No user ID provided for fetching products');
      return [];
    }

    // Use the new endpoint pattern: /users/{userId}/products
    const apiUrl = this.getApiUrl();
    const url = `${apiUrl.replace(/\/products$/, '')}/users/${userId}/products`;
    
    try {
      console.log('Fetching products for specific user:', userId, 'from URL:', url);
      
      const response = await api.get<{
        success: boolean;
        data: ProductResponse[];
        pagination?: any;
        filters?: any;
        timestamp?: string;
        requestId?: string;
      }>(url);
      
      // Extract the data array from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray(response.data) ? response.data : [];
      }
      
      // Fallback: if response is already an array (for backward compatibility)
      if (Array.isArray(response)) {
        return response as ProductResponse[];
      }
      
      console.warn('Unexpected API response format:', typeof response);
      return [];
    } catch (error) {
      console.error('Get products by user ID error:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(productId: string): Promise<ProductResponse> {
    const apiUrl = `${this.getApiUrl()}/${productId}`;
    
    try {
      const response = await api.get<{
        success: boolean;
        data: ProductResponse;
        timestamp?: string;
        requestId?: string;
      }>(apiUrl);
      
      // Extract the data from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
      }
      
      // Fallback: if response is already the product (for backward compatibility)
      if (response && typeof response === 'object') {
        return response as ProductResponse;
      }
      
      throw new Error('Invalid product response format');
    } catch (error) {
      console.error('Get product by ID error:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(productId: string, productData: Partial<CreateProductRequest>): Promise<ProductResponse> {
    const apiUrl = `${this.getApiUrl()}/${productId}`;
    
    try {
      const response = await api.put<{
        success: boolean;
        data: ProductResponse;
        message?: string;
        timestamp?: string;
        requestId?: string;
      }>(apiUrl, productData);
      
      // Extract the data from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
      }
      
      // Fallback: if response is already the product (for backward compatibility)
      if (response && typeof response === 'object') {
        return response as ProductResponse;
      }
      
      throw new Error('Invalid update response format');
    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  }

  /**
   * Delete a product and its associated media files
   */
  static async deleteProduct(productId: string): Promise<void> {
    const apiUrl = `${this.getApiUrl()}/${productId}`;
    
    try {
      // First get the product to find associated media keys
      const product = await api.get<ProductResponse>(`${apiUrl}`);
      
      // Delete the product record
      await api.delete<void>(apiUrl);
      
      // Clean up associated media files from CDN
      if (product.imageKeys && product.imageKeys.length > 0) {
        console.log('Cleaning up product images from CDN...');
        for (const imageKey of product.imageKeys) {
          try {
            await ImageService.deleteImage(imageKey);
          } catch (error) {
            console.warn('Failed to delete image from CDN:', imageKey, error);
          }
        }
      }
      
      // Clean up video files from CDN (treat like images)
      if (product.videoKey) {
        console.log('Cleaning up product video from CDN...');
        try {
          await ImageService.deleteImage(product.videoKey);
        } catch (error) {
          console.warn('Failed to delete video from CDN:', product.videoKey, error);
        }
      }
      
    } catch (error) {
      console.error('Product deletion error:', error);
      throw error;
    }
  }

  /**
   * Get CDN URLs for product images
   */
  static getProductImageUrls(imageKeys: string[]): string[] {
    return imageKeys.map(key => ImageService.getImageUrl(key));
  }

  /**
   * Get CDN URL for product video
   */
  static getProductVideoUrl(videoKey: string): string {
    return ImageService.getImageUrl(videoKey);
  }

  /**
   * Transform ProductResponse back to LegacyFormData format for form editing
   */
  static transformProductResponseToFormData(product: ProductResponse): LegacyFormData {
    // Extract tier information from specifications
    const tiers = ['Basic', 'Standard', 'Premium'] as const;
    const prices: Record<string, number | ""> = { Basic: "", Standard: "", Premium: "" };
    const deliveryTimes: Record<string, number | ""> = { Basic: "", Standard: "", Premium: "" };
    const fullFormAnswersPerTier: Record<string, Record<string, string>> = { Basic: {}, Standard: {}, Premium: {} };

    // Find the primary tier (the one with the product's price)
    let primaryTier = 'Basic';
    if (product.specifications) {
      tiers.forEach(tier => {
        const tierSpec = product.specifications ? product.specifications[tier] : undefined;
        if (tierSpec) {
          if (tierSpec.price === product.price) {
            primaryTier = tier;
          }
          prices[tier] = tierSpec.price ?? "";
          
          // Parse delivery time to extract numeric value
          const deliveryTimeStr = tierSpec.deliveryTime || '';
          const timeMatch = deliveryTimeStr ? deliveryTimeStr.match(/(\d+)(-\d+)?/) : null;
          deliveryTimes[tier] = timeMatch ? parseInt(timeMatch[1]) : "";
          
          // Populate tier answers
          fullFormAnswersPerTier[tier] = {
            description: product.description || '',
            brand: product.brand || '',
            revisions: tierSpec.revisions || '',
            support: tierSpec.support || '',
            ...(tierSpec.features ? tierSpec.features.reduce((acc, feature) => {
              const [key, value] = feature.split(': ');
              if (key && value) acc[key] = value;
              return acc;
            }, {} as Record<string, string>) : {})
          };
        }
      });
    } else {
      // No specifications - leave defaults empty
      // prices/deliveryTimes/fullFormAnswersPerTier remain empty
    }

    // Extract category from product category or derive from tags
    const category = product.category ? 
      product.category.charAt(0).toUpperCase() + product.category.slice(1) : 
      'Technology';

    return {
      sku: product.id || product.productId || '',
      title: product.name,
      category: category,
      name: product.name,
      // Expose top-level price & currency for product edit flows
      price: product.price ?? undefined,
      currency: product.currency || undefined,
      serviceNames: [product.name],
      tier: primaryTier,
      prices,
      deliveryTimes,
      fullFormAnswersPerTier,
      tags: product.skills || product.tags || [],
      // product-specific fields for edit form (prefer explicit type from API if present)
      type: product.type || (product.specifications ? 'service' : 'product'),
      productName: product.name,
      productDescription: product.description || '',
      brand: product.brand || '',
      productUnit: (product.unit || '') as any,
      unit: (product.unit || '') as any,
      stock: product.availability?.quantity ?? '',
      // propagate subcategory (API uses `subcategory` but be flexible); fallback to name if absent
      subCategory: (product as any).subcategory || (product as any).subCategory || product.name || ''
    };
  }

  /**
   * Update product images (replace existing with new ones)
   */
  static async updateProductImages(productId: string, newImages: File[]): Promise<string[]> {
    try {
      const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
      
      // Get current product to find existing image keys
      const apiUrl = `${this.getApiUrl()}/${productId}`;
      const currentProduct = await api.get<ProductResponse>(apiUrl);
      
      // Delete existing images from CDN
      if (currentProduct.imageKeys && currentProduct.imageKeys.length > 0) {
        console.log('Removing existing product images...');
        for (const imageKey of currentProduct.imageKeys) {
          try {
            await ImageService.deleteImage(imageKey);
          } catch (error) {
            console.warn('Failed to delete existing image:', imageKey, error);
          }
        }
      }
      
      // Upload new images
      const newImageKeys: string[] = [];
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const imageKey = await ImageService.uploadImage({
            username,
            file: newImages[i],
            folder: 'products'
          });
          newImageKeys.push(imageKey);
        }
      }
      
      // Update product record with new images array
      const updateData: Partial<CreateProductRequest> = {
        images: newImageKeys.map((key, index) => ({
          url: ImageService.getImageUrl(key),
          isPrimary: index === 0,
          order: index + 1
        }))
      };
      
      await this.updateProduct(productId, updateData);
      
      return newImageKeys;
      
    } catch (error) {
      console.error('Error updating product images:', error);
      throw error;
    }
  }

  /**
   * Update product video (replace existing with new one)
   */
  static async updateProductVideo(productId: string, newVideo: File): Promise<string> {
    try {
      const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
      
      // Get current product to find existing video key
      const apiUrl = `${this.getApiUrl()}/${productId}`;
      const currentProduct = await api.get<ProductResponse>(apiUrl);
      
      // Delete existing video from CDN if it exists
      if (currentProduct.videoKey) {
        console.log('Removing existing product video...');
        try {
          await ImageService.deleteImage(currentProduct.videoKey);
        } catch (error) {
          console.warn('Failed to delete existing video:', currentProduct.videoKey, error);
        }
      }
      
      // Upload new video using ImageService (like images)
      let videoKey: string;
      if (newVideo.size < (10 * 1024 * 1024)) {
        // Small video - use ImageService
        videoKey = await ImageService.uploadImage({
          username,
          file: newVideo,
          folder: 'products/videos'
        });
      } else {
        // Large video - use VideoService multipart
        const timestamp = Date.now();
        const safeFileName = newVideo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const customKey = `${username}/products/videos/${timestamp}_${safeFileName}`;
        const VideoService = await import('./videoService');
        videoKey = await VideoService.default.uploadMultipart(newVideo, customKey);
      }
      
      // Update product record with new video
      const updateData: Partial<CreateProductRequest> = {
        videoKey,
        videoUrl: ImageService.getImageUrl(videoKey)
      };
      
      await this.updateProduct(productId, updateData);
      
      return videoKey;
      
    } catch (error) {
      console.error('Error updating product video:', error);
      throw error;
    }
  }
}