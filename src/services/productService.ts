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
  name: string; // renamed from serviceName
  serviceNames: string[];
  tier: string;
  prices: Record<string, number | "">;
  deliveryTimes: Record<string, number | "">;
  fullFormAnswersPerTier: Record<string, Record<string, string>>;
  tags: string[]; // renamed from selectedSkills
}

// Interface matching the API structure from your PowerShell example
export interface CreateProductRequest {
  name: string;
  description: string;
  brand: string;
  price: number;
  category: string;
  currency: string;
  images: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  specifications: TierBasedSpecifications;
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
  name: string;
  description: string;
  brand: string;
  price: number;
  category: string;
  currency: string;
  images: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  specifications: TierBasedSpecifications;
  availability: {
    inStock: boolean;
    quantity: number;
  };
  tags: string[];
  skills?: string[];  // Made optional to match API
  createdAt: string;
  updatedAt: string;
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
        console.log(`Uploading ${request.images.length} images to CDN...`);
        
        for (let i = 0; i < request.images.length; i++) {
          const image = request.images[i];
          try {
            const imageKey = await ImageService.uploadImage({
              username,
              file: image,
              folder: 'products'
            });
            imageKeys.push(imageKey);
            const cdnUrl = ImageService.getImageUrl(imageKey);
            cdnImageUrls.push(cdnUrl);
            console.log(`Image ${i + 1} uploaded successfully:`, imageKey);
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            throw new Error(`Failed to upload image ${i + 1}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          }
        }
      }

      // Upload video to CDN if provided
      let videoKey: string | undefined;
      if (request.video) {
        console.log('Uploading video to CDN...');
        try {
          videoKey = await ImageService.uploadImage({
            username,
            file: request.video,
            folder: 'products/videos'
          });
          console.log('Video uploaded successfully:', videoKey);
        } catch (uploadError) {
          console.error('Failed to upload video:', uploadError);
          throw new Error(`Failed to upload video: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Transform form data to API format
      const apiProductData = this.transformFormDataToApiFormat(request.productData, cdnImageUrls);

      // Create product via API with JSON data (no FormData needed)
      console.log('Creating product record in API...');
      const result = await this.createProductJson(apiProductData);
      console.log('Product created successfully:', result);
      
      return result;
      
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  }

  /**
   * Transform form data to the API format expected by the backend
   */
  private static transformFormDataToApiFormat(
    formData: LegacyFormData, 
    cdnImageUrls: string[]
  ): CreateProductRequest {
    // Get the selected tier and its details
    const selectedTier = formData.tier || 'Basic';
    const price = Number(formData.prices?.[selectedTier]) || 0;
    
    // Create tags from various sources
    const apiTags: string[] = [];
    if (formData.category) apiTags.push(formData.category.toLowerCase());
    if (formData.name) apiTags.push(formData.name.toLowerCase().replace(/\s+/g, '-'));
    if (formData.tags) {
      formData.tags.forEach((skill: string) => {
        apiTags.push(skill.toLowerCase().replace(/\s+/g, '-'));
      });
    }
    apiTags.push(selectedTier.toLowerCase());

    // Build tier-based specifications
    const tierSpecifications: TierBasedSpecifications = {};
    
    // Process all three tiers
    ['Basic', 'Standard', 'Premium'].forEach(tierName => {
      const tierPrice = Number(formData.prices?.[tierName]) || 0;
      const tierDeliveryTime = formData.deliveryTimes?.[tierName] || '3-5';
      const tierAnswers = formData.fullFormAnswersPerTier?.[tierName] || {};
      
      // Build delivery time string for this tier
      const tierDeliveryTimeStr = `${tierDeliveryTime} ${formData.name?.includes('day') ? '' : 'days'}`.trim();
      
      // Extract features from tier answers (excluding standard fields)
      const features: string[] = [];
      Object.entries(tierAnswers).forEach(([key, value]) => {
        if (value && !['description', 'brand', 'revisions'].includes(key)) {
          features.push(`${key}: ${value}`);
        }
      });
      
      tierSpecifications[tierName as keyof TierBasedSpecifications] = {
        deliveryTime: tierDeliveryTimeStr,
        revisions: tierAnswers.revisions || '3 included',
        price: tierPrice > 0 ? tierPrice : undefined,
        features: features.length > 0 ? features : undefined,
        support: tierName === 'Premium' ? 'Priority Support' : 
                 tierName === 'Standard' ? 'Standard Support' : 'Basic Support'
      };
    });

    return {
      name: formData.title || formData.name || 'Untitled Service',
      description: formData.fullFormAnswersPerTier?.[selectedTier]?.description || 
                   `Professional ${formData.name || 'service'} with ${selectedTier} tier features`,
      brand: formData.fullFormAnswersPerTier?.[selectedTier]?.brand || 
             localStorage.getItem('username') || 'Provider',
      price: price,
      category: formData.category?.toLowerCase() || 'technology',
      currency: 'USD', // Default to USD, can be made configurable
      images: cdnImageUrls.map((url, index) => ({
        url: url,
        isPrimary: index === 0,
        order: index + 1
      })),
      specifications: tierSpecifications,
      availability: {
        inStock: true,
        quantity: 1 // Default availability
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
   */
  static async getUserProducts(userId?: string): Promise<ProductResponse[]> {
    const baseUrl = this.getApiUrl();
    const url = userId ? `${baseUrl}?userId=${userId}` : baseUrl;
    
    try {
      const response = await api.get<{
        success: boolean;
        data: ProductResponse[];
        pagination?: any;
        filters?: any;
        timestamp?: string;
        requestId?: string;
      }>(url);
      
      console.log('Raw API response:', response);
      
      // Extract the data array from the API response
      if (response && typeof response === 'object' && 'data' in response) {
        console.log('Extracting data from response:', response.data?.length || 0, 'products');
        return Array.isArray(response.data) ? response.data : [];
      }
      
      // Fallback: if response is already an array (for backward compatibility)
      if (Array.isArray(response)) {
        console.log('Response is already an array:', (response as ProductResponse[]).length, 'products');
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
        console.log(`Uploading ${newImages.length} new images...`);
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
}