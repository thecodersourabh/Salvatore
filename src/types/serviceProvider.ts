import { ServiceSector } from "./user";


export interface ServiceProviderProfile {
  id: string;
  sector: ServiceSector;
  userName: string;
  description: string;
  avatar: string;
  email: string;
  phone: string;
  stats?: {
    rating: number;
    completedJobs: number;
    responseTime: number;
    reliability: number;
  };
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
  };
  experience: number; // in years
  skills: string[];
  certifications: string[];
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    category: string;
  }>;
  specializations: string[];
  tools: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    hours: {
      start: string;
      end: string;
    };
    customHours?: Array<{
      day: string;
      hours: {
        start: string;
        end: string;
      };
    }>;
  };
  serviceAreas: {
    locations: string[];
    serviceAtHome: boolean;
    serviceAtWorkshop: boolean;
  };
  pricing: {
    model: string;
    baseRate: number;
    rateUnit?: string;
    minimumCharge?: number;
    travelFee?: number;
    servicePackages?: Array<{
      name: string;
      description: string;
      price: number;
      duration?: string;
      items: string[];
    }>;
  };
  verification?: {
    status: "pending" | "verified" | "rejected";
    documents: Array<{
      type: string;
      status: "pending" | "verified" | "rejected";
      url: string;
      submittedAt: string;
      verifiedAt?: string;
    }>;
  };
}

export interface ServiceProviderRequest {
  userId: string;
  sector: ServiceSector;
  skills: string[];
  experience: number;
  description: string;
  availability: {
    weekdays: boolean;
    weekends: boolean;
    hours: {
      start: string;
      end: string;
    };
  };
  certifications?: string[];
  languages?: string[];
  serviceArea?: string[];
}

export interface UpdateServiceProviderRequest
  extends Partial<ServiceProviderRequest> {
  id: string;
}

export interface SectorConfig {
  id: ServiceSector;
  name: string;
  icon: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  skills: string[];
  certifications: string[];
  questions: {
    id: string;
    text: string;
    type: "boolean" | "text" | "select" | "multiselect";
    options?: string[];
    required: boolean;
  }[];
  pricing: {
    type: "hourly" | "fixed" | "project";
    name: string;
    description: string;
  }[];
  serviceTypes: string[];
}
