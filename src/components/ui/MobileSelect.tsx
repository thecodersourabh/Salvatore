import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  options: SelectOption[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  options,
  value,
  placeholder = "Select an option",
  onChange,
  disabled = false,
  required = false,
  className = "",
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current && selectedOption) {
      const selectedElement = dropdownRef.current.querySelector(`[data-value="${selectedOption.value}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, selectedOption]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Select Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-lg text-left transition-all duration-200 ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
          } ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
          } ${
            isOpen ? 'ring-2 ring-rose-500 border-rose-500' : ''
          }`}
        >
          <span className={`block truncate ${
            selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Full screen backdrop */}
            <div 
              className="fixed inset-0 z-[9998] bg-black bg-opacity-50" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Full screen modal on mobile, dropdown on desktop */}
            <div className="md:hidden fixed inset-0 z-[9999] flex items-end">
              <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {label || 'Select Option'}
                    </h3>
                    {selectedOption && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({filteredOptions.length} options)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search input */}
                {options.length > 5 && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search options..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Options List - Full height scrollable */}
                <div className="flex-1 overflow-y-auto">
                  {filteredOptions.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No options found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-value={option.value}
                          onClick={() => !option.disabled && handleSelect(option.value)}
                          disabled={option.disabled}
                          className={`w-full flex items-center justify-between p-4 rounded-xl mb-2 text-left transition-all duration-200 ${
                            option.disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                          } ${
                            option.value === value
                              ? 'bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                              : 'text-gray-900 dark:text-white border-2 border-transparent'
                          }`}
                        >
                          <span className="font-medium">{option.label}</span>
                          {option.value === value && (
                            <Check className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom padding for safe area */}
                <div className="h-4 bg-white dark:bg-gray-800"></div>
              </div>
            </div>

            {/* Desktop dropdown */}
            <div className="hidden md:block absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-hidden">
              {/* Search input for many options */}
              {options.length > 5 && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* Desktop Options List */}
              <div className="overflow-y-auto max-h-80">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      data-value={option.value}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                        option.disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                      } ${
                        option.value === value
                          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      <span className="block truncate">{option.label}</span>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};