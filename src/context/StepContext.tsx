import React, { createContext, useContext, useState, useEffect } from 'react';

interface StepContextType {
  currentStep: number;
  totalSteps: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

const TOTAL_STEPS = 5; // Total number of steps in the form

const StepContext = createContext<StepContextType | undefined>(undefined);

export const StepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Computed properties
  const canGoPrevious = currentStep > 0;
  const canGoNext = currentStep < TOTAL_STEPS - 1;
  
  // Debug effect
  useEffect(() => {
    console.log('Step Context State:', {
      currentStep,
      canGoNext,
      canGoPrevious,
      totalSteps: TOTAL_STEPS
    });
  }, [currentStep, canGoNext, canGoPrevious]);

  const setStep = (step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      console.log('Setting step to:', step);
      setCurrentStep(step);
    } else {
      console.warn('Invalid step value:', step);
    }
  };

  const nextStep = () => {
    if (canGoNext) {
      console.log('Moving to next step');
      setCurrentStep(prev => prev + 1);
    } else {
      console.warn('Cannot go to next step');
    }
  };

  const previousStep = () => {
    if (canGoPrevious) {
      console.log('Moving to previous step');
      setCurrentStep(prev => prev - 1);
    } else {
      console.warn('Cannot go to previous step');
    }
  };

  const value = {
    currentStep,
    totalSteps: TOTAL_STEPS,
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
