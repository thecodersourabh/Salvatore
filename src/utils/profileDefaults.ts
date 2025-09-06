import { ServiceSector, User } from "../types/user";


const defaultProfessional = {
  experience: 0,
  skills: [] as Array<{
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience: number;
  }>,
  certifications: [] as Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    verificationUrl: string;
  }>,
  portfolio: [] as Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    category: string;
  }>,
  specializations: [] as string[],
  tools: [] as string[],
};

const defaultHours = {
  start: "09:00",
  end: "17:00",
};

const defaultServiceAreas = {
  locations: [] as Array<{
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>,
  serviceAtHome: false,
  serviceAtWorkshop: false,
};

const defaultAvailability = {
  weekdays: true,
  weekends: false,
  hours: defaultHours,
  customHours: [],
};

const defaultPricing = {
  model: "hourly" as "hourly" | "fixed" | "project",
  baseRate: 0,
  currency: "USD",
  minimumCharge: 0,
  travelFee: 0,
  servicePackages: [],
};

export const createDefaultProfile = (
  id: string,
  sector: ServiceSector
): User => ({
  id,
  name: "",
  description: "",
  avatar: "",
  email: "",
  phone: "",
  sector,
  ...defaultProfessional,
  availability: {
    weekdays: true,
    weekends: false,
    hours: { ...defaultHours },
  },
  serviceAreas: { ...defaultServiceAreas },
  pricing: { ...defaultPricing },
});

export const ensureRequiredProfileFields = (
  profile: Partial<User>
): User => {
  if (!profile.id || !profile.sector) {
    throw new Error("id and sector are required fields");
  }

  return {
    ...createDefaultProfile(profile.id, profile.sector),
    ...profile,
    ...defaultProfessional,
    availability: {
      ...defaultAvailability,
      ...profile.availability,
      hours: {
        ...defaultHours,
        ...profile.availability?.hours,
      },
    },
    serviceAreas: {
      ...defaultServiceAreas,
      ...profile.serviceAreas,
    },
    pricing: {
      ...defaultPricing,
      ...profile.pricing,
    },
  };
};
