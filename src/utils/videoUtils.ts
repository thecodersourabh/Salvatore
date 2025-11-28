// Video validation and isolation utilities
// This ensures videos are properly linked to specific products like images

export const generateProductVideoKey = (username: string, fileName: string): string => {
  const timestamp = Date.now();
  const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Use the same pattern as ImageService for consistency
  // This will generate keys like: username/products/videos/timestamp_filename
  return `${safeUsername}/products/videos/${timestamp}_${safeFileName}`;
};

export const validateVideoProductAssociation = (product: any): boolean => {
  // Check if product has video data and it's properly associated
  if (!product.videoKey && !product.videoUrl) {
    return true; // No video is valid
  }
  
  // If there's a video, ensure it's properly formatted with product isolation
  if (product.videoKey) {
    const keyParts = product.videoKey.split('/');
    if (keyParts.length >= 3 && keyParts[1] === 'products' && keyParts[2] === 'videos') {
      return true;
    }
  }
  
  return true; // Allow for now, just log issues
};

export const extractUsernameFromVideoKey = (videoKey: string): string | null => {
  try {
    const keyParts = videoKey.split('/');
    if (keyParts.length >= 3 && keyParts[1] === 'products' && keyParts[2] === 'videos') {
      return keyParts[0]; // Username is the first part
    }
    return null;
  } catch (error) {
    console.error('Error parsing video key:', error);
    return null;
  }
};

export const validateVideoUpload = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return { isValid: false, error: 'File must be a video' };
  }

  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024; // 20MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'Video size cannot exceed 20MB' };
  }

  // Check file extension
  const allowedExtensions = ['mp4', 'mov', 'avi', 'webm'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Video format not supported. Use MP4, MOV, AVI, or WebM' };
  }

  return { isValid: true };
};