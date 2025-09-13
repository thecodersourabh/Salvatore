const API_BASE_URL = import.meta.env.VITE_CDN_API_URL;
const CDN_URL = import.meta.env.VITE_CDN_URL;
export interface PresignedUrlResponse {
  success: boolean;
  url: string;
  key: string;
  error?: string;
  message?: string;
}

export interface ImageListResponse {
  success: boolean;
  files?: Array<{
    key: string;
    url: string;
    cdnUrl?: string;
  }>;
  images?: Array<{
    key: string;
    url: string;
    cdnUrl?: string;
  }>;
  error?: string;
}

export interface ImageUploadOptions {
  username: string;
  file: File;
  folder?: string;
}

export class ImageService {
  /**
   * Get presigned URL for image upload
   */
  static async getPresignedUrl(filename: string, username: string, contentType: string, folder: string = 'profile'): Promise<PresignedUrlResponse> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Please check your environment variables.');
      }
      
      const key = `${username}/${folder}/${filename}`;
      const response = await fetch(`${API_BASE_URL}/upload/presigned-url?key=${encodeURIComponent(key)}&username=${encodeURIComponent(username)}&contentType=${encodeURIComponent(contentType)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.message || result.error || 'Failed to get upload URL');
      }
      
      return result;
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw error;
    }
  }

  /**
   * Upload image to S3 using presigned URL
   */
  static async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    try {
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  /**
   * Upload image with automatic presigned URL handling
   */
  static async uploadImage({ username, file, folder = 'profile' }: ImageUploadOptions): Promise<string> {
    try {
      // Get presigned URL
      const presignedResponse = await this.getPresignedUrl(file.name, username, file.type, folder);
      
      // Upload to S3
      await this.uploadToS3(presignedResponse.url, file);
      
      // Wait for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return presignedResponse.key;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }

  /**
   * List images for a user
   */
  static async listImages(username: string, folder: string = 'profile'): Promise<ImageListResponse> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Please check your environment variables.');
      }
      
      const prefix = `${username}/${folder}/`;
      const timestamp = new Date().getTime();
      
      const response = await fetch(`${API_BASE_URL}/upload/list?prefix=${encodeURIComponent(prefix)}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('List API response not OK:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to list images');
      }

      return result;
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }

  /**
   * Delete image from S3
   * @param key - The full S3 key path of the image to delete
   */
  static async deleteImage(key: string): Promise<void> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Please check your environment variables.');
      }

      if (!key) {
        throw new Error('Image key is required');
      }
      
      const response = await fetch(`${API_BASE_URL}/upload/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      let errorMessage = 'Failed to delete image';
      
      try {
        const data = await response.json();
        if (!response.ok || !data.success) {
          errorMessage = data.error || errorMessage;
          throw new Error(errorMessage);
        }
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(errorMessage);
        }
        throw parseError;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get CDN URL for displaying an image
   */
  static getImageUrl(key: string): string {
    if (!key) return '';
    return `${CDN_URL}/${key}`;
  }

  /**
   * Fetch file content from CDN
   * @param key - The S3 key of the file to fetch
   * @returns Promise<Blob> - The file content as a Blob
   */
  static async fetchFileFromCdn(key: string): Promise<Blob> {
    if (!key) throw new Error('Key is required');
    if (!CDN_URL) throw new Error('CDN_URL is not configured');

    try {
      const response = await fetch(`${CDN_URL}/${key}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Error fetching file from CDN:', error);
      throw error;
    }
  }
}
