export interface ProfileLocation {
  city: string;
  state: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ProfileSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

export interface ProfileAvailability {
  weekdays: boolean;
  weekends: boolean;
  hours: {
    start: string;
    end: string;
  };
}

export interface ProfilePricing {
  model: 'hourly' | 'fixed' | 'project';
  baseRate: number;
  currency: string;
  minimumCharge: number;
  travelFee: number;
  servicePackages: string[];
}

export interface ServiceAreas {
  locations: ProfileLocation[];
  serviceAtHome: boolean;
  serviceAtWorkshop: boolean;
  radius: number;
  unit: 'km' | 'mi';
}

export interface Profile {
  id?: string;
  email: string;
  name: string;
  userName: string;
  sector: string;
  phone: string;
  avatar?: string;
  description?: string;
  coverImage?: string;
  preferences?: {
    notificationSettings: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    visibility: {
      public: boolean;
      searchable: boolean;
    };
    serviceAtHome: boolean;
    serviceAtWorkshop: boolean;
    radius: number;
    unit: "km" | "mi";
  };
  skills: ProfileSkill[];
  availability: ProfileAvailability;
  serviceAreas: ServiceAreas;
  pricing: ProfilePricing;
}
