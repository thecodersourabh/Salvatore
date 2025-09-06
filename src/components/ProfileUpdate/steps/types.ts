import { User } from '../../../types/user';

export interface StepProps {
  profile: User | null;
  onUpdate: (updates: Partial<User>) => Promise<void>;
  isAnimating?: boolean;
}

export interface BasicInfoStepProps extends StepProps {
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export interface AvailabilityStepProps {
  availability: User['availability'];
  onUpdate: (availability: NonNullable<User['availability']>) => Promise<void>;
  isAnimating?: boolean;
}

export interface ServiceAreasStepProps {
  areas: User['serviceAreas'];
  onUpdate: (areas: NonNullable<User['serviceAreas']>) => Promise<void>;
  isAnimating?: boolean;
}

export interface PricingStepProps {
  pricing: User['pricing'];
  onUpdate: (pricing: NonNullable<User['pricing']>) => Promise<void>;
  isAnimating?: boolean;
}

export interface PortfolioStepProps {
  portfolio: User['portfolio'];
  onAddItem: (item: Omit<NonNullable<User['portfolio']>[number], 'id' | 'date'>) => Promise<void>;
  isAnimating?: boolean;
}
