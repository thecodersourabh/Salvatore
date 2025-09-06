import { SectorConfig } from '../types/serviceProvider';

export const sectorConfigs: Record<string, SectorConfig> = {
  electrician: {
    id: 'electrician',
    name: 'Electrician',
    icon: 'lightning',
    description: 'Professional electrical services for residential and commercial needs',
    requiredFields: ['license', 'insurance', 'experience'],
    optionalFields: ['tools', 'specializations'],
    skills: [
      'Residential Wiring',
      'Commercial Installation',
      'Emergency Repairs',
      'Circuit Breaker Service',
      'Lighting Installation',
      'Power Distribution',
      'Electrical Maintenance',
      'Safety Inspections'
    ],
    certifications: [
      'Master Electrician License',
      'Journeyman License',
      'Electrical Safety Certification',
      'Industrial Electrical Certification'
    ],
    questions: [
      {
        id: 'emergency',
        text: 'Do you provide emergency services?',
        type: 'boolean',
        required: true
      },
      {
        id: 'voltage',
        text: 'What voltage systems do you work with?',
        type: 'multiselect',
        options: ['Low Voltage', 'Medium Voltage', 'High Voltage'],
        required: true
      }
    ],
    pricing: [
      {
        type: 'hourly',
        name: 'Standard Service',
        description: 'Regular electrical work and installations'
      },
      {
        type: 'fixed',
        name: 'Emergency Call-out',
        description: 'Fixed rate for emergency responses'
      }
    ],
    serviceTypes: [
      'Installation',
      'Repair',
      'Maintenance',
      'Inspection',
      'Emergency Service'
    ]
  },
  plumber: {
    id: 'plumber',
    name: 'Plumber',
    icon: 'droplet',
    description: 'Expert plumbing services for all your water and drainage needs',
    requiredFields: ['license', 'insurance', 'experience'],
    optionalFields: ['tools', 'specializations'],
    skills: [
      'Pipe Installation',
      'Leak Detection',
      'Drain Cleaning',
      'Water Heater Service',
      'Bathroom Plumbing',
      'Kitchen Plumbing',
      'Sewer Line Repair'
    ],
    certifications: [
      'Master Plumber License',
      'Journeyman Plumber License',
      'Gas Fitting Certificate'
    ],
    questions: [
      {
        id: 'emergency',
        text: 'Do you provide emergency services?',
        type: 'boolean',
        required: true
      },
      {
        id: 'commercial',
        text: 'Do you handle commercial projects?',
        type: 'boolean',
        required: true
      }
    ],
    pricing: [
      {
        type: 'hourly',
        name: 'Standard Service',
        description: 'Regular plumbing work'
      },
      {
        type: 'fixed',
        name: 'Emergency Service',
        description: 'Fixed rate for emergency calls'
      }
    ],
    serviceTypes: [
      'Installation',
      'Repair',
      'Maintenance',
      'Emergency Service',
      'Inspection'
    ]
  },
  tailor: {
    id: 'tailor',
    name: 'Tailor',
    icon: 'scissors',
    description: 'Custom clothing and alterations by skilled professionals',
    requiredFields: ['experience', 'specializations'],
    optionalFields: ['tools', 'portfolio'],
    skills: [
      'Custom Clothing',
      'Alterations',
      'Pattern Making',
      'Wedding Dresses',
      'Formal Wear',
      'Leather Work',
      'Embroidery'
    ],
    certifications: [
      'Professional Tailoring Certificate',
      'Fashion Design Degree',
      'Pattern Making Certificate'
    ],
    questions: [
      {
        id: 'materials',
        text: 'What types of materials do you work with?',
        type: 'multiselect',
        options: ['Cotton', 'Silk', 'Wool', 'Leather', 'Synthetic'],
        required: true
      },
      {
        id: 'turnaround',
        text: 'What is your typical turnaround time?',
        type: 'select',
        options: ['1-2 days', '3-5 days', '1 week', '2+ weeks'],
        required: true
      }
    ],
    pricing: [
      {
        type: 'fixed',
        name: 'Basic Alterations',
        description: 'Simple alterations and repairs'
      },
      {
        type: 'project',
        name: 'Custom Clothing',
        description: 'Made-to-measure clothing'
      }
    ],
    serviceTypes: [
      'Alterations',
      'Custom Clothing',
      'Repairs',
      'Wedding & Formal',
      'Pattern Making'
    ]
  },
  mechanic: {
    id: 'mechanic',
    name: 'Mechanic',
    icon: 'tool',
    description: 'Professional automotive repair and maintenance services',
    requiredFields: ['license', 'experience', 'specializations'],
    optionalFields: ['tools', 'certifications'],
    skills: [
      'Engine Repair',
      'Brake Service',
      'Transmission',
      'Electrical Systems',
      'Diagnostics',
      'AC Service',
      'Preventive Maintenance'
    ],
    certifications: [
      'ASE Certification',
      'Master Mechanic License',
      'Specialized Vehicle Certifications'
    ],
    questions: [
      {
        id: 'vehicleTypes',
        text: 'What types of vehicles do you service?',
        type: 'multiselect',
        options: ['Cars', 'Trucks', 'SUVs', 'Motorcycles', 'Commercial'],
        required: true
      },
      {
        id: 'mobile',
        text: 'Do you offer mobile services?',
        type: 'boolean',
        required: true
      }
    ],
    pricing: [
      {
        type: 'hourly',
        name: 'Labor',
        description: 'Standard labor rate'
      },
      {
        type: 'fixed',
        name: 'Diagnostic',
        description: 'Initial diagnostic fee'
      }
    ],
    serviceTypes: [
      'Repair',
      'Maintenance',
      'Diagnostic',
      'Emergency Service',
      'Inspection'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Service Agency',
    icon: 'building',
    description: 'Professional service coordination and management',
    requiredFields: ['license', 'insurance', 'businessRegistration'],
    optionalFields: ['specializations', 'coverage'],
    skills: [
      'Service Coordination',
      'Project Management',
      'Quality Assurance',
      'Customer Service',
      'Emergency Response'
    ],
    certifications: [
      'Business License',
      'Insurance Coverage',
      'Quality Management Certification'
    ],
    questions: [
      {
        id: 'services',
        text: 'What services do you coordinate?',
        type: 'multiselect',
        options: ['Cleaning', 'Maintenance', 'Security', 'Technical', 'Administrative'],
        required: true
      },
      {
        id: 'coverage',
        text: 'What is your service coverage area?',
        type: 'text',
        required: true
      }
    ],
    pricing: [
      {
        type: 'project',
        name: 'Contract Services',
        description: 'Long-term service contracts'
      },
      {
        type: 'fixed',
        name: 'One-time Service',
        description: 'Single service coordination'
      }
    ],
    serviceTypes: [
      'Residential Services',
      'Commercial Services',
      'Project Management',
      'Emergency Coordination',
      'Maintenance Contracts'
    ]
  }
};

export const getDefaultProfileForSector = (sector: string, userId: string) => {
  const config = sectorConfigs[sector];
  if (!config) return null;

  return {
    userId,
    sector,
    profile: {
      basicInfo: {
        displayName: '',
        description: '',
        avatar: '',
        contactInfo: {
          email: '',
          phone: '',
        }
      },
      professional: {
        experience: 0,
        skills: [],
        certifications: [],
        portfolio: [],
        specializations: [],
        tools: []
      },
      availability: {
        weekdays: true,
        weekends: false,
        hours: {
          start: '09:00',
          end: '17:00'
        }
      },
      serviceAreas: {
        locations: [],
        serviceAtHome: true,
        serviceAtWorkshop: false
      },
      pricing: {
        model: config.pricing[0].type,
        baseRate: 0,
        currency: 'USD',
        customRates: {}
      },
      sectorSpecific: {}
    },
    stats: {
      rating: 0,
      completedJobs: 0,
      responseRate: 0,
      memberSince: new Date().toISOString()
    },
    verification: {
      identityVerified: false,
      phoneVerified: false,
      emailVerified: false,
      documentsVerified: false
    },
    preferences: {
      notificationChannels: ['email'],
      jobPreferences: {
        types: []
      },
      displaySettings: {
        showPhone: true,
        showEmail: true,
        showRating: true
      }
    }
  };
};
