import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  Shield, 
  Zap,
  X,
  Search,
  Settings
} from 'lucide-react';
import { ProductFilters } from '../services/clientProductService';

interface EnhancedFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClose: () => void;
  sectors: string[];
  isOpen: boolean;
}

interface FilterPreset {
  name: string;
  description: string;
  filters: Partial<ProductFilters>;
  icon: React.ReactNode;
}

const responseTimeOptions = [
  { label: 'Instant (Within 15 mins)', value: 'instant', minutes: 15 },
  { label: 'Fast (Within 1 hour)', value: 'fast', minutes: 60 },
  { label: 'Standard (Within 24 hours)', value: 'standard', minutes: 1440 }
];

const experienceLevels = [
  { label: 'Beginner (0-2 years)', value: 'beginner' },
  { label: 'Intermediate (2-5 years)', value: 'intermediate' },
  { label: 'Expert (5-10 years)', value: 'expert' },
  { label: 'Master (10+ years)', value: 'master' }
];

const popularAreas = [
  'Gurgaon', 'Delhi', 'Noida', 'Faridabad', 'Greater Noida',
  'Dwarka', 'Rohini', 'Laxmi Nagar', 'Karol Bagh', 'CP'
];

const serviceTypes = [
  { label: 'Emergency', value: 'emergency', icon: <Zap className="h-4 w-4" /> },
  { label: 'Scheduled', value: 'scheduled', icon: <Clock className="h-4 w-4" /> },
  { label: 'Consultation', value: 'consultation', icon: <Search className="h-4 w-4" /> },
  { label: 'Maintenance', value: 'maintenance', icon: <Settings className="h-4 w-4" /> }
];

const quickPresets: FilterPreset[] = [
  {
    name: 'Available Now',
    description: 'Providers available immediately',
    icon: <Zap className="h-4 w-4" />,
    filters: { availability: 'available-now', responseTime: { priority: 'instant' } }
  },
  {
    name: 'Highly Rated',
    description: 'Top-rated providers (4+ stars)',
    icon: <Star className="h-4 w-4" />,
    filters: { rating: { min: 4, includeUnrated: false } }
  },
  {
    name: 'Verified Pros',
    description: 'Background checked & insured',
    icon: <Shield className="h-4 w-4" />,
    filters: { verificationStatus: { verified: true, backgroundChecked: true, insured: true } }
  },
  {
    name: 'Near Me',
    description: 'Within 5km radius',
    icon: <MapPin className="h-4 w-4" />,
    filters: { location: { latitude: 0, longitude: 0, radius: 5 } }
  }
];

