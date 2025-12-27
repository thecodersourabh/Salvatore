import { useEffect, useState } from 'react';
import { UPLOAD_LIMITS } from '../../constants';
import { validateVideoUpload } from '../../utils/videoUtils';
import { ImageService } from '../../services/imageService';
import { backgroundUploadService } from '../../services/backgroundUploadService';

// This hook manages all image/video upload logic for the product form
export function useProductMedia({
  initialImages = [],
  initialImagePreviews = [],
  initialExistingImages = [],
  initialVideos = [],
  initialVideoPreviews = [],
  initialExistingVideos = [],
  showValidationError = () => {},
}: { initialImages?: File[], initialImagePreviews?: string[], initialExistingImages?: any[], initialVideos?: File[], initialVideoPreviews?: string[], initialExistingVideos?: any[], showValidationError?: (m:string,f?:string)=>void } = {}) {
  const [images, setImages] = useState<File[]>(initialImages);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialImagePreviews);
  const [existingImages, setExistingImages] = useState<Array<{url: string, isPrimary?: boolean, order?: number}>>(initialExistingImages);

  const [videos, setVideos] = useState<File[]>(initialVideos);
  const [videoPreviews, setVideoPreviews] = useState<string[]>(initialVideoPreviews);
  const [existingVideos, setExistingVideos] = useState<Array<{url: string}>>(initialExistingVideos);

  const [isDragging, setIsDragging] = useState(false);
  const [imageUploadProgress, _setImageUploadProgress] = useState<number|null>(null);
  const [videoUploadProgress, _setVideoUploadProgress] = useState<number|null>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(u => { try { URL.revokeObjectURL(u); } catch(e){} });
      videoPreviews.forEach(u => { try { URL.revokeObjectURL(u); } catch(e){} });
    };
  }, [imagePreviews, videoPreviews]);

  const handleImageAdd = (files: FileList | null) => {
    if (!files) return;
    const maxImages = 6;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const currentTotalImages = existingImages.length + images.length;
    const availableSlots = maxImages - currentTotalImages;

    const incoming = Array.from(files).slice(0, availableSlots);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const validFiles = incoming.filter(f => {
      if (!allowedTypes.includes(f.type.toLowerCase())) {
        showValidationError(`File ${f.name} is not a valid image format. Please use JPEG, PNG, GIF, or WebP.`, 'images');
        return false;
      }
      if (f.size > maxFileSize) {
        showValidationError(`File ${f.name} is too large. Maximum size is 10MB.`, 'images');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setImages(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const existingCount = existingImages.length;
    if (index < existingCount) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const idx = index - existingCount;
      setImages(prev => prev.filter((_, i) => i !== idx));
      setImagePreviews(prev => {
        const removed = prev[idx];
        if (removed && removed.startsWith && removed.startsWith('blob:')) {
          try { URL.revokeObjectURL(removed); } catch (err) { /* noop */ }
        }
        return prev.filter((_, i) => i !== idx);
      });
    }
  };

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (videoFiles.length > 0) {
      const maxVideos = UPLOAD_LIMITS.VIDEOS.MAX_COUNT;
      const remainingSlots = maxVideos - (videos.length + existingVideos.length);
      if (remainingSlots > 0) {
        const toAdd = videoFiles.slice(0, remainingSlots);
        toAdd.forEach(file => handleVideoAdd(file));
      } else {
        showValidationError(`Maximum ${maxVideos} videos allowed. Remove existing videos to add new ones.`, 'video');
      }
    }

    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach(f => dt.items.add(f));
      handleImageAdd(dt.files);
    }
  };

  const handleVideoAdd = (file: File | null) => {
    if (!file) return;
    const maxVideos = UPLOAD_LIMITS.VIDEOS.MAX_COUNT;
    if (videos.length + existingVideos.length >= maxVideos) {
      showValidationError(`Maximum ${maxVideos} videos allowed. Remove existing videos to add new ones.`, 'video');
      return;
    }

    const validation = validateVideoUpload(file);
    if (!validation.isValid) {
      showValidationError(validation.error!, 'video');
      return;
    }

    const preview = URL.createObjectURL(file);
    setVideos(prev => [...prev, file]);
    setVideoPreviews(prev => [...prev, preview]);
  };

  const handleRemoveVideo = (index: number) => {
    const isExisting = index < existingVideos.length;
    if (isExisting) {
      setExistingVideos(prev => prev.filter((_, i) => i !== index));
    } else {
      const idx = index - existingVideos.length;
      if (videoPreviews[idx]) { try { URL.revokeObjectURL(videoPreviews[idx]); } catch(e){} }
      setVideos(prev => prev.filter((_, i) => i !== idx));
      setVideoPreviews(prev => prev.filter((_, i) => i !== idx));
    }
  };

  // Upload helpers
  const uploadImages = async (files: File[]) : Promise<string[]> => {
    const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
    const newImageKeys: string[] = [];
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const key = await ImageService.uploadImage({ username, file: files[i], folder: 'products' }, (percent) => {
        const perFileWeight = 1 / files.length;
        const overall = Math.round(((uploaded + (percent/100)) * perFileWeight) * 100);
        _setImageUploadProgress(overall);
      });
      newImageKeys.push(key);
      uploaded += 1;
    }
    _setImageUploadProgress(null);
    return newImageKeys;
  };

  const uploadSmallVideos = async (files: File[]) : Promise<string[]> => {
    const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
    const keys = await Promise.all(files.map(file => ImageService.uploadImage({ username, file, folder: 'products/videos' }, (percent) => _setVideoUploadProgress(percent))));
    _setVideoUploadProgress(null);
    return keys;
  };

  const startBackgroundVideoUploads = (files: File[], username: string, onComplete?: (key: string, file: File) => void, onError?: (err: any) => void) => {
    files.forEach(video => {
      const videoKeyCustom = `${username}_${Date.now()}_${video.name}`;
      backgroundUploadService.startUpload({
        id: `video_${Date.now()}_${video.name}`,
        file: video,
        key: videoKeyCustom,
        fileName: video.name,
        onProgress: (progress) => _setVideoUploadProgress(progress.progress),
        onComplete: (key) => {
          _setVideoUploadProgress(null);
          if (onComplete) onComplete(key, video);
        },
        onError: (err) => {
          _setVideoUploadProgress(null);
          if (onError) onError(err);
        }
      });
    });
  };

  return {
    images, setImages,
    imagePreviews, setImagePreviews,
    existingImages, setExistingImages,
    videos, setVideos,
    videoPreviews, setVideoPreviews,
    existingVideos, setExistingVideos,
    isDragging, setIsDragging,
    handleImageAdd, handleRemoveImage,
    handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
    handleVideoAdd, handleRemoveVideo,
    uploadImages, uploadSmallVideos, startBackgroundVideoUploads,
    imageUploadProgress: imageUploadProgress, videoUploadProgress: videoUploadProgress,
    setImageUploadProgress: _setImageUploadProgress, setVideoUploadProgress: _setVideoUploadProgress
  };
}
