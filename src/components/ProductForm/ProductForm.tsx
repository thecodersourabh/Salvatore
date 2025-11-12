import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sectorServices from "../../config/sectorServices.json";
import packageTierTemplates from "../../config/packageTierTemplates.json";
import { Edit2, Check, X as XIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ProductService } from "../../services/productService";
import { ImageService } from "../../services/imageService";

type ServiceDef = any;

// NOTE: features are now driven by template questions; no helper fallback is required

interface ProductFormProps {
  ownerId?: string | null; // if editing an existing product, pass ownerId to control edit permissions
  editProductId?: string | null; // product ID to edit, if in edit mode
}

export const ProductForm: React.FC<ProductFormProps> = ({ ownerId = null, editProductId = null }) => {
  const sectors = useMemo(() => Object.keys(sectorServices), []);

  const [category, setCategory] = useState<string | null>(null); // renamed from sector
  const [serviceList, setServiceList] = useState<ServiceDef[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceDef | null>(null);
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]); // renamed from selectedSkills
  const [tier, setTier] = useState("Basic");
  const [prices, setPrices] = useState<Record<string, number | "">>({ Basic: "", Standard: "", Premium: "" });
  const [deliveryTimes, setDeliveryTimes] = useState<Record<string, number | "">>({ Basic: "", Standard: "", Premium: "" });
  // Features UI removed: all feature fields are provided via template-driven questions now
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [fullFormAnswersPerTier, setFullFormAnswersPerTier] = useState<Record<string, Record<string, string>>>({ Basic: {}, Standard: {}, Premium: {} });
  // media uploads
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{url: string, isPrimary: boolean, order: number}>>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  
  // Toast state for validation feedback
  const [validationError, setValidationError] = useState('');
  const [validationField, setValidationField] = useState('');

  const { user: authUser } = useAuth();
  const currentUserId = authUser?.userId || null;
  const canEdit = !ownerId || ownerId === currentUserId;

  // helper to replace template tokens in labels/placeholders using selectedService context
  const interp = (s?: string) => {
    if (!s) return s || '';
    const timeUnit = selectedService?.timeUnit || 'days';
    const serviceName = selectedService?.name || 'service';
    return String(s).replace(/\{timeUnit\}/g, timeUnit).replace(/\{serviceName\}/g, serviceName);
  };

  // fallback mapping from top-level sector to packageTierTemplates category key
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

  useEffect(() => {
    if (!selectedService) return;
    // Features are provided via template-driven questions now; no local per-tier defaults required

  // initialize full form answers from selected service: gather common + category + per-tier ServiceQuestions + legacy requiredMap keys
  // Use labels/keys from packageTierTemplates.commonQuestions for the common question set (show across all services)
  const commonQs: string[] = Object.keys((packageTierTemplates as any).commonQuestions || {});
    const categoryKey = selectedService?.category || sectorToCategoryMap[category || ''] || 'PHYSICAL_ONSITE';
    const catQs: string[] = Object.keys(((packageTierTemplates as any).categoryQuestions?.[categoryKey]) || {});
    const serviceQsPerTier: Record<string, Record<string, string>> = (selectedService?.packageTiers?.ServiceQuestions) || {};
    const reqMap: Record<string, boolean> = (selectedService?.packageTiers?.requiredMap) || {};

    const keysFromServiceQuestions = Object.values(serviceQsPerTier || {}).reduce<string[]>((acc, obj) => acc.concat(Object.keys(obj || {})), []);
    const allQs = Array.from(new Set([...commonQs, ...catQs, ...keysFromServiceQuestions, ...Object.keys(reqMap || {})]));

    const answersInitPerTier: Record<string, Record<string, string>> = { Basic: {}, Standard: {}, Premium: {} };
    ['Basic','Standard','Premium'].forEach((tt) => {
      allQs.forEach((q) => {
        const svcDefault = serviceQsPerTier[tt] && serviceQsPerTier[tt][q] ? String(serviceQsPerTier[tt][q]) : "";
        answersInitPerTier[tt][q] = fullFormAnswersPerTier[tt]?.[q] || svcDefault || "";
      });
    });
    setFullFormAnswersPerTier(answersInitPerTier);
    // We don't initialize prices/delivery from the service manifest here.
    // Prices and delivery times are provided by the provider via the packageTier templates.
    // Keep existing state (usually empty) so the UI shows blank inputs for the provider to fill.
    setPrices(prev => ({ ...prev }));
    setDeliveryTimes(prev => ({ ...prev }));
  }, [selectedService]);

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(u => URL.revokeObjectURL(u));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

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

  // Validation helper function
  const showValidationError = (message: string, field: string = '') => {
    console.log('🚨 Validation error:', message, 'Field:', field, 'EditMode:', editProductId ? 'UPDATE' : 'CREATE');
    setValidationError(message);
    setValidationField(field);
    
    // Clear validation error after 5 seconds
    setTimeout(() => {
      setValidationError('');
      setValidationField('');
    }, 5000);
  };

  const showSuccessMessage = (message: string) => {
    console.log('Success:', message);
    setValidationError(message); // Use the message for display
    setValidationField('success');
    setTimeout(() => {
      setValidationError('');
      setValidationField('');
    }, 3000);
  };

  
  const handleImageAdd = (files: FileList | null) => {
    if (!files) return;
    const maxImages = 6;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // Calculate current total images (existing + new)
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
      console.log(`Added ${validFiles.length} new images. Total: ${currentTotalImages + validFiles.length}/${maxImages}`);
    }
  };

  const handleRemoveImage = (index: number) => {
    const existingImagesCount = existingImages.length;
    
    if (index < existingImagesCount) {
      // Removing an existing image
      console.log('Removing existing image at index:', index);
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Removing a new image (File object)
      const newImageIndex = index - existingImagesCount;
      console.log('Removing new image at index:', newImageIndex);
      
      setImages(prev => prev.filter((_, i) => i !== newImageIndex));
      setImagePreviews(prev => {
        const removed = prev[index];
        if (removed && removed.startsWith('blob:')) {
          URL.revokeObjectURL(removed);
        }
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  // Drag and drop handlers for images
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageAdd(files);
    }
  };

  // Drag and drop handlers for video
  const handleVideoDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsVideoDragging(false);
    }
  };

  const handleVideoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only take the first file for video
      const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
      
      if (allowedVideoTypes.includes(file.type.toLowerCase()) || file.type.startsWith('video/')) {
        handleVideoAdd(file);
      } else {
        showValidationError('Please drop a valid video file (MP4, MOV, AVI)', 'video');
      }
    }
  };

  const handleVideoAdd = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showValidationError('Only video files are allowed', 'video');
      return;
    }
    const maxSizeMB = 200; // 200 MB
    if (file.size > maxSizeMB * 1024 * 1024) {
      showValidationError(`Video too large. Maximum size is ${maxSizeMB} MB`, 'video');
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
  };

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Update service list when category changes
  useEffect(() => {
    if (!category) return setServiceList([]);
    const list = (sectorServices as any)[category]?.services || [];
    setServiceList(list);
    // Only clear selectedService if we're not in edit mode or if we're not loading
    if (!editProductId && !loading) {
      setSelectedService(null);
    }
  }, [category, editProductId, loading]);

  // Load existing product data if in edit mode
  useEffect(() => {
    const loadProductForEditing = async () => {
      if (!editProductId) return;
      
      setLoading(true);
      try {
        console.log('Loading product for editing:', editProductId);
        const product = await ProductService.getProductById(editProductId);
        console.log('Loaded product:', product);
        
        // Transform product data to form format
        const formData = ProductService.transformProductResponseToFormData(product);
        console.log('Transformed form data:', formData);
        
        // Populate form fields
        setCategory(formData.category);
        setSelectedServiceNames(formData.serviceNames);
        setTags(formData.tags);
        setTier(formData.tier);
        setPrices(formData.prices);
        setDeliveryTimes(formData.deliveryTimes);
        setFullFormAnswersPerTier(formData.fullFormAnswersPerTier);
        
        // Load existing images from product
        if (product.images && product.images.length > 0) {
          console.log('Loading existing product images:', product.images.length);
          
          // Store existing images separately 
          setExistingImages(product.images);
          
          // Create preview URLs from existing images for display
          const existingPreviews = product.images.map(img => img.url);
          setImagePreviews(existingPreviews);
          
          // Clear any new images since we're loading existing ones
          setImages([]);
        }
        
        console.log('Form fields populated successfully');
      } catch (error) {
        console.error('Failed to load product for editing:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load product data';
        console.log(`Failed to load product: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadProductForEditing();
  }, [editProductId]);

  // Separate effect to handle service selection after category is set
  useEffect(() => {
    const loadServiceFromCategory = async () => {
      if (!editProductId || !category) return;
      
      try {
        const product = await ProductService.getProductById(editProductId);
        const formData = ProductService.transformProductResponseToFormData(product);
        
        // Find and set the selected service based on the loaded data
        if (category && formData.name) {
          const categoryServices = (sectorServices as any)[category]?.services || [];
          const matchingService = categoryServices.find((service: any) => service.name === formData.name);
          if (matchingService) {
            setSelectedService(matchingService);
            console.log('Selected service set:', matchingService);
          } else {
            console.warn('No matching service found for:', formData.name, 'in category:', category);
            console.log('Available services:', categoryServices.map((s: any) => s.name));
          }
        }
      } catch (error) {
        console.error('Failed to set selected service:', error);
      }
    };

    loadServiceFromCategory();
  }, [editProductId, category]);

  // Debug effect for tags and service state
  useEffect(() => {
    if (editProductId) {
      console.log('Debug - Edit mode state:', {
        editProductId,
        category,
        selectedService: selectedService?.name,
        selectedServiceNames,
        tags,
        loading
      });
    }
  }, [editProductId, category, selectedService, selectedServiceNames, tags, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (submitting) {
      console.log('Already submitting, ignoring submission');
      return;
    }
    
    console.log('🚀 Starting form validation...', editProductId ? 'UPDATE mode' : 'CREATE mode');
    
    if (!selectedService?.name) {
      const action = editProductId ? 'update' : 'create';
      showValidationError(`Please select a service before ${action === 'update' ? 'updating' : 'creating'} the product`, 'service');
      return;
    }

    // Image validation - different rules for create vs update
    if (!editProductId) {
      // For new products, must have at least one image
      if (!images || images.length === 0) {
        console.log('Create validation failed - no images provided');
        showValidationError('Please add at least one image to create a product', 'images');
        return;
      }
    } else {
      // For updates, must have at least one image total (existing + new)
      const totalImages = (existingImages?.length || 0) + (images?.length || 0);
      if (totalImages === 0) {
        console.log('Update validation failed - no images total. Existing:', existingImages?.length, 'New:', images?.length);
        showValidationError('Product must have at least one image', 'images');
        return;
      }
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

    // Build product metadata using the service interface
    const productData: any = {
      category,
      name: selectedService?.name,
      serviceNames: selectedServiceNames,
      tier,
      prices,
      deliveryTimes,
      fullFormAnswersPerTier,
      tags,
    };

    setSubmitting(true);
    try {
      let result;
      
      if (editProductId) {
        // Update existing product
        console.log('Updating existing product:', editProductId);
        
        // Combine existing images with new images for the update
        let allImages: Array<{url: string, isPrimary: boolean, order: number}> = [];
        
        // Add existing images first
        if (existingImages.length > 0) {
          allImages = existingImages.map((img, index) => ({
            url: img.url,
            isPrimary: img.isPrimary || index === 0,
            order: index + 1
          }));
          console.log('Including existing images:', allImages.length);
        }
        
        // If user added new images, upload them and add to the array
        if (images.length > 0) {
          console.log('Uploading new images:', images.length);
          
          try {
            const username = localStorage.getItem('username') || localStorage.getItem('x-user-id') || 'anonymous';
            
            // Upload new images
            const newImageKeys: string[] = [];
            for (let i = 0; i < images.length; i++) {
              const imageKey = await ImageService.uploadImage({
                username,
                file: images[i],
                folder: 'products'
              });
              newImageKeys.push(imageKey);
            }
            
            // Add new images to the array
            const newImageObjects = newImageKeys.map((key, index) => ({
              url: ImageService.getImageUrl(key),
              isPrimary: allImages.length === 0 && index === 0, // Only primary if no existing images
              order: allImages.length + index + 1
            }));
            
            allImages = [...allImages, ...newImageObjects];
            console.log('Total images after adding new ones:', allImages.length);
            
          } catch (imageError) {
            console.error('Failed to upload new images:', imageError);
            throw new Error('Failed to upload new images');
          }
        }
        
        // Update product with all images (existing + new)
        const apiProductData = ProductService.transformFormDataToApiFormat(productData, allImages.map(img => img.url));
        // Manually add the images array since transformFormDataToApiFormat might not handle this correctly
        (apiProductData as any).images = allImages;
        
        result = await ProductService.updateProduct(editProductId, apiProductData);
        
        console.log('Product updated successfully:', result);
        showSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        console.log('Creating new product');
        console.log('Images to upload:', images.length);
        console.log('Video to upload:', video ? 'Yes' : 'No');
        
        result = await ProductService.createProduct({
          productData,
          images,
          video,
        });
        
        console.log('Product created successfully:', result);
        showSuccessMessage('Product created successfully!');
      }
      
      // After successful operation, redirect to dashboard
      console.log('Attempting to navigate to dashboard...');
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

  // categoryForSelected removed (not needed when features are template-driven)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editProductId ? 'Edit Service' : 'Create New Service'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {editProductId 
                  ? 'Update your service offerings with new details and pricing'
                  : 'Set up your service offerings with detailed packages and pricing'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading product data...</span>
            </div>
          </div>
        )}

        {!loading && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">{/* Submit button */}
          <div className="p-6 sm:p-8 space-y-8">
        {/* Sector & Service selectors */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sector <span className="text-rose-500">*</span>
              </label>
              <select 
                value={category || ""} 
                onChange={(e) => setCategory(e.target.value || null)} 
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
              >
                <option value="">Choose a sector</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 space-y-2">
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
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                required
                disabled={!category}
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
        </div>        {/* Media uploads: images + video */}
        <div className="space-y-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Media</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Images Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Service Images
                </label>
                <span className="text-xs text-gray-500">Up to 6 images</span>
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageAdd(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 scale-105' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className={`w-8 h-8 mb-2 transition-colors ${isDragging ? 'text-rose-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className={`text-sm transition-colors ${isDragging ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isDragging ? (
                          <span className="font-semibold">Drop images here</span>
                        ) : (
                          <>
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      <p className={`text-xs transition-colors ${isDragging ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400'}`}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={src} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img src={src} className="w-full h-full object-cover" alt={`Service image ${i + 1}`} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Promo Video
                </label>
                <span className="text-xs text-gray-500">Optional, max 200MB</span>
              </div>

              {!videoPreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoAdd(e.target.files?.[0] || null)}
                    className="hidden"
                    id="video-upload"
                  />
                  <div
                    onDragEnter={handleVideoDragEnter}
                    onDragLeave={handleVideoDragLeave}
                    onDragOver={handleVideoDragOver}
                    onDrop={handleVideoDrop}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                      isVideoDragging 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className={`w-8 h-8 mb-2 transition-colors ${isVideoDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className={`text-sm transition-colors ${isVideoDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {isVideoDragging ? (
                            <span className="font-semibold">Drop video here</span>
                          ) : (
                            <>
                              <span className="font-semibold">Click to upload</span> or drag and drop video
                            </>
                          )}
                        </p>
                        <p className={`text-xs transition-colors ${isVideoDragging ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}>
                          MP4, MOV, AVI up to 200MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video src={videoPreview} controls className="w-full h-48 object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="w-full px-4 py-2 text-sm text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors"
                  >
                    Remove Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Tiers */}
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
                          <button type="button" onClick={() => setEditingTier(null)} title="Cancel" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <XIcon size={16} className="text-gray-500" />
                          </button>
                          <button type="button" onClick={() => setEditingTier(null)} title="Save" className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors">
                            <Check size={16} />
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setEditingTier(t)} title="Edit tier" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const num = v === '' ? '' : Number(v);
                                            setPrices(prev => ({ ...prev, [t]: num }));
                                            setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: v } }));
                                          }}
                                          className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
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
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const num = v === '' ? '' : Number(v);
                                            setDeliveryTimes(prev => ({ ...prev, [t]: num }));
                                            setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: v } }));
                                          }}
                                          className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
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
                                        onChange={(e) => setFullFormAnswersPerTier(prev => ({ ...prev, [t]: { ...(prev[t] || {}), [qKey]: e.target.value } }))}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
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
       
        {/* Submit actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="submit" 
            disabled={submitting || !selectedService || !category} 
            className={`flex-1 sm:flex-none sm:px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              (submitting || !selectedService || !category) ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{editProductId ? 'Update Service' : 'Create Service'}</span>
              </>
            )}
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 sm:flex-none sm:px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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
                handleRemoveVideo();
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
  );
};

export default ProductForm;
