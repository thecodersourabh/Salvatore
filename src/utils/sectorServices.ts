import sectorServicesData from '../config/sectorServices.json';
import { ServiceSector } from '../types/user';

export interface Service {
  name: string;
  description: string;
  skills: string[];
}

export interface SectorServices {
  description: string;
  services: Service[];
}

/**
 * Get all available sector names
 */
export const getSectorNames = (): ServiceSector[] => {
  return Object.keys(sectorServicesData) as ServiceSector[];
};

const sectorPackageCategoryMap: Record<string, string> = {
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
  'Pet Care': 'PHYSICAL_ONSITE',
  'Photography & Media': 'CREATIVE',
  'Personal Assistance': 'CONSULTATION',
  Transportation: 'LOGISTICS',
  'Event Services': 'CONSULTATION',
  Handyman: 'PHYSICAL_ONSITE',
  Other: 'PHYSICAL_ONSITE'
};

export const getSectorPackageCategory = (sector: string): string =>
  sectorPackageCategoryMap[sector] || 'PHYSICAL_ONSITE';

/**
 * Normalize sector name to match the format in data
 * Uses case-insensitive comparison to find the correct sector format from the data
 */
const normalizeSectorName = (sector: string): ServiceSector => {
  const inputLower = sector.toLowerCase();
  const availableSectors = Object.keys(sectorServicesData);
  
  // Find the matching sector using case-insensitive comparison
  const matchingSector = availableSectors.find(
    s => s.toLowerCase() === inputLower
  );
  
  // Return the exact casing from the data if found, otherwise fallback to lowercase
  return (matchingSector || inputLower) as ServiceSector;
};

/**
 * Get services for a specific sector
 */
export const getSectorServices = (sector: ServiceSector | string): SectorServices => {
  const normalizedSector = normalizeSectorName(sector);
  return (sectorServicesData as any)[normalizedSector] || {
    description: 'Services not found',
    services: []
  };
};

export const findSectorForService = (
  serviceName: string
): { sector: ServiceSector; service: Service } | null => {
  const normalizedName = serviceName.trim().toLowerCase();
  if (!normalizedName) return null;

  for (const sector of getSectorNames()) {
    const service = getSectorServices(sector).services.find(
      candidate => candidate.name.trim().toLowerCase() === normalizedName
    );
    if (service) return { sector, service };
  }

  return null;
};

/**
 * Get all services across all sectors
 */
export const getAllSectorServices = (): Record<string, SectorServices> => {
  return sectorServicesData as Record<string, SectorServices>;
};

/**
 * Get all unique skills for a specific sector
 */
export const getSectorSkills = (sector: ServiceSector | string): string[] => {
  const sectorData = getSectorServices(sector);
  
  // Collect all unique skills from all services in the sector
  const skillsSet = new Set<string>();
  sectorData.services.forEach(service => {
    service.skills.forEach(skill => skillsSet.add(skill));
  });

  return Array.from(skillsSet);
};

/**
 * Get all services with their associated skills for a sector
 */
export const getSectorServicesWithSkills = (sector: ServiceSector): Service[] => {
  const sectorData = getSectorServices(sector);
  return sectorData.services;
};
