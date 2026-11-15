import { useEffect, useMemo, useState } from 'react';
import packageTierTemplates from '../../config/packageTierTemplates.json';
import productAttributeTemplates from '../../config/productAttributeTemplates.json';
import productSuggestionConfig from '../../config/productSuggestionConfig.json';
import { ProductService } from '../../services/cachedServices';
import { ProductService as BaseProductService } from '../../services/productService';
import { ImageService } from '../../services/imageService';
import {
  findSectorForService,
  getSectorPackageCategory,
  getSectorServices
} from '../../utils/sectorServices';

const isAsciiWordCharacter = (character: string | undefined) => {
  if (character === undefined) return false;
  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95;
};

const findWordMatch = (text: string, word: string) => {
  const normalizedWord = word.toLowerCase();
  if (!normalizedWord) return null;

  let index = 0;
  while (index < text.length) {
    if (!isAsciiWordCharacter(text[index])) {
      index += 1;
      continue;
    }

    const start = index;
    while (isAsciiWordCharacter(text[index])) index += 1;
    const match = text.slice(start, index);
    if (match.toLowerCase() === normalizedWord) return match;
  }
  return null;
};

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
  // Product-specific fields
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [stock, setStock] = useState('');
  const [productUnit, setProductUnit] = useState<string>('pcs'); // e.g., pcs, m, kg
  const [productDescription, setProductDescription] = useState('');
  // Listing options: sell or lease
  const [listingMode, setListingMode] = useState<'sell' | 'lease'>('sell');
  const [leasePrice, setLeasePrice] = useState('');
  const [leaseUnit, setLeaseUnit] = useState<'hr'|'day'|'month'|'year' | ''>('');
  // Sub-category (user-visible) — maps to API `subcategory`
  const [subCategory, setSubCategory] = useState('');

  // helper slugify for SKU generation
  const slugify = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  // Add type state for product/service (default to 'product')
  const [type, setType] = useState<'product' | 'service'>('product');
  const [prices, setPrices] = useState<Record<string, number | ''>>({ Basic: '', Standard: '', Premium: '' });

  // Product attributes & variants
  const [attributes, setAttributes] = useState<Array<{ name: string, options: string[] }>>([]);
  const [variants, setVariants] = useState<Array<{ id: string, sku?: string, price?: number | '', stock?: number | '', attrs: Record<string,string> }>>([]);

  const addAttribute = (name: string, options: string[] = []) => {
    setAttributes(prev => [...prev, { name, options }]);
  };

  const updateAttributeOptions = (name: string, options: string[]) => {
    setAttributes(prev => prev.map(a => a.name === name ? { ...a, options } : a));
  };

  const removeAttribute = (name: string) => {
    setAttributes(prev => prev.filter(a => a.name !== name));
  };

  // Extract a recent item token from product name using config (returns original casing when possible)
  const extractItemToken = (name = '') => {
    const tokenPriority = productSuggestionConfig.tokenPriority;
    // Check priority tokens (case-insensitive) and return the matched fragment from original name to preserve casing
    for (const p of tokenPriority) {
      const match = findWordMatch(name, p);
      if (match) return match.trim();
    }

    return '';
  };

  // Build SKU prefix using mapping: Sector (preserve case) > Service (preserve case) > item token > brand
  // Example: "Technology-CCTV Camera-DVR-sony"
  const buildSkuBase = () => {
    const normalizePreserve = (s: string) => s ? String(s).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '') : '';
    const normalizeSlug = (s: string) => s ? slugify(String(s)) : '';

    const parts: string[] = [];
    if (category) parts.push(normalizePreserve(category)); // preserve case and spacing as requested
    if (selectedService?.name) parts.push(normalizePreserve(selectedService.name));

    // include recent item token (from product name) if present
    const itemTok = extractItemToken(productName);
    if (itemTok) parts.push(normalizeSlug(itemTok));

    // include brand if present
    if (brand) parts.push(normalizeSlug(brand));

    return parts.filter(Boolean).join('-');
  };

  const generateVariants = (attrs = attributes) => {
    if (!attrs || attrs.length === 0) {
      setVariants([]);
      return;
    }

    // Cartesian product based on attribute order
    const pools = attrs.map(a => a.options.map(opt => ({ [a.name]: opt })));
    const combinations = pools.reduce((acc, pool) => acc.flatMap(a => pool.map(b => ({ ...a, ...b }))), [{} as Record<string,string>]);

    const comboKey = (comb: Record<string,string>) => {
      return attrs.map(a => `${a.name}:${comb[a.name] || ''}`).join('|');
    };

    const prevMap: Record<string, any> = {};
    variants.forEach(v => {
      try {
        const key = comboKey(v.attrs);
        prevMap[key] = v;
      } catch (err) {
        // noop
      }
    });



    const newVariants = combinations.map((combination, idx) => {
      const key = comboKey(combination);
      const prev = prevMap[key];

        // Generate a sensible SKU if one does not exist
      let generatedSku = '';
      if (!prev?.sku) {
        let base = buildSkuBase() || '';
        if (!base) base = 'prod';
        // postfix: attribute initials (first 3 chars of each value) or index fallback
        const attrPart = attrs.map(a => String(combination[a.name] || '').trim()).filter(Boolean).map(v => slugify(v).substring(0, 3)).join('');
        const postfix = attrPart || `v${idx+1}`;
        generatedSku = `${base}-${postfix}`;
      }

      return {
        id: prev?.id || `var-${idx+1}`,
        sku: prev?.sku || generatedSku || '',
        price: prev?.price ?? '',
        stock: prev?.stock ?? '',
        attrs: combination
      };
    });

    setVariants(newVariants);
  };
  const [deliveryTimes, setDeliveryTimes] = useState<Record<string, number | ''>>({ Basic: '', Standard: '', Premium: '' });
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [fullFormAnswersPerTier, setFullFormAnswersPerTier] = useState<Record<string, Record<string, string>>>({ Basic: {}, Standard: {}, Premium: {} });

  const [loading, setLoading] = useState(false);

  const interp = (s?: string) => {
    if (!s) return s || '';
    const timeUnit = selectedService?.timeUnit || 'days';
    const serviceName = selectedService?.name || 'service';
    return String(s).replace(/\{timeUnit\}/g, timeUnit).replace(/\{serviceName\}/g, serviceName);
  };

  useEffect(() => {
    if (!selectedService) return;

    const commonQs: string[] = Object.keys((packageTierTemplates as any).commonQuestions || {});
    const categoryKey = selectedService?.category || getSectorPackageCategory(category || '');
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
    setServiceList(getSectorServices(category).services);
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
        const fd: any = formData;

        setSelectedServiceNames(fd.serviceNames || []);
        setTags(fd.tags || []);
        setTier(fd.tier || 'Basic');
        setPrices(fd.prices || { Basic: '', Standard: '', Premium: '' });
        setDeliveryTimes(fd.deliveryTimes || { Basic: '', Standard: '', Premium: '' });
        setFullFormAnswersPerTier(fd.fullFormAnswersPerTier || { Basic: {}, Standard: {}, Premium: {} });

        const isProduct = fd.type === 'product' || (
          fd.type !== 'service' && Boolean(fd.variants || fd.brand || fd.sku)
        );
        setType(isProduct ? 'product' : 'service');
        setProductName(fd.productName || fd.name || '');
        setBrand(fd.brand || '');
        setSku(fd.sku || '');
        setProductPrice(fd.price != null ? String(fd.price) : fd.productPrice != null ? String(fd.productPrice) : '');
        setStock(fd.stock != null ? String(fd.stock) : '');
        setProductUnit(fd.productUnit || fd.unit || 'pcs');
        setProductDescription(fd.productDescription || fd.fullFormAnswersPerTier?.[fd.tier]?.description || '');
        setListingMode(fd.listingMode || 'sell');
        setLeasePrice(fd.leasePrice != null ? String(fd.leasePrice) : '');
        setLeaseUnit(fd.leaseUnit || '');
        const serviceLookup = String(fd.subCategory || fd.subcategory || fd.name || '').trim();
        const requestedCategory = String(fd.category || '');
        const matchingService = getSectorServices(requestedCategory).services.find(
          service => service.name.trim().toLowerCase() === serviceLookup.toLowerCase()
        );
        const relocatedService = matchingService ? null : findSectorForService(serviceLookup);
        const resolvedCategory = relocatedService?.sector || requestedCategory;
        const resolvedService = matchingService || relocatedService?.service || null;
        setCategory(resolvedCategory || null);
        setServiceList(getSectorServices(resolvedCategory).services);
        setSubCategory(resolvedService?.name || fd.subCategory || fd.subcategory || '');
        setSelectedService(resolvedService);
        if (serviceLookup && !resolvedService) {
          console.warn('No matching service found for:', serviceLookup, 'in category:', resolvedCategory);
        }

        onSetExistingImages(product.images || []);
        onSetExistingVideos(
          product.videoKey ? [{ url: ImageService.getImageUrl(product.videoKey) }] : []
        );

        // Load attributes & variants when editing existing product
        if (fd.variants && Array.isArray(fd.variants) && fd.variants.length > 0) {
          // Build attributes list from variant keys and collect options
          const attrMap: Record<string, Set<string>> = {};
          fd.variants.forEach((v: any) => {
            const attrs = v.attrs || {};
            Object.entries(attrs).forEach(([k, val]) => {
              attrMap[k] = attrMap[k] || new Set<string>();
              if (val) attrMap[k].add(String(val));
            });
          });

          const attrs = Object.entries(attrMap).map(([name, setVals]) => ({ name, options: Array.from(setVals) }));
          setAttributes(attrs);
          setVariants(fd.variants.map((v: any, idx: number) => ({ id: v.id || `var-${idx+1}`, sku: v.sku || '', price: v.price ?? '', stock: v.stock ?? '', attrs: v.attrs || {} })));
        } else if (fd.attributes) {
          // attribute definitions present (new format)
          const attrs = Array.isArray(fd.attributes)
            ? fd.attributes.map((a: any) => ({ name: a.name, options: a.options || [] }))
            : Object.entries(fd.attributes).map(([name, def]: any) => ({ name, options: def.options || [] }));
          setAttributes(attrs);
          generateVariants(attrs);
        }
      } catch (error) {
        console.error('Failed to load product for editing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductForEditing();
  }, [editProductId]);

  // Auto-load product attribute template when category changes (only for products)
  useEffect(() => {
    if (type !== 'product') return;
    const loadTemplateForCategory = (cat?: string) => {
      const catKey = cat || 'default';
      const tpl = (productAttributeTemplates as any)[catKey] || (productAttributeTemplates as any)['default'];
      if (!tpl || !tpl.attributes) return;
      const attrs = Array.isArray(tpl.attributes)
        ? tpl.attributes.map((a: any) => ({ name: a.name, options: a.options || [] }))
        : Object.entries(tpl.attributes).map(([name, def]: any) => ({ name, options: def.options || [] }));
      // Only set template if attributes empty - do not overwrite user edits
      setAttributes(prev => (prev.length === 0 ? attrs : prev));
    };

    loadTemplateForCategory(category || 'default');
  }, [category, type]);

  // Auto-generate SKU when category/service/name/brand change, if sku not provided
  useEffect(() => {
    if (type !== 'product') return;
    if (sku && sku.trim() !== '') return; // don't clobber user-entered SKU

    const base = buildSkuBase();
    if (base) {
      // leave trailing '-' so user knows to append item/brand/postfix
      setSku(`${base}-`);
    }
  }, [category, selectedService, type, sku, productName, brand]);

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
    setLoading,
    type, setType,
    productName, setProductName,
    subCategory, setSubCategory,
    brand, setBrand,
    sku, setSku,
    productPrice, setProductPrice,
    stock, setStock,
    productUnit, setProductUnit,
    productDescription, setProductDescription,
    // Listing / Lease fields
    listingMode, setListingMode,
    leasePrice, setLeasePrice,
    leaseUnit, setLeaseUnit,
    // attributes & variants
    attributes, setAttributes,
    variants, setVariants,
    addAttribute, updateAttributeOptions, removeAttribute, generateVariants,
    // Note: listing/lease helpers are returned above
  };
}
