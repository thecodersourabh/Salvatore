import React, { useState } from 'react';
import { Star, Eye, Edit, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface Product {
  id?: string;
  productId?: string;  // API returns productId instead of id
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  images?: ProductImage[];
  tags?: string[];
  skills?: string[];
  specifications?: any;  // API specifications can vary in structure
  rating?: number;
  reviewCount?: number;
  averageRating?: number;  // API field for average rating
  totalReviews?: number;   // API field for total reviews
  totalRatings?: number;   // API field for total ratings
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onToggleActive?: (productId: string) => void;
  onView?: (product: Product) => void;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleActive,
  onView,
  showActions = true
}) => {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  // Get the product ID from either id or productId field
  const productId = product.id || product.productId || '';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(productId);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive?.(productId);
  };

  const handleView = () => {
    navigate(`/products/${productId}`);
  };

  const primaryImage = product.images?.find(img => img.isPrimary)?.url || 
                      product.images?.[0]?.url || 
                      'https://via.placeholder.com/300x200?text=No+Image';

  const discountPercentage = product.originalPrice && product.price < product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer"
         onClick={handleView}>
      
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        {product.isActive !== undefined && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              product.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercentage && (
          <div className="absolute top-2 right-2">
            <span className="bg-rose-500 text-white px-2 py-1 text-xs font-bold rounded">
              -{discountPercentage}%
            </span>
          </div>
        )}


      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category and Rating */}
        <div className="flex items-center justify-between mb-2">
          {product.category && (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded">
              {product.category}
            </span>
          )}
          
          {/* Rating Display */}
          {(product.averageRating !== undefined || product.rating !== undefined) && (
            <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
              <span>{(product.averageRating || product.rating || 0).toFixed(1)}</span>
              <Star className="h-3 w-3 ml-1 fill-current" />
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm leading-tight">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
          {product.description}
        </p>



        {/* Tags/Skills */}
        {(() => {
          // Get skills from product.skills or specifications.skills
          const skills = product.skills || 
                        (product.specifications as any)?.skills || 
                        product.tags || 
                        [];
          
          if (Array.isArray(skills) && skills.length > 0) {
            return (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 3).map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{skills.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {(() => {
                // Check if product has package specifications with Basic tier
                const basicPackage = product.specifications?.Basic;
                if (basicPackage && basicPackage.price) {
                  return formatCurrency(Math.round(Number(basicPackage.price) || 0));
                }
                // Fallback to regular product price
                return formatCurrency(product.price);
              })()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {(() => {
            // Show "Basic Package" indicator if using package pricing
            const basicPackage = product.specifications?.Basic;
            if (basicPackage && basicPackage.price) {
              return (
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  Basic
                </span>
              );
            }
            return null;
          })()}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {onToggleActive && (
                <button
                  onClick={handleToggleActive}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    product.isActive
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                  }`}
                >
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
                className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const productUrl = `${window.location.origin}/products/${productId}`;
                  if (navigator.share) {
                    navigator.share({ 
                      title: product.name, 
                      text: product.description,
                      url: productUrl
                    });
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(productUrl).then(() => {
                      // You could show a toast notification here
                      alert('Product link copied to clipboard!');
                    });
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
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
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmText="Delete"
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