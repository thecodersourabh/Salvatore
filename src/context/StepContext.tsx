import React, { createContext, useContext, useState } from 'react';
import { PROFILE_STEPS } from '../constants';

interface StepContextType {
  currentStep: number;
  totalSteps: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

const StepContext = createContext<StepContextType | undefined>(undefined);

export const StepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Computed properties
  const canGoPrevious = currentStep > 0;
  const canGoNext = currentStep < PROFILE_STEPS.TOTAL - 1;

  const setStep = (step: number) => {
    if (step >= 0 && step < PROFILE_STEPS.TOTAL) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (canGoPrevious) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const value = {
    currentStep,
    totalSteps: PROFILE_STEPS.TOTAL,
    setStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious
  };

  return (
    <StepContext.Provider value={value}>
      {children}
    </StepContext.Provider>
  );
};

export const useStep = () => {
  const context = useContext(StepContext);
  if (context === undefined) {
    throw new Error('useStep must be used within a StepProvider');
  }
  return context;
};