export const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
  sectors,
  isOpen
}) => {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  const [activeTab, setActiveTab] = useState<'quick' | 'category' | 'advanced'>('quick');

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilters = (updates: Partial<ProductFilters>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearAllFilters = () => {
    const clearedFilters: ProductFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const applyPreset = (preset: FilterPreset) => {
    const newFilters = { ...localFilters, ...preset.filters };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    return Object.keys(localFilters).filter(key => {
      const value = localFilters[key as keyof ProductFilters];
      return value !== undefined && value !== null && value !== '' && 
             (typeof value !== 'object' || Object.keys(value).length > 0);
    }).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:flex md:items-center md:justify-center md:p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background: transparent;
            pointer-events: none;
            position: relative;
          }
          
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #e11d48;
            cursor: pointer;
            border: 4px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
            pointer-events: all;
            transition: all 0.3s ease;
            position: relative;
            z-index: 10;
          }
          
          .slider-thumb::-webkit-slider-thumb:hover,
          .slider-thumb::-webkit-slider-thumb:active {
            transform: scale(1.15);
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1);
            background: #be185d;
          }
          
          .slider-thumb::-moz-range-thumb {
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #e11d48;
            cursor: pointer;
            border: 4px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
            pointer-events: all;
            transition: all 0.3s ease;
            position: relative;
            z-index: 10;
          }
          
          .slider-thumb::-moz-range-thumb:hover,
          .slider-thumb::-moz-range-thumb:active {
            transform: scale(1.15);
            background: #be185d;
          }
          
          .slider-thumb::-webkit-slider-track {
            background: transparent;
            height: 6px;
            border-radius: 3px;
          }
          
          .slider-thumb::-moz-range-track {
            background: transparent;
            height: 6px;
            border: none;
            border-radius: 3px;
          }
          
          .slider-thumb:focus {
            outline: none;
          }
          
          .slider-thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(225, 29, 72, 0.3);
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .slider-thumb::-webkit-slider-thumb {
              height: 32px;
              width: 32px;
              border: 5px solid #ffffff;
            }
            
            .slider-thumb::-moz-range-thumb {
              height: 32px;
              width: 32px;
              border: 5px solid #ffffff;
            }
            
            .slider-thumb::-webkit-slider-thumb:active {
              transform: scale(1.2);
            }
          }
          
          /* Add touch-action for better mobile performance */
          .slider-container {
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
          }
        `
      }} />
      <div className="bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl w-full h-screen md:h-auto md:max-w-6xl md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 md:p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="px-2 md:px-3 py-1 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-200 dark:border-rose-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="overflow-x-auto flex gap-1 flex-1">
                <div className="flex gap-1 pb-0.5">
                  {localFilters.category && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                      {localFilters.category}
                    </span>
                  )}
                  {localFilters.rating?.min && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5" />{localFilters.rating.min}+
                    </span>
                  )}
                  {localFilters.serviceType && localFilters.serviceType.length > 0 && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                      {localFilters.serviceType.slice(0, 2).join(', ')}{localFilters.serviceType.length > 2 ? '...' : ''}
                    </span>
                  )}
                  {localFilters.location?.radius && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{localFilters.location.radius}km
                    </span>
                  )}
                  {localFilters.priceRange?.preset && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap capitalize">
                      {localFilters.priceRange.preset}
                    </span>
                  )}
                  {localFilters.responseTime?.priority && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                      {localFilters.responseTime.priority}
                    </span>
                  )}
                  {localFilters.verificationStatus && Object.values(localFilters.verificationStatus).some(Boolean) && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded bg-white dark:bg-gray-800 border border-rose-200 hover:border-rose-300"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Desktop Only */}
        <div className="hidden lg:block px-2 py-1.5 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex rounded-lg bg-white dark:bg-gray-900 p-1 shadow-sm">
            {[
              { key: 'quick', label: 'Quick', icon: <Zap className="h-3.5 w-3.5" /> },
              { key: 'category', label: 'Type', icon: <Filter className="h-3.5 w-3.5" /> },
              { key: 'advanced', label: 'More', icon: <Settings className="h-3.5 w-3.5" /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2 md:p-3">
            {/* Mobile: All Filters in Single View */}
            <div className="lg:hidden space-y-3">
            {/* Quick Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-rose-600" />
                Quick Filters
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-rose-600 text-sm">
                        {preset.icon}
                      </div>
                      <h4 className="font-medium text-xs text-gray-900 dark:text-white">
                        {preset.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {preset.description.split(' ').slice(0, 3).join(' ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Price Range</h4>
              
              {/* Custom Range Slider */}
              <div className="space-y-5">
                <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-700">
                    ₹{(localFilters.priceRange?.min || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">-</span>
                  <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-700">
                    ₹{(localFilters.priceRange?.max || 50000).toLocaleString()}
                  </span>
                </div>
                
                <div className="relative px-2 py-6 slider-container">
                  {/* Background track */}
                  <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full top-1/2 transform -translate-y-1/2"></div>
                  
                  {/* Active range track */}
                  <div 
                    className="absolute h-2 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-300 shadow-sm"
                    style={{
                      left: `${((localFilters.priceRange?.min || 0) / 100000) * 100}%`,
                      right: `${100 - ((localFilters.priceRange?.max || 50000) / 100000) * 100}%`,
                    }}
                  />
                  
                  {/* Min range input */}
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={localFilters.priceRange?.min || 0}
                    onChange={(e) => {
                      const minValue = parseInt(e.target.value);
                      const maxValue = localFilters.priceRange?.max || 50000;
                      updateFilters({
                        priceRange: { 
                          min: minValue, 
                          max: Math.max(minValue, maxValue),
                          preset: undefined
                        }
                      });
                    }}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                    style={{ zIndex: 1 }}
                  />
                  
                  {/* Max range input */}
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={localFilters.priceRange?.max || 50000}
                    onChange={(e) => {
                      const maxValue = parseInt(e.target.value);
                      const minValue = localFilters.priceRange?.min || 0;
                      updateFilters({
                        priceRange: { 
                          min: Math.min(minValue, maxValue), 
                          max: maxValue,
                          preset: undefined
                        }
                      });
                    }}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                    style={{ zIndex: 2 }}
                  />
                </div>
                
                {/* Quick amount buttons for mobile */}
                <div className="grid grid-cols-4 gap-2 md:hidden">
                  {[5000, 15000, 30000, 50000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        updateFilters({
                          priceRange: { 
                            min: 0, 
                            max: amount,
                            preset: undefined
                          }
                        });
                      }}
                      className={`py-2 px-1 text-xs border rounded-lg transition-all ${
                        localFilters.priceRange?.max === amount
                          ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Category */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4 text-rose-600" />
                Service Type
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateFilters({ category: undefined })}
                  className={`p-2 text-center border rounded-lg transition-colors text-xs ${
                    !localFilters.category
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                  }`}
                >
                  All Types
                </button>
                {sectors.slice(0, 5).map((sector) => (
                  <button
                    key={sector}
                    onClick={() => updateFilters({ category: sector })}
                    className={`p-2 text-center border rounded-lg transition-colors text-xs ${
                      localFilters.category === sector
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                    }`}
                  >
                    {sector.length > 12 ? sector.substring(0, 12) + '...' : sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Radius */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600" />
                Service Area
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 25].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => updateFilters({
                      location: { 
                        ...localFilters.location, 
                        latitude: localFilters.location?.latitude || 0,
                        longitude: localFilters.location?.longitude || 0,
                        radius 
                      }
                    })}
                    className={`p-2 text-center border rounded-lg transition-colors text-xs ${
                      localFilters.location?.radius === radius
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                    }`}
                  >
                    {radius}km
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-rose-600" />
                Rating
              </h4>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => updateFilters({ rating: { min: rating, includeUnrated: false } })}
                    className={`flex items-center gap-1 px-3 py-2 border rounded-lg transition-colors text-xs ${
                      localFilters.rating?.min === rating
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                    }`}
                  >
                    <Star className="h-3 w-3" />
                    {rating}+
                  </button>
                ))}
              </div>
            </div>

            {/* Response Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-600" />
                Response Time
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {responseTimeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFilters({ 
                      responseTime: { 
                        max: option.minutes, 
                        priority: option.value as any 
                      }
                    })}
                    className={`p-2 text-center border rounded-lg transition-colors text-xs ${
                      localFilters.responseTime?.priority === option.value
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                    }`}
                  >
                    {option.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-rose-600" />
                Verification
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'verified', label: 'Verified' },
                  { key: 'backgroundChecked', label: 'Background Check' },
                  { key: 'insured', label: 'Insured' },
                  { key: 'certified', label: 'Certified' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.verificationStatus?.[item.key as keyof typeof localFilters.verificationStatus] || false}
                      onChange={(e) => {
                        updateFilters({
                          verificationStatus: {
                            ...localFilters.verificationStatus,
                            [item.key]: e.target.checked
                          }
                        });
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Tabbed Content */}
          <div className="hidden lg:block p-2">
            {/* Quick Filters Tab */}
            {activeTab === 'quick' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-rose-600">
                          {preset.icon}
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Service Radius */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Service Radius</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 5, 10, 25].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => updateFilters({
                          location: { 
                            ...localFilters.location, 
                            latitude: localFilters.location?.latitude || 0,
                            longitude: localFilters.location?.longitude || 0,
                            radius 
                          }
                        })}
                        className={`p-3 text-center border rounded-lg transition-colors ${
                          localFilters.location?.radius === radius
                            ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                        }`}
                      >
                        {radius}km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop Price Range */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-700">
                        ₹{(localFilters.priceRange?.min || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">to</span>
                      <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-700">
                        ₹{(localFilters.priceRange?.max || 50000).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="relative px-2 py-4 slider-container">
                      {/* Background track */}
                      <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full top-1/2 transform -translate-y-1/2"></div>
                      
                      {/* Active range track */}
                      <div 
                        className="absolute h-2 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-300 shadow-sm"
                        style={{
                          left: `${((localFilters.priceRange?.min || 0) / 100000) * 100}%`,
                          right: `${100 - ((localFilters.priceRange?.max || 50000) / 100000) * 100}%`,
                        }}
                      />
                      
                      {/* Min range input */}
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        value={localFilters.priceRange?.min || 0}
                        onChange={(e) => {
                          const minValue = parseInt(e.target.value);
                          const maxValue = localFilters.priceRange?.max || 50000;
                          updateFilters({
                            priceRange: { 
                              min: minValue, 
                              max: Math.max(minValue, maxValue),
                              preset: undefined
                            }
                          });
                        }}
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                        style={{ zIndex: 1 }}
                      />
                      
                      {/* Max range input */}
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        value={localFilters.priceRange?.max || 50000}
                        onChange={(e) => {
                          const maxValue = parseInt(e.target.value);
                          const minValue = localFilters.priceRange?.min || 0;
                          updateFilters({
                            priceRange: { 
                              min: Math.min(minValue, maxValue), 
                              max: maxValue,
                              preset: undefined
                            }
                          });
                        }}
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                        style={{ zIndex: 2 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Category Tab */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Service Category
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => updateFilters({ category: undefined })}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      !localFilters.category
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {sectors.map((sector) => (
                    <button
                      key={sector}
                      onClick={() => updateFilters({ category: sector })}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        localFilters.category === sector
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Service Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {serviceTypes.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-300 dark:hover:border-rose-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.serviceType?.includes(type.value as any) || false}
                        onChange={(e) => {
                          const current = localFilters.serviceType || [];
                          const updated = e.target.checked
                            ? [...current, type.value as any]
                            : current.filter(t => t !== type.value);
                          updateFilters({ serviceType: updated });
                        }}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="text-rose-600">{type.icon}</div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              {/* Rating Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Minimum Rating
                </h3>
                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateFilters({ rating: { min: rating, includeUnrated: false } })}
                      className={`flex items-center gap-1 px-3 py-2 border rounded-lg transition-colors ${
                        localFilters.rating?.min === rating
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700'
                          : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Response Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {responseTimeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFilters({ 
                        responseTime: { 
                          max: option.minutes, 
                          priority: option.value as any 
                        }
                      })}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        localFilters.responseTime?.priority === option.value
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                      }`}
                    >
                      <Clock className="h-4 w-4 mx-auto mb-1" />
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Experience Level
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {experienceLevels.map((level) => (
                    <label
                      key={level.value}
                      className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-300 dark:hover:border-rose-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.experienceLevel?.levels?.includes(level.value as any) || false}
                        onChange={(e) => {
                          const current = localFilters.experienceLevel?.levels || [];
                          const updated = e.target.checked
                            ? [...current, level.value as any]
                            : current.filter(l => l !== level.value);
                          updateFilters({ 
                            experienceLevel: { 
                              ...localFilters.experienceLevel,
                              levels: updated 
                            }
                          });
                        }}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-sm font-medium">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verification & Special Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Verification Status
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'verified', label: 'Verified Provider' },
                      { key: 'backgroundChecked', label: 'Background Checked' },
                      { key: 'insured', label: 'Insured' },
                      { key: 'certified', label: 'Certified Professional' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localFilters.verificationStatus?.[item.key as keyof typeof localFilters.verificationStatus] || false}
                          onChange={(e) => {
                            updateFilters({
                              verificationStatus: {
                                ...localFilters.verificationStatus,
                                [item.key]: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Special Features
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'available24x7', label: '24/7 Available' },
                      { key: 'emergencyService', label: 'Emergency Service' },
                      { key: 'onlineConsultation', label: 'Online Consultation' },
                      { key: 'homeVisit', label: 'Home Visit' },
                      { key: 'weekendService', label: 'Weekend Service' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localFilters.specialFeatures?.[item.key as keyof typeof localFilters.specialFeatures] || false}
                          onChange={(e) => {
                            updateFilters({
                              specialFeatures: {
                                ...localFilters.specialFeatures,
                                [item.key]: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 pb-8 md:pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0" style={{ paddingBottom: window.innerWidth < 768 ? 'max(3.5rem, env(safe-area-inset-bottom) + 2rem)' : undefined }}>
          <div className="flex gap-2 mb-2 md:mb-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-2.5 md:py-3 md:px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-2.5 px-2.5 md:py-3 md:px-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm"
            >
              Apply {getActiveFilterCount() > 0 ? `(${getActiveFilterCount()})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};