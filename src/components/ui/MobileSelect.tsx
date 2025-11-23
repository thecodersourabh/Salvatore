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
            {/* Backdrop for mobile */}
            <div className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden" />
            
            {/* Dropdown Content */}
            <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden ${
              // On mobile, show as bottom sheet
              'md:relative md:mt-1 md:max-h-60' +
              ' fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-auto md:left-auto md:right-auto' +
              ' rounded-t-2xl md:rounded-lg border-t md:border shadow-2xl md:shadow-lg max-h-[50vh] md:max-h-60'
            }`}>
              
              {/* Mobile drag handle */}
              <div className="md:hidden flex justify-center py-2 bg-gray-50 dark:bg-gray-700 rounded-t-2xl">
                <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Search input for many options */}
              {options.length > 5 && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    autoFocus
                  />
                </div>
              )}

              {/* Options List */}
              <div 
                ref={dropdownRef}
                className="overflow-y-auto max-h-48 md:max-h-52"
              >
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
                      className={`w-full flex items-center justify-between px-3 py-3 md:py-2.5 text-left transition-colors ${
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

              {/* Mobile close button */}
              <div className="md:hidden p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
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