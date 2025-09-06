import sectorServicesData from '../config/sectorServices.json';
import { ServiceSector } from '../types/user';

export interface Service {
  name: string;
  description: string;
}

export interface SectorServices {
  description: string;
  services: Service[];
}

export const getSectorServices = (sector: ServiceSector): SectorServices => {
  return sectorServicesData[sector] || {
    description: 'Services not found',
    services: []
  };
};

export const getAllSectorServices = (): Record<ServiceSector, SectorServices> => {
  return sectorServicesData as Record<ServiceSector, SectorServices>;
};
