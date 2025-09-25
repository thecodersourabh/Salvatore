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
