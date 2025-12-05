import { useState, useEffect } from 'react';
import { ProductFilters } from '../services/clientProductService';

const STORAGE_KEY = 'salvatore_client_filters';
const URL_PARAMS_KEY = 'client_filters';

interface UseFilterPersistenceOptions {
  enableUrlSync?: boolean;
  enableLocalStorage?: boolean;
}

export const useFilterPersistence = (
  initialFilters: ProductFilters = {},
  options: UseFilterPersistenceOptions = {}
) => {
  const {
    enableUrlSync = true,
    enableLocalStorage = true
  } = options;

  const [filters, setFilters] = useState<ProductFilters>(() => {
    // Try to load from URL params first
    if (enableUrlSync && typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlFilters = urlParams.get(URL_PARAMS_KEY);
        if (urlFilters) {
          return { ...initialFilters, ...JSON.parse(decodeURIComponent(urlFilters)) };
        }
      } catch (error) {
        console.warn('Failed to parse filters from URL:', error);
      }
    }

    // Then try localStorage
    if (enableLocalStorage && typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem(STORAGE_KEY);
        if (savedFilters) {
          return { ...initialFilters, ...JSON.parse(savedFilters) };
        }
      } catch (error) {
        console.warn('Failed to parse filters from localStorage:', error);
      }
    }

    return initialFilters;
  });

  // Update URL and localStorage when filters change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update localStorage
    if (enableLocalStorage) {
      try {
        if (Object.keys(filters).length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.warn('Failed to save filters to localStorage:', error);
      }
    }

    // Update URL params
    if (enableUrlSync) {
      try {
        const url = new URL(window.location.href);
        if (Object.keys(filters).length > 0) {
          url.searchParams.set(URL_PARAMS_KEY, encodeURIComponent(JSON.stringify(filters)));
        } else {
          url.searchParams.delete(URL_PARAMS_KEY);
        }
        
        // Only update if the URL actually changed
        if (url.href !== window.location.href) {
          window.history.replaceState({}, '', url.href);
        }
      } catch (error) {
        console.warn('Failed to update URL with filters:', error);
      }
    }
  }, [filters, enableUrlSync, enableLocalStorage]);

  const updateFilters = (newFilters: ProductFilters | ((prev: ProductFilters) => ProductFilters)) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    if (enableLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const resetToDefaults = () => {
    setFilters(initialFilters);
  };

  // Get active filter count for UI badges
  const getActiveFilterCount = () => {
    let count = 0;
    
    if (filters.category && filters.category !== 'All') count++;
    if (filters.subcategory && filters.subcategory.length > 0) count++;
    if (filters.rating?.min && filters.rating.min > 0) count++;
    if (filters.serviceType && filters.serviceType.length > 0) count++;
    if (filters.availability && filters.availability !== 'all') count++;
    if (filters.verificationStatus && Object.values(filters.verificationStatus).some(Boolean)) count++;
    if (filters.responseTime?.priority) count++;
    if (filters.experienceLevel?.levels && filters.experienceLevel.levels.length > 0) count++;
    if (filters.specialFeatures && Object.values(filters.specialFeatures).some(Boolean)) count++;
    if (filters.location?.popularAreas && filters.location.popularAreas.length > 0) count++;
    if (filters.languages && filters.languages.length > 0) count++;
    if (filters.priceRange?.preset || 
        (filters.priceRange?.min && filters.priceRange.min > 0) || 
        (filters.priceRange?.max && filters.priceRange.max < 200000)) count++;
    
    return count;
  };

  // Get filter summary for display
  const getFilterSummary = () => {
    const summary: string[] = [];
    
    if (filters.category && filters.category !== 'All') {
      summary.push(filters.category);
    }
    if (filters.rating?.min) {
      summary.push(`${filters.rating.min}+ stars`);
    }
    if (filters.serviceType && filters.serviceType.length > 0) {
      summary.push(filters.serviceType.join(', '));
    }
    if (filters.location?.popularAreas && filters.location.popularAreas.length > 0) {
      summary.push(`Areas: ${filters.location.popularAreas.slice(0, 2).join(', ')}${filters.location.popularAreas.length > 2 ? '...' : ''}`);
    }
    if (filters.priceRange?.preset) {
      summary.push(`Price: ${filters.priceRange.preset}`);
    }
    
    return summary.slice(0, 3); // Limit to 3 items for UI
  };

  // Check if filters are applied
  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    resetToDefaults,
    getActiveFilterCount,
    getFilterSummary,
    hasActiveFilters
  };
};