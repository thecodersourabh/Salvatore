import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export type ImageItem = {
  key: string;
  url: string;
  size?: number;
  lastModified?: string;
};

export interface UseImageGalleryProps {
  images: ImageItem[];
  autoSwitchInterval?: number;
  initialImage?: string;
}

export const useImageGallery = ({ 
  images, 
  autoSwitchInterval = 0, // Default to 0 (disabled)
  initialImage 
}: UseImageGalleryProps) => {
  // Use ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  // Initialize current image key
  const [currentImageKey, setCurrentImageKey] = useState<string | null>(() => {
    if (initialImage && images.find(img => img.key === initialImage)) {
      return initialImage;
    }
    return images[0]?.key || null;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset current image when images array changes
  useEffect(() => {
    if (images.length === 0) {
      setCurrentImageKey(null);
      return;
    }

    // If current image key is not in the new images array, reset to first image
    const currentExists = images.find(img => img.key === currentImageKey);
    if (!currentExists) {
      setCurrentImageKey(images[0]?.key || null);
    }
  }, [images, currentImageKey]);

  // Derive image count status
  const imageStatus = useMemo(() => {
    const count = images.length;
    if (count <= 1) return 'single';
    if (count >= 5) return '5plus';
    return count.toString();
  }, [images.length]);

  // Handle auto-switching only when enabled and more than 1 image
  useEffect(() => {
    if (autoSwitchInterval <= 0 || images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setCurrentImageKey(prevKey => {
        const currentIndex = images.findIndex(img => img.key === prevKey);
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex]?.key || images[0]?.key || null;
      });
    }, autoSwitchInterval);

    return () => clearInterval(interval);
  }, [images, autoSwitchInterval]); // Remove currentImageKey from dependencies

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Select specific image with smooth transition
  const selectImage = useCallback((key: string) => {
    if (!images.find(img => img.key === key)) {
      console.warn(`Image with key "${key}" not found`);
      return;
    }

    setIsTransitioning(true);
    // Use a shorter timeout for better responsiveness
    setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageKey(key);
        setIsTransitioning(false);
      }
    }, 100);
  }, [images]);

  // Get current image
  const currentImage = useMemo(() => {
    if (!currentImageKey || images.length === 0) {
      return images[0] || null;
    }
    return images.find(img => img.key === currentImageKey) || images[0] || null;
  }, [images, currentImageKey]);

  // Get current index for external use
  const currentIndex = useMemo(() => {
    if (!currentImage) return -1;
    return images.findIndex(img => img.key === currentImage.key);
  }, [images, currentImage]);

  return {
    currentImage,
    currentIndex,
    imageStatus,
    isTransitioning,
    selectImage,
    totalImages: images.length,
    hasMultipleImages: images.length > 1
  };
};
