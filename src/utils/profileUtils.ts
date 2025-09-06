export const getDefaultBasicInfo = () => ({
  displayName: "",
  description: "",
  avatar: "",
  email: "",
  phone: ""
});

export const getDefaultProfessional = () => ({
  experience: 0,
  skills: [] as string[],
  certifications: [] as string[],
  specializations: [] as string[],
  tools: [] as string[],
  portfolio: [] as Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    category: string;
  }>,
});

export const getDefaultHours = () => ({
  start: "09:00",
  end: "17:00",
});

export const ensureRequiredFields = <T extends Record<string, any>>(
  data: Partial<T>,
  defaults: T
): T => {
  return {
    ...defaults,
    ...data,
  };
};
