import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setTotalSteps,
  setCurrentStep,
  nextStep,
  previousStep,
  resetSteps,
  selectCurrentStep,
  selectTotalSteps,
  selectCanGoNext,
  selectCanGoPrevious,
  selectStepProgress,
} from '../store/slices/stepSlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides step management functionality using Redux
export const useStep = () => {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector(selectCurrentStep);
  const totalSteps = useAppSelector(selectTotalSteps);
  const canGoNext = useAppSelector(selectCanGoNext);
  const canGoPrevious = useAppSelector(selectCanGoPrevious);
  const stepProgress = useAppSelector(selectStepProgress);

  const updateTotalSteps = useCallback((total: number) => {
    dispatch(setTotalSteps(total));
  }, [dispatch]);

  const goToStep = useCallback((step: number) => {
    dispatch(setCurrentStep(step));
  }, [dispatch]);

  const goNext = useCallback(() => {
    dispatch(nextStep());
  }, [dispatch]);

  const goPrevious = useCallback(() => {
    dispatch(previousStep());
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetSteps());
  }, [dispatch]);

  return useMemo(() => ({
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrevious,
    stepProgress,
    setTotalSteps: updateTotalSteps,
    setCurrentStep: goToStep,
    nextStep: goNext,
    previousStep: goPrevious,
    resetSteps: reset,
  }), [
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrevious,
    stepProgress,
    updateTotalSteps,
    goToStep,
    goNext,
    goPrevious,
    reset,
  ]);
};