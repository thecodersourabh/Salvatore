import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, Tag, Calendar, Package, Eye, CheckCircle, Clock, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useImageGallery, ImageItem } from '../hooks/useImageGallery';
import { useBackButton } from '../hooks/useBackButton';

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order?: number;
}

interface Product {
  id?: string;
  productId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  brand?: string;
  images?: ProductImage[];
  tags?: string[];
  skills?: string[];
  specifications?: any;
  rating?: number;
  reviewCount?: number;
  totalRatings?: number;
  totalReviews?: number;
  averageRating?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  availability?: {
    inStock: boolean;
    quantity: number;
  };
  videoKey?: string;
  videoUrl?: string;
}

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

// Helper component to render tier specifications
const TierSpecificationCard: React.FC<{
  tierName: string;
  tierData: any;
  formatCurrency: (amount: number) => string;
}> = ({ tierName, tierData, formatCurrency }) => {
  if (!tierData || typeof tierData !== 'object') return null;

  const {
    price,
    deliveryTime,
    revisions,
    support,
    features = []
  } = tierData;

  // Parse features array to extract key-value pairs
  const parsedFeatures = features.map((feature: string) => {
    const colonIndex = feature.indexOf(': ');
    if (colonIndex > -1) {
      return {
        key: feature.substring(0, colonIndex).replace(/_/g, ' '),
        value: feature.substring(colonIndex + 2)
      };
    }
    return { key: feature, value: '' };
  });

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'basic': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'standard': return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'premium': return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'standard': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getTierColor(tierName)}`}>
      {/* Tier Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTierBadgeColor(tierName)}`}>
          {tierName}
        </span>
        {price && (
          <div className="flex items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(price)}
            </span>
          </div>
        )}
      </div>

      {/* Tier Details */}
      <div className="space-y-2">
        {deliveryTime && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Delivery:</span> {deliveryTime}
            </span>
          </div>
        )}
        
        {revisions && (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Revisions:</span> {revisions}
            </span>
          </div>
        )}
        
        {support && (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Support:</span> {support}
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      {parsedFeatures.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features:</h5>
          <div className="space-y-1">
            {parsedFeatures.map((feature: { key: string; value: string }, index: number) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                {feature.value ? (
                  <span>
                    <span className="font-medium capitalize">{feature.key}:</span> {feature.value}
                  </span>
                ) : (
                  <span className="capitalize">{feature.key}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const { formatCurrency } = useCurrency();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle hardware back button on mobile
  useBackButton(isOpen, onClose, 2);

  if (!isOpen) return null;

  const productId = product.id || product.productId || '';
  
  // Transform product images and video for the unified gallery
  const mediaItems: (ImageItem & { type: 'image' | 'video'; isPrimary?: boolean })[] = [
    // Add images first
    ...(product.images || []).map((img, index) => ({
      key: `image_${index}`,
      url: img.url,
      type: 'image' as const,
      isPrimary: img.isPrimary
    })),
    // Add video if exists
    ...(product.videoKey || product.videoUrl ? [{
      key: 'video_main',
      url: product.videoUrl || '',
      type: 'video' as const,
      isPrimary: false
    }] : [])
  ];

  // Use the image gallery hook with unified media
  const { 
    currentImage, 
    currentIndex,
    selectImage, 
    isTransitioning
  } = useImageGallery({ 
    images: mediaItems,
    autoSwitchInterval: 0, // Disable auto-switching for modal
    initialImage: mediaItems.find(item => item.isPrimary)?.key || mediaItems[0]?.key
  });

  const currentMedia = currentImage as (ImageItem & { type: 'image' | 'video'; isPrimary?: boolean }) | null;
  const fallbackImage = 'https://via.placeholder.com/600x400?text=No+Image';

  // Navigation functions for gallery
  const navigateToNext = useCallback(() => {
    if (mediaItems.length > 1) {
      const nextIndex = (currentIndex + 1) % mediaItems.length;
      selectImage(mediaItems[nextIndex].key);
    }
  }, [currentIndex, mediaItems, selectImage]);

  const navigateToPrev = useCallback(() => {
    if (mediaItems.length > 1) {
      const prevIndex = currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
      selectImage(mediaItems[prevIndex].key);
    }
  }, [currentIndex, mediaItems, selectImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, navigateToNext, navigateToPrev, onClose]);

  const rating = product.averageRating || product.rating || 0;
  const reviewCount = product.totalReviews || product.reviewCount || 0;

  // Get skills from various sources
  const skills = product.skills || 
                (product.specifications as any)?.skills || 
                product.tags || 
                [];

  const handleEdit = () => {
    onEdit?.(product);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(productId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-0 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:fixed max-sm:inset-0 max-sm:pt-[max(env(safe-area-inset-top),3rem)] max-sm:pb-[max(env(safe-area-inset-bottom),4rem)] max-sm:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 max-sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl max-sm:text-xl font-bold text-gray-900 dark:text-white">Product Details</h2>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                title="Edit Product"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Delete Product"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-sm:gap-4">
            {/* Left Column - Unified Media Gallery */}
            <div className="space-y-4">
              {/* Main Media Display with Navigation */}
              <div className="relative aspect-square max-sm:aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md group">
                {currentMedia?.type === 'video' ? (
                  <video 
                    controls 
                    className="w-full h-full object-contain"
                    src={currentMedia.url}
                    poster={mediaItems.find(item => item.type === 'image')?.url || fallbackImage}
                    preload="metadata"
                    key={currentMedia.key} // Force re-render when video changes
                  >
                    <source src={currentMedia.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={currentMedia?.url || fallbackImage}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isTransitioning ? 'opacity-70 scale-105' : 'opacity-100 scale-100'
                    }`}
                  />
                )}
                
                {/* Navigation Arrows (only show if multiple media items) */}
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={navigateToPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      title="Previous media (←)"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={navigateToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      title="Next media (→)"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Media Counter with Type Indicator */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {currentMedia?.type === 'video' && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                      {currentIndex + 1} / {mediaItems.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Enhanced Media Thumbnail Gallery */}
              {mediaItems.length > 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Media Gallery ({mediaItems.length} items)
                    </h4>
                    <span className="text-xs text-gray-500">
                      {currentIndex + 1} of {mediaItems.length}
                    </span>
                  </div>
                  
                  {/* Responsive Media Thumbnail Grid */}
                  <div className="relative">
                    <div className="grid grid-cols-6 max-sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 pr-2">
                      {mediaItems.map((media, index) => {
                        const isSelected = currentIndex === index;
                        const mediaItem = media as (ImageItem & { type: 'image' | 'video'; isPrimary?: boolean });
                        return (
                          <button
                            key={mediaItem.key}
                            onClick={() => selectImage(mediaItem.key)}
                            className={`relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg transform focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                              isSelected 
                                ? 'border-rose-500 ring-2 ring-rose-200 dark:ring-rose-800 shadow-md scale-105' 
                                : 'border-transparent hover:border-rose-300 dark:hover:border-rose-700'
                            }`}
                          >
                            {mediaItem.type === 'video' ? (
                              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                                <video 
                                  className="w-full h-full object-cover" 
                                  src={mediaItem.url}
                                  muted
                                  preload="metadata"
                                />
                                {/* Video play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={mediaItem.url}
                                alt={`${product.name} view ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            
                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                                <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                            
                            {/* Media type and number badge */}
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              {mediaItem.type === 'video' && (
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                              {index + 1}
                            </div>
                            
                            {/* Primary image indicator */}
                            {mediaItem.isPrimary && (
                              <div className="absolute top-1 right-1 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                ★
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Scroll hint for many items */}
                    {mediaItems.length > 12 && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Product Info */}
              <div>
                <div className="flex items-start max-sm:items-center justify-between mb-2 max-sm:flex-col max-sm:space-y-2">
                  <h1 className="text-3xl max-sm:text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                  <div className="flex items-center space-x-2">
                    {product.isActive !== undefined && (
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category and Brand */}
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
                    <Tag className="h-4 w-4 mr-1" />
                    {product.category}
                  </span>
                  {product.brand && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <Package className="h-4 w-4 mr-1" />
                      {product.brand}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {rating > 0 && (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">
                      <span>{rating.toFixed(1)}</span>
                      <Star className="h-4 w-4 ml-1 fill-current" />
                    </div>
                    {reviewCount > 0 && (
                      <span className="text-gray-500 text-sm ml-3">
                        ({reviewCount.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center flex-wrap gap-3 mb-6">
                  <span className="text-3xl max-sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xl max-sm:text-lg text-gray-500 dark:text-gray-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
                </div>

                {/* Skills/Tags */}
                {Array.isArray(skills) && skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills & Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {product.availability && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Availability</h3>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        product.availability.inStock 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {product.availability.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        Quantity: {product.availability.quantity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  {product.createdAt && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Created: {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  {product.updatedAt && (
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Last updated: {new Date(product.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Service Packages Section */}
          {product.specifications && typeof product.specifications === 'object' && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Service Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(product.specifications)
                  .filter(([_, value]) => value && typeof value === 'object')
                  .map(([tierName, tierData]) => (
                    <TierSpecificationCard
                      key={tierName}
                      tierName={tierName}
                      tierData={tierData}
                      formatCurrency={formatCurrency}
                    />
                  ))}
              </div>
              
              {/* Fallback for non-tier specifications */}
              {Object.entries(product.specifications).some(([_, value]) => value && typeof value !== 'object') && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Additional Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(product.specifications)
                      .filter(([_, value]) => typeof value !== 'object')
                      .map(([key, value]) => (
                        <div key={key} className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="delete"
        requireTextConfirmation={true}
        confirmationText={product.name}
        confirmationPlaceholder="Type product name to confirm"
      />
    </div>
  );
};