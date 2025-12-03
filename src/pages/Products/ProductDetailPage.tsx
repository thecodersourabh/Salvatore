import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductService } from '../../services/productService';
import { usePageBackButton } from '../../hooks/useBackButton';
import { ProductResponse } from '../../services/productService';
import { ArrowLeft, Loader2, Star, Tag, Package, Share2, Clock, CheckCircle, Edit, ChevronLeft, ChevronRight, X, Home, Trash2 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Transform product images and video for the unified gallery
  const mediaItems = product ? [
    // Add images first
    ...(product.images || []).map((img, index) => ({
      url: img.url,
      type: 'image' as const,
      isPrimary: img.isPrimary,
      index
    })),
    // Add video if exists
    ...(product.videoKey || product.videoUrl ? [{
      url: product.videoUrl || '',
      type: 'video' as const,
      isPrimary: false,
      index: (product.images || []).length
    }] : [])
  ] : [];

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setError('Product ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const productData = await ProductService.getProductById(productId);
        setProduct(productData);
      } catch (err: any) {
        console.error('Error loading product:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // Handle Android back button
  usePageBackButton(() => {
    navigate('/', { replace: true });
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await ProductService.deleteProduct(productId!);
      navigate('/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleShare = () => {
    const productUrl = `${window.location.origin}/products/${productId}`;
    if (navigator.share) {
      navigator.share({ 
        title: product?.name || 'Product', 
        text: product?.description || '',
        url: productUrl
      });
    } else {
      navigator.clipboard.writeText(productUrl).then(() => {
        alert('Product link copied to clipboard!');
      });
    }
  };

  const isOwner = user && product && (
    (user as any).id === product.createdBy || 
    (user as any).sub === product.createdBy ||
    (user as any).email === product.createdByName
  );

  const isSeller = user && ((user as any).role === 'seller' || (user as any).userType === 'seller');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'The product you\'re looking for could not be found.'}
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const images = product?.images || [];
  const currentMedia = mediaItems[currentImageIndex];
  const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url || 'https://via.placeholder.com/600x400?text=No+Image';
  const rating = product.averageRating || (product as any).rating || 0;
  const reviewCount = product.totalReviews || (product as any).reviewCount || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Details
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-colors"
                title="Share Product"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              {(isOwner || isSeller) && (
                <>
                  <button
                    onClick={() => navigate(`/add-product?edit=${productId}`)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Edit Product"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {currentMedia?.type === 'video' ? (
                <video 
                  controls 
                  className="w-full h-full object-contain"
                  src={currentMedia.url}
                  poster={images[0]?.url || primaryImage}
                  preload="metadata"
                  key={currentMedia.url} // Force re-render when video changes
                >
                  <source src={currentMedia.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={currentMedia?.url || primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Image/Video Navigation */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === mediaItems.length - 1 ? 0 : prev + 1)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  {/* Media indicators with type */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {mediaItems.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        title={media.type === 'video' ? 'Video' : 'Image'}
                      />
                    ))}
                  </div>
                  
                  {/* Media type and counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {currentMedia?.type === 'video' && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                    {currentImageIndex + 1} / {mediaItems.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Media Gallery */}
            {mediaItems.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {mediaItems.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 relative ${
                      index === currentImageIndex ? 'border-rose-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                        <video 
                          className="w-full h-full object-cover" 
                          src={media.url}
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
                        src={media.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Media type badge */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded font-medium">
                      {media.type === 'video' ? 'V' : 'I'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
              
              {/* Status Badge */}
              {product.isActive !== undefined && (
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${
                  product.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              )}

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

              {/* Price */}
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.price)}
                </span>
                {(product as any).originalPrice && (product as any).originalPrice > product.price && (
                  <span className="text-2xl text-gray-500 dark:text-gray-400 line-through">
                    {formatCurrency((product as any).originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </div>

              {/* Skills/Tags */}
              {Array.isArray(product.skills || product.tags) && (product.skills || product.tags)?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.skills || product.tags)?.map((skill: string, index: number) => (
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
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {product.availability.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.availability.quantity && (
                      <span className="text-gray-600 dark:text-gray-300">
                        Quantity: {product.availability.quantity}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Packages */}
        {product.specifications && typeof product.specifications === 'object' && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Service Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(product.specifications)
                .filter(([_, value]) => value && typeof value === 'object')
                .map(([tierName, tierData]: [string, any]) => (
                  <div key={tierName} className="border rounded-lg p-6 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        tierName.toLowerCase() === 'basic' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        tierName.toLowerCase() === 'standard' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}>
                        {tierName}
                      </span>
                      {tierData.price && (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(tierData.price)}
                        </span>
                      )}
                    </div>
                    
                    {tierData.deliveryTime && (
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Delivery: {tierData.deliveryTime}
                        </span>
                      </div>
                    )}
                    
                    {tierData.revisions && (
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Revisions: {tierData.revisions}
                        </span>
                      </div>
                    )}

                    {Array.isArray(tierData.features) && tierData.features.length > 0 && (
                      <div className="mt-3">
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {tierData.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-3 w-3 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="delete"
        requireTextConfirmation={true}
        confirmationText={product?.name || ""}
        confirmationPlaceholder="Type product name to confirm"
      />
    </div>
  );
};