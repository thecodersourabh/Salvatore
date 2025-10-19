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

export type Skill = {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
  };

export type Location = {
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  export type DocumentType = 'aadhaar' | 'pan' | 'professional';

  export type Document = {
    key: string;
    url: string;
    name: string;
    type: string;
    size: number;
    verified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    uploadedAt: string;
  };


  export type Documents = {
    aadhaar?: Document;
    pan?: Document;
    others?: Document[];
    professional?: Document[];
  };

  export type FormDataType = {
    name: string;
    userName: string;
    sector: string;
    phoneNumber: string;
    avatar: string;
    documents: Documents;
    skills: Skill[];
    selectedServices?: string[];
    availability: {
      weekdays: boolean;
      weekends: boolean;
      hours: {
        start: string;
        end: string;
      };
    };
    serviceAreas: {
      locations: Location[];
      serviceAtHome: boolean;
      serviceAtWorkshop: boolean;
      radius: number;
      unit: 'km' | 'mi';
    };
    pricing: {
      model: 'hourly' | 'fixed' | 'project';
      baseRate: number;
      currency: string;
      minimumCharge: number;
      travelFee: number;
      servicePackages: string[];
    };
  };