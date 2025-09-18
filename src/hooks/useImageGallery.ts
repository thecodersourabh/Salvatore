import { useState, useEffect, useMemo } from 'react';

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
  autoSwitchInterval = 3000,
  initialImage 
}: UseImageGalleryProps) => {
  const [currentImageKey, setCurrentImageKey] = useState<string | null>(
    initialImage || (images[0]?.key || null)
  );

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Derive image count status
  const imageStatus = useMemo(() => {
    const count = images.length;
    if (count <= 1) return 'single';
    if (count >= 5) return '5plus';
    return count.toString();
  }, [images.length]);

  // Handle auto-switching
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      const currentIndex = images.findIndex(img => img.key === currentImageKey);
      const nextIndex = (currentIndex + 1) % images.length;
      
      // Use setTimeout to create a smooth transition
      setTimeout(() => {
        setCurrentImageKey(images[nextIndex].key);
        setIsTransitioning(false);
      }, 200);
    }, autoSwitchInterval);

    return () => clearInterval(interval);
  }, [images, currentImageKey, autoSwitchInterval]);

  // Select specific image
  const selectImage = (key: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageKey(key);
      setIsTransitioning(false);
    }, 200);
  };

  // Get current image
  const currentImage = useMemo(() => 
    images.find(img => img.key === currentImageKey) || images[0],
    [images, currentImageKey]
  );

  return {
    currentImage,
    imageStatus,
    isTransitioning,
    selectImage,
    totalImages: images.length
  };
};
