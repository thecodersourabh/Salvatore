import { useEffect, useMemo, useState } from 'react';
import sectorServices from '../../config/sectorServices.json';
import packageTierTemplates from '../../config/packageTierTemplates.json';
import { ProductService } from '../../services/cachedServices';
import { ProductService as BaseProductService } from '../../services/productService';
import { ImageService } from '../../services/imageService';

// This hook manages all product form state and logic except media and permissions
export function useProductFormState({
  editProductId = null,
  onSetExistingImages = () => {},
  onSetExistingVideos = () => {},
}: { editProductId?: string | null, onSetExistingImages?: (imgs:any[]) => void, onSetExistingVideos?: (vids:any[]) => void } = {}) {
  const [category, setCategory] = useState<string | null>(null);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tier, setTier] = useState('Basic');
  const [prices, setPrices] = useState<Record<string, number | ''>>({ Basic: '', Standard: '', Premium: '' });
  const [deliveryTimes, setDeliveryTimes] = useState<Record<string, number | ''>>({ Basic: '', Standard: '', Premium: '' });
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [fullFormAnswersPerTier, setFullFormAnswersPerTier] = useState<Record<string, Record<string, string>>>({ Basic: {}, Standard: {}, Premium: {} });

  const [loading, setLoading] = useState(false);

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

  const interp = (s?: string) => {
    if (!s) return s || '';
    const timeUnit = selectedService?.timeUnit || 'days';
    const serviceName = selectedService?.name || 'service';
    return String(s).replace(/\{timeUnit\}/g, timeUnit).replace(/\{serviceName\}/g, serviceName);
  };

  useEffect(() => {
    if (!selectedService) return;

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
    setPrices(prev => ({ ...prev }));
    setDeliveryTimes(prev => ({ ...prev }));
  }, [selectedService]);

  // Update service list when category changes
  useEffect(() => {
    if (!category) return setServiceList([]);
    const list = (sectorServices as any)[category]?.services || [];
    setServiceList(list);
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
        const product = await ProductService.getProduct(editProductId);
        if (!product) throw new Error('Product not found');
        const formData = BaseProductService.transformProductResponseToFormData(product);

        setCategory(formData.category);
        setSelectedServiceNames(formData.serviceNames);
        setTags(formData.tags);
        setTier(formData.tier);
        setPrices(formData.prices);
        setDeliveryTimes(formData.deliveryTimes);
        setFullFormAnswersPerTier(formData.fullFormAnswersPerTier);

        if (product.images && product.images.length > 0) {
          onSetExistingImages(product.images);
        }

        if (product.videoKey) {
          const videoUrl = ImageService.getImageUrl(product.videoKey);
          onSetExistingVideos([{ url: videoUrl }]);
        }
      } catch (error) {
        console.error('Failed to load product for editing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductForEditing();
  }, [editProductId]);

  // Separate effect to handle service selection after category is set (fallback)
  useEffect(() => {
    const loadServiceFromCategory = async () => {
      if (!editProductId || !category) return;
      try {
        const product = await ProductService.getProduct(editProductId);
        if (!product) return;
        const formData = BaseProductService.transformProductResponseToFormData(product);
        if (category && formData.name) {
          const categoryServices = (sectorServices as any)[category]?.services || [];
          const matchingService = categoryServices.find((service: any) => service.name === formData.name);
          if (matchingService) setSelectedService(matchingService);
          else console.warn('No matching service found for:', formData.name, 'in category:', category);
        }
      } catch (error) {
        console.error('Failed to set selected service:', error);
      }
    };

    loadServiceFromCategory();
  }, [editProductId, category]);

  const isFormValid = useMemo(() => {
    // Note: permission check should be performed externally and passed in if needed
    if (!category || !selectedService) return false;

    return true; // keep additional checks in the UI or caller
  }, [category, selectedService]);

  return {
    category, setCategory,
    serviceList, setServiceList,
    selectedService, setSelectedService,
    selectedServiceNames, setSelectedServiceNames,
    tags, setTags,
    tier, setTier,
    prices, setPrices,
    deliveryTimes, setDeliveryTimes,
    editingTier, setEditingTier,
    fullFormAnswersPerTier, setFullFormAnswersPerTier,
    interp,
    isFormValid,
    loading,
    setLoading
  };
}
