import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sectorServices from "../../config/sectorServices.json";
import packageTierTemplates from "../../config/packageTierTemplates.json";
import { Edit2, Check, X as XIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ProductService } from "../../services/cachedServices";
import { ProductService as BaseProductService } from "../../services/productService";
import { ImageService } from "../../services/imageService";
import { UserService } from "../../services/userService";
import { MobileSelect } from "../ui/MobileSelect";


// Slices and hooks
import { useProductFormPermissions } from './useProductFormPermissions';
import { useProductMedia } from './useProductMedia';
import { useProductFormState } from './useProductFormState';
import { MediaUploadSection } from './ProductFormSections';

// NOTE: features are now driven by template questions; no helper fallback is required

interface ProductFormProps {
  ownerId?: string | null; // if editing an existing product, pass ownerId to control edit permissions
  editProductId?: string | null; // product ID to edit, if in edit mode
}

export const ProductForm: React.FC<ProductFormProps> = ({ ownerId: _ownerId = null, editProductId = null }) => {

  const sectors = useMemo(() => Object.keys(sectorServices), []);

  // Hooks: permissions, media and form state
  const { authUser, canEdit, hasPermission } = useProductFormPermissions({ useAuth });
  const media = useProductMedia();
  const form = useProductFormState({ editProductId, onSetExistingImages: media.setExistingImages, onSetExistingVideos: media.setExistingVideos });

  // Unpack commonly used form & media values for backward compatibility with existing JSX
  const {
    category, setCategory,
    serviceList,
    selectedService, setSelectedService,
    selectedServiceNames, setSelectedServiceNames,
    tags, setTags,
    tier, setTier,
    prices, setPrices,
    deliveryTimes, setDeliveryTimes,
    editingTier, setEditingTier,
    fullFormAnswersPerTier, setFullFormAnswersPerTier,
    interp,
    loading: formLoading,
    // product-specific fields
    productName, setProductName,
    brand, setBrand,
    sku, setSku,
    productPrice, setProductPrice,
    stock, setStock,
    productDescription, setProductDescription,
    // attributes & variants
    attributes, setAttributes,
    variants, setVariants,
    // type
    type, setType,
  } = form;

  // Fallback mapping from top-level sector to packageTierTemplates category key
  const sectorToCategoryMap: Record<string, string> = {
    Technology: 'DIGITAL_REMOTE',
    Electrician: 'PHYSICAL_ONSITE',
    Plumber: 'PHYSICAL_ONSITE',
    Carpenter: 'PHYSICAL_ONSITE',
    Mechanic: 'PHYSICAL_ONSITE',
    Tailor: 'PHYSICAL_ONSITE',
    Beautician: 'PHYSICAL_ONSITE',
    Cleaner: 'PHYSICAL_ONSITE',
    Painter: 'PHYSICAL_ONSITE',
    Gardener: 'PHYSICAL_ONSITE',
    Tutor: 'EDUCATION',
    Chef: 'CULINARY',
    Agency: 'CONSULTATION',
    Courier: 'LOGISTICS',
    Healthcare: 'HEALTHCARE',
    Astrologer: 'CONSULTATION',
    Other: 'PHYSICAL_ONSITE'
  };

  const {
    images, setImages,
    imagePreviews, setImagePreviews,
    existingImages,
    videos,
    videoPreviews,
    existingVideos,
    isDragging,
    handleImageAdd, handleRemoveImage,
    handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
    handleVideoAdd, handleRemoveVideo,
    imageUploadProgress, videoUploadProgress,
    uploadImages, uploadSmallVideos, startBackgroundVideoUploads
  } = media;

  // Toast state for validation feedback
  const [validationError, setValidationError] = useState('');
  const [validationField, setValidationField] = useState('');

  // Early permission check - show permission message if user doesn't have access
  if (authUser && !hasPermission) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0 pt-16 md:pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Seller Permissions Required
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  You need seller permissions to create and manage products. Currently, your account has <strong>{authUser.role || 'Customer'}</strong> access.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={async () => {
                      try {
                        if (!authUser?.email) return;
                        
                        // Try to update user role to seller
                        const updatedUser = await UserService.updateUser(authUser.email, { 
                          role: 'seller' 
                        });
                        
                        if (updatedUser) {
                          // Force auth context to refresh
                          window.dispatchEvent(new CustomEvent('auth-state-refresh'));
                          showSuccessMessage('Your account has been upgraded to seller! The page will refresh automatically.');
                          
                          // Redirect to refresh the page
                          setTimeout(() => {
                            window.location.reload();
                          }, 2000);
                        }
                      } catch (error) {
                        console.error('Role upgrade failed:', error);
                        showValidationError('Failed to upgrade account. Please contact support.', 'error');
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Upgrade to Seller Account
                  </button>
                  <br />
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>
                </div>
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Need Help?</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Contact our support team at <strong>support@salvatore.app</strong> to upgrade your account or if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }



  // Prevent default drag behavior on the document
  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  // Debug effect to track video upload progress
  useEffect(() => {

  }, [videoUploadProgress]);

  // Validation helper function
  const showValidationError = (message: string, field: string = '') => {
    setValidationError(message);
    setValidationField(field);
    
    // Clear validation error after 5 seconds
    setTimeout(() => {
      setValidationError('');
      setValidationField('');
    }, 5000);
  };

  const showSuccessMessage = (message: string) => {
    setValidationError(message); // Use the message for display
    setValidationField('success');
    setTimeout(() => {
      setValidationError('');
      setValidationField('');
    }, 3000);
  };

  // Media handlers are provided by the `useProductMedia` hook (unified slice above)

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  // Update service list when category changes (moved to form state)
  useEffect(() => {
    if (!form.category) return form.setServiceList([]);
    const list = (sectorServices as any)[form.category]?.services || [];
    form.setServiceList(list);
    if (!editProductId && !form.loading) {
      form.setSelectedService(null);
    }
  }, [form.category, editProductId, form.loading]);

  // Load existing product data if in edit mode
  useEffect(() => {
    const loadProductForEditing = async () => {
      if (!editProductId) return;
      
      form.setLoading(true);
      try {
        const product = await ProductService.getProduct(editProductId);
        
        if (!product) {
          throw new Error('Product not found');
        }
        
        // Transform product data to form format
        const formData = BaseProductService.transformProductResponseToFormData(product);
        
        // Populate form fields
        form.setCategory(formData.category);
        form.setSelectedServiceNames(formData.serviceNames);
        form.setTags(formData.tags);
        form.setTier(formData.tier);
        form.setPrices(formData.prices);
        form.setDeliveryTimes(formData.deliveryTimes);
        form.setFullFormAnswersPerTier(formData.fullFormAnswersPerTier);
        
        // Load existing images from product into media slice
        if (product.images && product.images.length > 0) {
          media.setExistingImages(product.images);

          // Clear any new images since we're loading existing ones
          media.setImages([]);
          media.setImagePreviews([]);
        }
        
        // Load existing video from product
        if (product.videoKey) {
          const videoUrl = ImageService.getImageUrl(product.videoKey);
          media.setExistingVideos([{ url: videoUrl }]);
          media.setVideos([]);
          media.setVideoPreviews([]);
        }
        
      } catch (error) {
        console.error('Failed to load product for editing:', error);
      } finally {
        form.setLoading(false);
      }
    };

    loadProductForEditing();
  }, [editProductId]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (submitting) {
      return;
    }
    

    
    if (!authUser?.userId) {
      showValidationError('You must be logged in to create or update products. Please log in and try again.', 'auth');
      return;
    }
    
    if (type === 'service') {
      if (!selectedService?.name) {
        const action = editProductId ? 'update' : 'create';
        showValidationError(`Please select a service before ${action === 'update' ? 'updating' : 'creating'} the product`, 'service');
        return;
      }

      // Validate pricing for at least the basic tier
      const basicPrice = prices.Basic;
      if (!basicPrice || Number(basicPrice) <= 0 || isNaN(Number(basicPrice))) {
        const action = editProductId ? 'update' : 'create';
        showValidationError(`Please set a valid price for at least the Basic tier to ${action} the product`, 'price');
        return;
      }

      // Validate delivery times for basic tier
      const basicDeliveryTime = deliveryTimes.Basic;
      if (!basicDeliveryTime || Number(basicDeliveryTime) <= 0 || isNaN(Number(basicDeliveryTime))) {
        const action = editProductId ? 'update' : 'create';
        showValidationError(`Please set a valid delivery time for at least the Basic tier to ${action} the product`, 'delivery');
        return;
      }
    } else {
      // Product specific validation
      if (!productName || !brand || !sku) {
        showValidationError('Please fill in the required product details (Name, Brand, SKU)', 'product');
        return;
      }

      if (!productPrice || Number(productPrice) <= 0 || isNaN(Number(productPrice))) {
        showValidationError('Please set a valid product price', 'productPrice');
        return;
      }

      if (stock === '' || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
        showValidationError('Please set a valid stock quantity', 'stock');
        return;
      }

      if (!productDescription || productDescription.trim() === '') {
        showValidationError('Please provide a product description', 'description');
        return;
      }
    }

    // Image validation - different rules for create vs update
    if (!editProductId) {
      // For new products/services, must have at least one image
      if (!images || images.length === 0) {
        showValidationError('Please add at least one image to create a product', 'images');
        return;
      }
    } else {
      // For updates, must have at least one image total (existing + new)
      const totalImages = (existingImages?.length || 0) + (images?.length || 0);
      if (totalImages === 0) {
        showValidationError('Product must have at least one image', 'images');
        return;
      }
    }

    // Build product metadata using the service interface
    const productData: any = {
      category,
      name: type === 'product' ? productName : selectedService?.name,
      serviceNames: type === 'service' ? selectedServiceNames : [],
      tier: type === 'service' ? tier : undefined,
      prices: type === 'service' ? prices : { Basic: productPrice },
      deliveryTimes: type === 'service' ? deliveryTimes : {},
      fullFormAnswersPerTier: type === 'service' ? fullFormAnswersPerTier : {},
      tags,
      // product-specific fields
      productName,
      brand,
      sku,
      productPrice,
      stock,
      productDescription,
    };

    setSubmitting(true);
    try {
      
      if (editProductId) {
        // Update existing product
        
        // Combine existing images with new images for the update
        let allImages: Array<{url: string, isPrimary: boolean, order: number}> = [];
        
        // Add existing images first
        if (existingImages.length > 0) {
          allImages = existingImages.map((img, index) => ({
            url: img.url,
            isPrimary: img.isPrimary || index === 0,
            order: index + 1
          }));
        }
        
        // If user added new images, upload them and add to the array
        if (images.length > 0) {
          try {
            const newImageKeys = await uploadImages(images);
            const newImageObjects = newImageKeys.map((key, index) => ({
              url: ImageService.getImageUrl(key),
              isPrimary: allImages.length === 0 && index === 0,
              order: allImages.length + index + 1
            }));
            allImages = [...allImages, ...newImageObjects];
          } catch (imageError) {
            console.error('Failed to upload new images:', imageError);
            throw new Error('Failed to upload new images');
          }
        }
        
        // Update product with all images (existing + new)
        const apiProductData = BaseProductService.transformFormDataToApiFormat(productData, allImages.map(img => img.url));
        // Manually add the images array since transformFormDataToApiFormat might not handle this correctly
        (apiProductData as any).images = allImages;

        // Handle video updates for existing products
        if (videos.length > 0) {
          // User added new videos
          const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
          const smallVideos = videos.filter(v => v.size < (10 * 1024 * 1024));
          const largeVideos = videos.filter(v => v.size >= (10 * 1024 * 1024));
          
          // Upload small videos synchronously
          if (smallVideos.length > 0) {
            try {
              const videoKeys = await uploadSmallVideos(smallVideos);
              if (videoKeys.length > 0) {
                (apiProductData as any).videoKey = videoKeys[0];
                (apiProductData as any).videoUrl = ImageService.getImageUrl(videoKeys[0]);
              }
            } catch (videoError) {
              console.error('Failed to upload videos:', videoError);
              throw new Error('Failed to upload videos');
            }
          }

          // Start background uploads for large videos
          if (largeVideos.length > 0) {
            const productIdForUpdate = editProductId;
            largeVideos.forEach(video => {
              startBackgroundVideoUploads([video], username, async (key) => {
                if (productIdForUpdate) {
                  try {
                    await ProductService.updateProduct(productIdForUpdate, {
                      videoKey: key,
                      videoUrl: ImageService.getImageUrl(key)
                    });
                  } catch (err) {
                    console.error('Failed to update product with video after upload:', err);
                  }
                }
              }, (err) => {
                console.error('Background video upload failed:', err);
              });
            });
          }
        } else if (existingVideos.length === 0) {
          // User removed existing videos and didn't add new ones
          (apiProductData as any).videoKey = null;
          (apiProductData as any).videoUrl = null;
        }
        
        await ProductService.updateProduct(editProductId, apiProductData);
        
        showSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
        
        // Check if we have videos that need uploading
        if (videos.length > 0) {
          // Separate small and large videos
          const smallVideos = videos.filter(v => v.size < (10 * 1024 * 1024));
          const largeVideos = videos.filter(v => v.size >= (10 * 1024 * 1024) && v.size <= (200 * 1024 * 1024));
          
          if (largeVideos.length > 0) {
            // Large videos present - create product first, then upload videos in background
            const newProduct = await ProductService.createProduct({
              productData,
              images,
              videos: smallVideos, // Include small videos synchronously
            });
            
            const productId = newProduct.productId || newProduct.id;
            if (productId) {
              largeVideos.forEach(video => {
                startBackgroundVideoUploads([video], username, async (key) => {
                  try {
                    await ProductService.updateProduct(productId, {
                      videoKey: key,
                      videoUrl: ImageService.getImageUrl(key)
                    });
                  } catch (err) {
                    console.error('Failed to update new product with video after upload:', err);
                  }
                }, (err) => {
                  showValidationError(`Failed to upload video: ${err}`, 'general');
                });
              });
            }
            
            showSuccessMessage('Product created successfully! Large videos are uploading in background.');
          } else {
            // All small videos - upload everything synchronously
            await ProductService.createProduct({
              productData,
              images,
              videos: smallVideos,
            });
            showSuccessMessage('Product created successfully with videos!');
          }
        } else {
          // No videos - regular create
          await ProductService.createProduct({
            productData,
            images,
          });
          showSuccessMessage('Product created successfully!');
        }
      }
      
      // After successful operation, redirect to dashboard
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Product operation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const operation = editProductId ? 'update' : 'create';
      showValidationError(`Failed to ${operation} product: ${errorMessage}`, 'general');
    } finally {
      setSubmitting(false);
    }
  };

  // Comprehensive validation function to check if form is complete
  const isFormValid = useMemo(() => {
    if (!hasPermission) return false;
    if (!category) return false;

    // Type-specific checks
    if (type === 'service') {
      if (!selectedService) return false;

      if (!editProductId) {
        if (!images || images.length === 0) return false;
      } else {
        const totalImages = (existingImages?.length || 0) + (images?.length || 0);
        if (totalImages === 0) return false;
      }

      const basicPrice = prices.Basic;
      if (!basicPrice || Number(basicPrice) <= 0 || isNaN(Number(basicPrice))) return false;

      const basicDeliveryTime = deliveryTimes.Basic;
      if (!basicDeliveryTime || Number(basicDeliveryTime) <= 0 || isNaN(Number(basicDeliveryTime))) return false;

      const sectorToCategoryMap: Record<string, string> = {
        Technology: 'DIGITAL_REMOTE', Electrician: 'PHYSICAL_ONSITE', Plumber: 'PHYSICAL_ONSITE', Carpenter: 'PHYSICAL_ONSITE', Mechanic: 'PHYSICAL_ONSITE', Tailor: 'PHYSICAL_ONSITE', Beautician: 'PHYSICAL_ONSITE', Cleaner: 'PHYSICAL_ONSITE', Painter: 'PHYSICAL_ONSITE', Gardener: 'PHYSICAL_ONSITE', Tutor: 'EDUCATION', Chef: 'CULINARY', Agency: 'CONSULTATION', Courier: 'LOGISTICS', Healthcare: 'HEALTHCARE', Astrologer: 'CONSULTATION', Other: 'PHYSICAL_ONSITE'
      };

      const commonQs: string[] = Object.keys((packageTierTemplates as any).commonQuestions || {});
      const categoryKey = selectedService?.category || sectorToCategoryMap[category || ''] || 'PHYSICAL_ONSITE';
      const catQs: string[] = Object.keys(((packageTierTemplates as any).categoryQuestions?.[categoryKey]) || {});
      const serviceQsPerTier: Record<string, Record<string, string>> = (selectedService?.packageTiers?.ServiceQuestions) || {};
      const reqMap: Record<string, boolean> = (selectedService?.packageTiers?.requiredMap) || {};

      const keysFromServiceQuestions = Object.values(serviceQsPerTier || {}).reduce<string[]>((acc, obj) => acc.concat(Object.keys(obj || {})), []);
      const allQs = Array.from(new Set([...commonQs, ...catQs, ...keysFromServiceQuestions, ...Object.keys(reqMap || {})]));

      for (const qKey of allQs) {
        const isRequired = !!(reqMap && reqMap[qKey]);
        if (isRequired) {
          const answer = fullFormAnswersPerTier[tier]?.[qKey];
          if (!answer || answer.trim() === '') return false;
        }
      }

      return true;
    }

    // product specific checks
    if (type === 'product') {
      if (!productName || !brand || !sku) return false;
      if (!productPrice || Number(productPrice) <= 0 || isNaN(Number(productPrice))) return false;
      if (stock === '' || stock === null || isNaN(Number(stock)) || Number(stock) < 0) return false;
      if (!productDescription || productDescription.trim() === '') return false;

      if (!editProductId) {
        if (!images || images.length === 0) return false;
      } else {
        const totalImages = (existingImages?.length || 0) + (images?.length || 0);
        if (totalImages === 0) return false;
      }

      return true;
    }

    return false;
  }, [hasPermission, category, selectedService, images, existingImages, prices, deliveryTimes, fullFormAnswersPerTier, tier, editProductId, packageTierTemplates, productName, brand, sku, productPrice, stock, productDescription, type]);

  // categoryForSelected removed (not needed when features are template-driven)

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
        {/* Fixed sub-header positioned below main navigation */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-full shadow-md sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-1 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Title only */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {editProductId ? 'Edit Service' : 'Create New Service'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    {editProductId 
                      ? 'Update your service details and pricing'
                      : 'Set up your service packages and pricing'
                    }
                  </p>
                </div>
              </div>

              {/* Right side - Submit button */}
              <div className="flex-shrink-0 ml-2">
                {/* Submit button */}
                <button 
                  type="submit" 
                  form="product-form"
                  disabled={submitting || !isFormValid} 
                  className={`relative px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    (submitting || !isFormValid) ? 'opacity-60 cursor-not-allowed hover:transform-none hover:shadow-lg' : ''
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold">{editProductId ? 'Update' : 'Create'}</span>
                    </>
                  )}
                  
                  {/* Subtle glow effect when enabled */}
                  {!submitting && isFormValid && (
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-700 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Loading State */}
        {formLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading product data...</span>
            </div>
          </div>
        )}

        {!formLoading && (
        <form id="product-form" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">{/* Submit button */}
          {/* Loading Overlay */}
          {submitting && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 w-96">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-600 border-t-transparent"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{editProductId ? 'Updating Service...' : 'Creating Service...'}</div>
                    <div className="text-xs text-gray-500">This may take a few minutes for large videos. Please keep this window open.</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(imageUploadProgress !== null) && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Uploading images — {imageUploadProgress}%</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div style={{ width: `${imageUploadProgress}%` }} className="h-2 bg-rose-600"></div>
                      </div>
                    </div>
                  )}

                  {(videoUploadProgress !== null) && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Uploading video — {videoUploadProgress}%</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div style={{ width: `${videoUploadProgress}%` }} className="h-2 bg-blue-600"></div>
                      </div>
                    </div>
                  )}

                  {(imageUploadProgress === null && videoUploadProgress === null) && (
                    <div className="text-sm text-gray-600">Preparing files for upload...</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* header is fixed; mobile button removed to avoid duplicates */}
          
          <div className="p-4 sm:p-6 space-y-8">
        {/* Sector & Service selectors */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              {/* Mobile Select - visible only on small screens */}
              <div className="block md:hidden">
                <MobileSelect
                  label="Sector"
                  value={category || ""}
                  placeholder="Choose a sector"
                  options={sectors.map(s => ({ value: s, label: s }))}
                  onChange={(value) => setCategory(value || null)}
                  required
                  disabled={submitting}
                  className=""
                />
              </div>
              
              {/* Desktop Select - visible only on medium screens and up */}
              <div className="hidden md:block space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Sector <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={category || ""} 
                  onChange={(e) => setCategory(e.target.value || null)} 
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={submitting}
                >
                  <option value="">Choose a sector</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              {/* Mobile Select - visible only on small screens */}
              <div className="block md:hidden">
                <MobileSelect
                  label="Service / Template"
                  value={selectedService?.name || ""}
                  placeholder={!category ? "Select a sector first" : "Choose a service template"}
                  options={serviceList.map((s: any) => ({ value: s.name, label: s.name }))}
                  onChange={(value) => {
                    setSelectedServiceNames(value ? [value] : []);
                    const svc = serviceList.find((s: any) => s.name === value) || null;
                    setSelectedService(svc);
                    setTags([]);
                  }}
                  required
                  disabled={!category || submitting}
                  className=""
                />
              </div>
              
              {/* Desktop Select - visible only on medium screens and up */}
              <div className="hidden md:block space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Service / Template <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={selectedService?.name || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedServiceNames(val ? [val] : []);
                    const svc = serviceList.find((s: any) => s.name === val) || null;
                    setSelectedService(svc);
                    setTags([]);
                  }} 
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!category || submitting}
                >
                  <option value="">
                    {!category ? "Select a sector first" : "Choose a service template"}
                  </option>
                  {serviceList.map((s: any) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Skills/Tags selector with modern checkbox style */}
          {selectedService && (() => {
            const allSkills = new Set<string>();
            
            // Add skills from selected service names
            selectedServiceNames.forEach((name) => {
              const svc = serviceList.find((s: any) => s.name === name);
              (svc?.skills || []).forEach((sk: string) => allSkills.add(sk));
            });
            
            // Add skills from the currently selected service as fallback
            if (allSkills.size === 0 && selectedService?.skills) {
              (selectedService.skills || []).forEach((sk: string) => allSkills.add(sk));
            }
            
            // In edit mode, also include any previously saved tags that might not be in the service definitions
            if (editProductId && tags.length > 0) {
              tags.forEach((tag: string) => allSkills.add(tag));
            }
            
            const skillsArray = Array.from(allSkills).filter(Boolean); // Remove any empty strings
            
            return skillsArray.length > 0 ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tags/Skills <span className="text-gray-500 text-xs">(select relevant skills)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {skillsArray.map((skill) => (
                    <label key={skill} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tags.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTags(prev => [...prev, skill]);
                          } else {
                            setTags(prev => prev.filter(t => t !== skill));
                          }
                        }}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{skill}</span>
                    </label>
                  ))}
                </div>
                {tags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Selected skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                            className="ml-1.5 h-3 w-3 flex items-center justify-center rounded-full hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>        

        {/* Media uploads: images + video */}
        <MediaUploadSection
          images={images}
          imagePreviews={imagePreviews}
          existingImages={existingImages}
          videos={videos}
          videoPreviews={videoPreviews}
          existingVideos={existingVideos}
          handleImageAdd={handleImageAdd}
          handleRemoveImage={handleRemoveImage}
          handleVideoAdd={handleVideoAdd}
          handleRemoveVideo={handleRemoveVideo}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          isDragging={isDragging}
          submitting={submitting}
          imageUploadProgress={imageUploadProgress}
          videoUploadProgress={videoUploadProgress}
          showValidationError={showValidationError}
        />

        {/* Product or Service Switch */}
        <div className="mt-8 flex items-center space-x-6">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Type:</span>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="product"
              checked={type === 'product'}
              onChange={() => setType('product')}
              className="form-radio text-rose-600"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-200">Product</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="service"
              checked={type === 'service'}
              onChange={() => setType('service')}
              className="form-radio text-rose-600"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-200">Service</span>
          </label>
        </div>

        {/* Conditional fields based on type */}
        {type === 'product' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Product Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={productName || ''}
                onChange={e => setProductName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={submitting}
              />
            </div>
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Brand <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={brand || ''}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={submitting}
              />
            </div>
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">SKU <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={sku || ''}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={submitting}
              />
            </div>
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Price (₹) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                value={productPrice || ''}
                onChange={e => setProductPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={submitting}
              />
            </div>
            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                value={stock || ''}
                onChange={e => setStock(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={submitting}
              />
            </div>
            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description <span className="text-rose-500">*</span></label>
              <textarea
                value={productDescription || ''}
                onChange={e => setProductDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
                rows={4}
                required
                disabled={submitting}
              />
            </div>

          

                {variants.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-300">
                          <th className="py-2">Variant</th>
                          <th className="py-2">SKU</th>
                          <th className="py-2">Price (₹)</th>
                          <th className="py-2">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => (
                          <tr key={v.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="py-3">
                              <div className="text-sm">{Object.entries(v.attrs).map(([k,val]) => `${k}: ${val}`).join(' • ')}</div>
                            </td>
                            <td className="py-3">
                              <input value={v.sku || ''} onChange={(e) => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, sku: e.target.value } : x))} className="w-full px-2 py-1 rounded border" />
                            </td>
                            <td className="py-3">
                              <input type="number" value={v.price as any || ''} onChange={(e) => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, price: e.target.value === '' ? '' : Number(e.target.value) } : x))} className="w-full px-2 py-1 rounded border" />
                            </td>
                            <td className="py-3">
                              <input type="number" value={v.stock as any || ''} onChange={(e) => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, stock: e.target.value === '' ? '' : Number(e.target.value) } : x))} className="w-full px-2 py-1 rounded border" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
        )}

        {/* Service Tiers - Only show for service */}
        {type === 'service' && (
          <>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Packages</h2>
                <span className="text-sm text-gray-500">Choose and configure your service tiers</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['Basic','Standard','Premium'].map((t) => {
                  const isActive = tier === t;
                  const tierAccents = {
                    Basic: 'text-blue-600 dark:text-blue-400',
                    Standard: 'text-emerald-600 dark:text-emerald-400',
                    Premium: 'text-purple-600 dark:text-purple-400'
                  };
                  
                  return (
                    <div key={t} className="relative">
                      {canEdit && (
                        <div className="flex justify-end mb-2 space-x-1">
                          {editingTier === t ? (
                            <>
                              <button type="button" onClick={() => setEditingTier(null)} title="Cancel" disabled={submitting} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <XIcon size={16} className="text-gray-500" />
                              </button>
                              <button type="button" onClick={() => setEditingTier(null)} title="Save" disabled={submitting} className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Check size={16} />
                              </button>
                            </>
                      ) : (
                        <button type="button" onClick={() => setEditingTier(t)} title="Edit tier" disabled={submitting} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  )}

                  <div 
                    className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-lg transform scale-105' 
                        : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md`
                    }`}
                    onClick={() => setTier(t)}
                  >
                    {/* Tier Header */}
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} mr-2`}></div>
                        <h3 className={`text-lg font-bold ${isActive ? 'text-rose-900 dark:text-rose-100' : 'text-gray-900 dark:text-white'}`}>
                          {t}
                        </h3>
                      </div>
                      
                      <div className={`text-2xl font-bold ${isActive ? 'text-rose-600' : tierAccents[t as keyof typeof tierAccents]} mb-1`}>
                        ₹{(prices[t] !== "" ? prices[t] : '—')}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {deliveryTimes[t] !== "" 
                          ? `${deliveryTimes[t]} ${selectedService?.timeUnit || 'days'}` 
                          : 'Set delivery time'
                        }
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {t === 'Basic' ? 'Most affordable option' : 
                         t === 'Standard' ? 'Most popular choice' : 
                         'Premium features included'}
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Selected
                        </span>
                      </div>
                    )}

                    {/* Features removed — handled via template-driven questions */}

                    {/* Service Configuration Form */}
                    {( ((packageTierTemplates as any).commonQuestions && Object.keys((packageTierTemplates as any).commonQuestions).length > 0) || (selectedService?.packageTiers?.categoryQuestions && (selectedService?.packageTiers?.categoryQuestions.length > 0)) || (selectedService?.packageTiers?.ServiceQuestions && Object.keys(selectedService?.packageTiers?.ServiceQuestions?.[t] || {}).length > 0) || (selectedService?.packageTiers?.requiredMap && Object.keys(selectedService?.packageTiers?.requiredMap || {}).length > 0) ) && (
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-6">
                        <div className="space-y-4">
                          <h4 className={`text-sm font-medium ${isActive ? 'text-rose-700 dark:text-rose-300' : 'text-gray-700 dark:text-gray-300'} mb-4`}>
                            Configure {t} Package
                          </h4>
                          
                          {(() => {
                            // Use global template commonQuestions labels (show these for every service)
                            const commonQs: string[] = Object.keys((packageTierTemplates as any).commonQuestions || {});
                            const categoryKey = selectedService?.category || sectorToCategoryMap[category || ''] || '';
                            const catQs: string[] = Object.keys(((packageTierTemplates as any).categoryQuestions?.[categoryKey]) || {});
                            const serviceQsPerTier: Record<string, Record<string, string>> = (selectedService?.packageTiers?.ServiceQuestions) || {};
                            const reqMap: Record<string, boolean> = (selectedService?.packageTiers?.requiredMap) || {};
                            const keysFromServiceQuestions = Object.values(serviceQsPerTier || {}).reduce<string[]>((acc, obj) => acc.concat(Object.keys(obj || {})), []);
                            const allQs = Array.from(new Set([...commonQs, ...catQs, ...keysFromServiceQuestions, ...Object.keys(reqMap || {})]));

                            const renderField = (qKey: string) => {
                              let label = qKey;
                              let placeholder = '';
                              let commonDef: any = undefined;
                              let catDef: any = undefined;
                              
                              try {
                                commonDef = (packageTierTemplates as any).commonQuestions?.[qKey];
                                if (commonDef) {
                                  label = commonDef.label || label;
                                  const variant = commonDef.variants && commonDef.variants[t] && commonDef.variants[t].placeholder;
                                  placeholder = variant || commonDef.placeholder || '';
                                } else {
                                  const categoryKey = selectedService?.category || sectorToCategoryMap[category || ''] || 'PHYSICAL_ONSITE';
                                  catDef = (packageTierTemplates as any).categoryQuestions?.[categoryKey]?.[qKey];
                                  if (catDef) {
                                    label = catDef.label || label;
                                    placeholder = catDef.placeholder || '';
                                  }
                                }
                                label = interp(label);
                                placeholder = interp(placeholder);
                              } catch (err) {
                                // noop
                              }

                              const isReq = !!(reqMap && reqMap[qKey]);
                              const svcPerTierDefault = (serviceQsPerTier[t] && serviceQsPerTier[t][qKey]) ? String(serviceQsPerTier[t][qKey]) : '';
                              const fieldType = (commonDef && commonDef.type) || (catDef && catDef.type) || (svcPerTierDefault && !isNaN(Number(svcPerTierDefault)) ? 'number' : 'text');
                              const options: string[] = (commonDef && commonDef.options) || (catDef && catDef.options) || [];

                              return (
                                <div key={qKey} className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {label}
                                    {isReq && <span className="text-rose-500 ml-1">*</span>}
                                  </label>
                                  
                                  {fieldType === 'textarea' ? (
                                    <textarea
                                      aria-label={qKey}
                                      required={isReq}
                                      placeholder={placeholder || svcPerTierDefault || (isReq ? `Enter ${label.toLowerCase()}` : `Enter ${label.toLowerCase()} (optional)`) }
                                      value={fullFormAnswersPerTier[t]?.[qKey] || svcPerTierDefault || ''}
                                      onChange={(e) => setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: e.target.value } }))}
                                      rows={3}
                                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
                                    />
                                  ) : fieldType === 'select' && options.length ? (
                                    <div>
                                      {/* Mobile Select - visible only on small screens */}
                                      <div className="block md:hidden">
                                        <MobileSelect
                                          value={fullFormAnswersPerTier[t]?.[qKey] || svcPerTierDefault || ''}
                                          placeholder={placeholder || 'Select an option'}
                                          options={options.map(opt => ({ value: opt, label: opt }))}
                                          onChange={(value) => setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: value } }))}
                                          required={isReq}
                                          className=""
                                        />
                                      </div>
                                      
                                      {/* Desktop Select - visible only on medium screens and up */}
                                      <div className="hidden md:block">
                                        <select
                                          aria-label={qKey}
                                          required={isReq}
                                          value={fullFormAnswersPerTier[t]?.[qKey] || svcPerTierDefault || ''}
                                          onChange={(e) => setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: e.target.value } }))}
                                          className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                                        >
                                          <option value="">{placeholder || 'Select an option'}</option>
                                          {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                        </select>
                                      </div>
                                    </div>
                                  ) : fieldType === 'multiselect' && options.length ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        {options.map(opt => {
                                          const selectedValues = (fullFormAnswersPerTier[t]?.[qKey] || svcPerTierDefault || '').split(',').filter(Boolean);
                                          const isSelected = selectedValues.includes(opt);
                                          
                                          return (
                                            <label key={opt} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const currentValues = (fullFormAnswersPerTier[t]?.[qKey] || '').split(',').filter(Boolean);
                                                  let newValues;
                                                  if (e.target.checked) {
                                                    newValues = [...currentValues, opt];
                                                  } else {
                                                    newValues = currentValues.filter(v => v !== opt);
                                                  }
                                                  setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: newValues.join(',') } }));
                                                }}
                                                className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-gray-600 rounded"
                                              />
                                              <span className="text-sm text-gray-700 dark:text-gray-200">{opt}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    // Special-case price and delivery_time to map to dedicated per-tier state
                                    qKey === 'price' ? (
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                          aria-label={qKey}
                                          required={isReq}
                                          type="number"
                                          placeholder={placeholder || (svcPerTierDefault ? svcPerTierDefault : '0')}
                                          value={prices[t] !== "" ? String(prices[t]) : ''}
                                          min={commonDef?.validation?.min || 0}
                                          max={commonDef?.validation?.max}
                                          disabled={submitting}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const num = v === '' ? '' : Number(v);
                                            setPrices(prev => ({ ...prev, [t]: num }));
                                            setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: v } }));
                                          }}
                                          className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                      </div>
                                    ) : qKey === 'delivery_time' ? (
                                      <div className="flex space-x-2">
                                        <input
                                          aria-label={qKey}
                                          required={isReq}
                                          type="number"
                                          placeholder={placeholder || (svcPerTierDefault ? svcPerTierDefault : '1')}
                                          value={deliveryTimes[t] !== "" ? String(deliveryTimes[t]) : ''}
                                          min={commonDef?.validation?.min || 1}
                                          max={commonDef?.validation?.max}
                                          disabled={submitting}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const num = v === '' ? '' : Number(v);
                                            setDeliveryTimes(prev => ({ ...prev, [t]: num }));
                                            setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: v } }));
                                          }}
                                          className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className="flex items-center px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                                          {selectedService?.timeUnit || 'days'}
                                        </span>
                                      </div>
                                    ) : (
                                      <input
                                        aria-label={qKey}
                                        required={isReq}
                                        type={fieldType === 'number' ? 'number' : 'text'}
                                        placeholder={placeholder || (svcPerTierDefault ? `e.g. ${svcPerTierDefault}` : (isReq ? `Enter ${label.toLowerCase()}` : `Enter ${label.toLowerCase()} (optional)`))}
                                        value={fullFormAnswersPerTier[t]?.[qKey] || svcPerTierDefault || ''}
                                        disabled={submitting}
                                        onChange={(e) => setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: e.target.value } }))}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                    )
                                  )}
                                </div>
                              );
                            };

                            // render common questions first
                            const commonRendered = commonQs.map(qk => renderField(qk));
                            // render remaining questions (exclude commonQs)
                            const remaining = allQs.filter(x => !commonQs.includes(x));
                            const remainingRendered = remaining.map(qk => renderField(qk));

                            return ([...commonRendered, ...remainingRendered]);
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}

        {/* Bottom actions - Cancel, Reset and Submit (Create/Update) */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto">
            {/* Bottom Submit Button (mirrors header) */}
            <button 
              type="submit"
              form="product-form"
              disabled={submitting || !isFormValid}
              className={`relative px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                (submitting || !isFormValid) ? 'opacity-60 cursor-not-allowed hover:transform-none hover:shadow-lg' : ''
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold">{editProductId ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              disabled={submitting}
              className="flex-1 sm:flex-none sm:px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Cancel & Return</span>
            </button>
            
            <button 
              type="button"
              onClick={() => {
                // Reset form logic could go here
                setCategory(null);
                setSelectedService(null);
                setTags([]);
                setPrices({ Basic: "", Standard: "", Premium: "" });
                setDeliveryTimes({ Basic: "", Standard: "", Premium: "" });
                setImages([]);
                setImagePreviews([]);
                handleRemoveVideo(0);
                // reset product fields
                setProductName('');
                setBrand('');
                setSku('');
                setProductPrice('');
                setStock('');
                setProductDescription('');
                // reset attributes & variants
                setAttributes([]);
                setVariants([]);
                setType('service');
              }}
              className="flex-1 sm:flex-none sm:px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Form</span>
            </button>
          </div>
        </div>
      </div>
    </form>
    )}
      </div>
      
      {/* Validation Error Display */}
      {validationError && validationField !== 'success' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Validation Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {validationError}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError('');
                    setValidationField('');
                  }}
                  className="inline-flex rounded-md text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-red-900"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Display */}
      {validationField === 'success' && validationError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {validationError}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ProductForm;
