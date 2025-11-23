import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { countries, Country } from '../../data/countries';

interface CountrySelectProps {
  value: string;
  onChange: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = "Select country",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(country => country.code === value || country.name === value);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.phoneCode.includes(searchQuery)
  );

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

  const handleSelect = (country: Country) => {
    onChange(country);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Select Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
        } ${
          isOpen ? 'ring-2 ring-rose-500 border-rose-500' : ''
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {selectedCountry ? (
            <>
              <span className="text-lg flex-shrink-0">{selectedCountry.flag}</span>
              <span className="truncate text-sm font-medium">{selectedCountry.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                {selectedCountry.phoneCode}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden" />
          
          {/* Dropdown Content */}
          <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden ${
            // Mobile bottom sheet style
            'md:relative md:mt-1 md:max-h-64' +
            ' fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-auto md:left-auto md:right-auto' +
            ' rounded-t-2xl md:rounded-lg border-t md:border shadow-2xl md:shadow-lg max-h-[60vh] md:max-h-64'
          }`}>
            
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center py-2 bg-gray-50 dark:bg-gray-700 rounded-t-2xl">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Search input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="overflow-y-auto max-h-48 md:max-h-48">
              {filteredCountries.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 ${
                      country.code === selectedCountry?.code
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{country.name}</div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-mono">
                      {country.phoneCode}
                    </span>
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
  );
};