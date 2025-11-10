import React from 'react';
import { X, Star, Tag, Calendar, Package, Eye } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

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
}

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const { formatCurrency } = useCurrency();

  if (!isOpen) return null;

  const productId = product.id || product.productId || '';
  const primaryImage = product.images?.find(img => img.isPrimary)?.url || 
                      product.images?.[0]?.url || 
                      'https://via.placeholder.com/600x400?text=No+Image';

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
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDelete?.(productId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-0 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:fixed max-sm:inset-0 max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)] max-sm:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 max-sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl max-sm:text-xl font-bold text-gray-900 dark:text-white">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-sm:gap-4">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div className="aspect-square max-sm:aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Additional Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 max-sm:grid-cols-3 gap-2">
                  {product.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
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

                {/* Specifications */}
                {product.specifications && typeof product.specifications === 'object' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Specifications</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
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
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-4 max-sm:flex-col max-sm:space-x-0 max-sm:space-y-3 p-6 max-sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 max-sm:w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors max-sm:order-3"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 max-sm:w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors max-sm:order-1"
            >
              Edit Product
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 max-sm:w-full bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors max-sm:order-2"
            >
              Delete Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
};