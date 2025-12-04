export type ServiceSector =
  | "Technology"
  | "electrician"
  | "plumber"
  | "carpenter"
  | "mechanic"
  | "tailor"
  | "beautician"
  | "cleaner"
  | "painter"
  | "gardener"
  | "tutor"
  | "chef"
  | "agency"
  | "other";

export type UserRole = 'customer' | 'seller';

export type DocumentType = 'aadhaar' | 'pan' | 'professional';

export interface Document {
  key: string;
  url?: string;
  name: string;
  type: string;
  size: number;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  uploadedAt: string;
}

export interface Documents {
  aadhaar?: Document;
  pan?: Document;
  others?: Document[];
  professional?: Document[];
}

export interface User {
  id: string;
  auth0Id?: string;
  name?: string;
  userName: string;
  avatar?: string;
  email?: string;
  role?: UserRole;
  displayName?: string;
  description?: string;
  sector?: ServiceSector;
  phone?: string;
  experience?: number;
  specializations?: Array<string>;
  updatedAt?: string;
  createdAt?: string;
  skills?: Array<{
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience: number;
  }>;
  availability?: {
    weekdays: boolean;
    weekends: boolean;
    hours: {
      start: string;
      end: string;
    };
  };
  serviceAreas?: {
    locations: Array<{
      city: string;
      state: string;
      country: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    }>;
    serviceAtHome: boolean;
    serviceAtWorkshop: boolean;
    radius: number;
    unit: "km" | "mi";
  };
  services?: Array<{
    id: string;
    name: string;
    description: string;
    contactDetails: {
      email: string;
      phone: string;
    };
    pricing: {
      model: "hourly" | "fixed" | "project";
      baseRate: number;
      currency: string;
    };
  }>;
  preferences?: {
    notificationSettings: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inboxMessages: boolean;
      orderMessages: boolean;
      orderUpdates: boolean;
      ratingReminders: boolean;
      buyerBriefs: boolean;
      accountUpdates: boolean;
      realtime: boolean;
    };
    visibility: {
      public: boolean;
      searchable: boolean;
    };
   
  };
  pricing?: {
    model: "hourly" | "fixed" | "project";
    baseRate: number;
    currency: string;
    minimumCharge: number;
    travelFee: number;
    servicePackages: Array<any>;
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    verificationUrl: string;
  }>;
  documents?: {
  aadhaar?: Document;
  pan?: Document;
  others?: Document[];
  professional?: Document[];
};
  portfolio?: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    category: string;
  }>;
  stats?: {
    rating: number;
    completedJobs: number;
    responseTime: number;
    reliability: number;
  };
  tags?: Array<string>;
  languages?: Array<string>;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  auth0Id?: string;
  password?: string;
  isServiceProvider?: boolean;
  role?: UserRole;
  version?: number;
}

export interface Address {
  addressId: string;
  userId: string;
  type: "home" | "office" | "work" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  userId: string;
  type: "home" | "office" | "work" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {
  id: string;
}
