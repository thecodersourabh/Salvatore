export type Hours = {
  start: string;
  end: string;
};

export type Availability = {
  weekdays: boolean;
  weekends: boolean;
  hours: Hours;
};

export type ServiceAreas = {
  locations: string[];
  serviceAtHome: boolean;
  serviceAtWorkshop: boolean;
  radius: number;
  unit: string;
};

export type Pricing = {
  model: string;
  baseRate: number;
  currency: string;
};

export type FormData = {
  name: string;
  sector: string;
  phoneNumber: string;
  skills: string[];
  availability: Availability;
  serviceAreas: ServiceAreas;
  pricing: Pricing;
};

export type ModalState = {
  isOpen: boolean;
  saving: boolean;
  error: string | null;
};
