import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  toggleSector,
  addServiceToSector,
  removeServiceFromSector,
} from '../../store/slices/progressiveProfilingSlice';
import sectorServices from '../../config/sectorServices.json';

interface SectorSelectionProps {
  onContinue: () => void;
  onBack?: () => void;
}

interface SectorConfig {
  [key: string]: {
    description: string;
    services: Array<{
      name: string;
      description: string;
      skills?: string[];
      category?: string;
    }>;
  };
}

const SectorSelection: React.FC<SectorSelectionProps> = ({
  onContinue,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const { selectedSectors, selectedServices } = useAppSelector(
    (state) => state.profiling
  );

  const [expandedSector, setExpandedSector] = useState<string | null>(
    selectedSectors.length > 0 ? selectedSectors[0] : null
  );

  const sectors = useMemo(() => {
    const config = sectorServices as SectorConfig;
    return Object.keys(config).sort();
  }, []);

  const handleSectorToggle = (sector: string) => {
    dispatch(toggleSector(sector));
    if (!selectedSectors.includes(sector)) {
      setExpandedSector(sector);
    }
  };

  const handleServiceToggle = (sector: string, service: string) => {
    const isSelected = selectedServices[sector]?.includes(service);
    if (isSelected) {
      dispatch(removeServiceFromSector({ sector, service }));
    } else {
      dispatch(addServiceToSector({ sector, service }));
    }
  };

  const getSectorDescription = (sector: string): string => {
    const config = sectorServices as SectorConfig;
    return config[sector]?.description || '';
  };

  const getSectorServices = (sector: string) => {
    const config = sectorServices as SectorConfig;
    return config[sector]?.services || [];
  };

  const totalServicesSelected = Object.values(selectedServices).reduce(
    (sum, services) => sum + services.length,
    0
  );

  const isFormValid = selectedSectors.length > 0 && totalServicesSelected > 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full mx-auto mb-4">
          <svg
            className="w-6 h-6 text-rose-600 dark:text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Select Your Services
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Choose the sectors and services you offer
        </p>
      </div>

      {/* Sectors and Services */}
      <div className="space-y-3 mb-8 max-h-96 overflow-y-auto pr-2">
        {sectors.map((sector) => (
          <div
            key={sector}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/50 transition-all"
          >
            {/* Sector Header */}
            <button
              onClick={() => handleSectorToggle(sector)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3 text-left flex-1">
                <input
                  type="checkbox"
                  checked={selectedSectors.includes(sector)}
                  onChange={() => {}}
                  className="w-5 h-5 text-rose-600 rounded dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {sector}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getSectorDescription(sector)}
                  </p>
                </div>
              </div>

              {selectedSectors.includes(sector) && (
                <div className="ml-2 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {selectedServices[sector]?.length || 0}
                </div>
              )}

              {/* Expand/collapse icon */}
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ml-2 ${
                  expandedSector === sector ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* Services list (expandable) */}
            {selectedSectors.includes(sector) && expandedSector === sector && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="space-y-2">
                  {getSectorServices(sector).map((service) => (
                    <label
                      key={service.name}
                      className="flex items-start space-x-3 p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedServices[sector]?.includes(service.name) ||
                          false
                        }
                        onChange={() => handleServiceToggle(sector, service.name)}
                        className="w-4 h-4 text-rose-600 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {service.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selection summary */}
      {selectedSectors.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Selected:</strong> {selectedSectors.length} sector(s),{' '}
            {totalServicesSelected} service(s)
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Continue button */}
        <button
          onClick={onContinue}
          disabled={!isFormValid}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          <span>
            Continue ({selectedSectors.length > 0 ? `${selectedSectors.length}/${sectors.length}` : 'Select sectors'})
          </span>
        </button>

        {/* Back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Help text */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong> Tip:</strong> Select at least one sector and one service to get started. You can always add more services later.
        </p>
      </div>
    </div>
  );
};

export default SectorSelection;
