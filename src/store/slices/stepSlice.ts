import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StepState {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

const initialState: StepState = {
  currentStep: 0, // Start from 0 to match ProfileCompletion component
  totalSteps: 1,
  canGoNext: false,
  canGoPrevious: false,
};

const stepSlice = createSlice({
  name: 'step',
  initialState,
  reducers: {
    setTotalSteps: (state, action: PayloadAction<number>) => {
      state.totalSteps = action.payload;
      // Update navigation abilities
      state.canGoNext = state.currentStep < state.totalSteps - 1;
      state.canGoPrevious = state.currentStep > 0;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      const newStep = Math.max(0, Math.min(action.payload, state.totalSteps - 1));
      state.currentStep = newStep;
      // Update navigation abilities  
      state.canGoNext = state.currentStep < state.totalSteps - 1;
      state.canGoPrevious = state.currentStep > 0;
    },
    nextStep: (state) => {
      if (state.canGoNext) {
        state.currentStep += 1;
        // Update navigation abilities
        state.canGoNext = state.currentStep < state.totalSteps - 1;
        state.canGoPrevious = state.currentStep > 0;
      }
    },
    previousStep: (state) => {
      if (state.canGoPrevious) {
        state.currentStep -= 1;
        // Update navigation abilities
        state.canGoNext = state.currentStep < state.totalSteps - 1;
        state.canGoPrevious = state.currentStep > 0;
      }
    },
    resetSteps: (state) => {
      state.currentStep = 0;
      state.canGoNext = state.totalSteps > 1;
      state.canGoPrevious = false;
    },
  },
});

export const { setTotalSteps, setCurrentStep, nextStep, previousStep, resetSteps } = stepSlice.actions;

// Selectors
export const selectCurrentStep = (state: { step: StepState }) => state.step?.currentStep || 0;
export const selectTotalSteps = (state: { step: StepState }) => state.step?.totalSteps || 1;
export const selectCanGoNext = (state: { step: StepState }) => state.step?.canGoNext || false;
export const selectCanGoPrevious = (state: { step: StepState }) => state.step?.canGoPrevious || false;
export const selectStepProgress = (state: { step: StepState }) => {
  const current = state.step?.currentStep || 0;
  const total = state.step?.totalSteps || 1;
  return ((current + 1) / total) * 100; // +1 because steps are 0-based but progress shows 1-based
};

export default stepSlice.reducer;