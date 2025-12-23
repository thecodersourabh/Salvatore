// Helper reducer to prefill user data
function prefillUserProfile(state: ProgressiveProfilingState, user: any) {
  if (user.userName) state.username = user.userName;
  if (user.phone) state.phoneNumber = user.phone;
  if (user.sectors) state.selectedSectors = user.sectors;
  if (user.services) state.selectedServices = user.services;
  if (typeof user.phoneVerified === 'boolean') state.phoneVerified = user.phoneVerified;
  if (typeof user.profilingComplete === 'boolean') state.profilingComplete = user.profilingComplete;
  if (user.otpCode) state.otpCode = user.otpCode;
  if (user.profilingStep) state.currentStep = user.profilingStep;
  if (user.usernameAvailable !== undefined) state.usernameAvailable = user.usernameAvailable;
  if (user.usernameError !== undefined) state.usernameError = user.usernameError;
  if (user.selectedServices) state.selectedServices = user.selectedServices;
  if (user.selectedSectors) state.selectedSectors = user.selectedSectors;
  // Add more mappings as needed for new fields
}
import { ServiceProviderService } from '../../services/serviceProviderService';
// Thunk to get user by email
export const getUserProfileByEmail = createAsyncThunk(
  'profiling/getUserProfileByEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const user = await UserService.getUserByEmail(email);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch user');
    }
  }
);

// Thunk to update username, sector(s), phoneVerified, and profilingComplete
export const updateUserProfile = createAsyncThunk(
  'profiling/updateUserProfile',
  async (
    params: {
      email: string;
      username?: string;
      sectors?: string[];
      services?: { [sector: string]: string[] };
      phoneVerified?: boolean;
      profilingComplete?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // If sectors/services are present, use saveSectorSelection for those fields
      if (params.sectors && params.services) {
        // Use email as userId for saveSectorSelection (API expects userId or email)
        const user = await UserService.saveSectorSelection(
          params.email,
          params.sectors,
          params.services
        );
        // If username or other fields also need update, call updateProfile as well
        if (params.username || typeof params.phoneVerified === 'boolean' || typeof params.profilingComplete === 'boolean') {
          const profile: any = {};
          if (params.username) profile.userName = params.username;
          if (typeof params.phoneVerified === 'boolean') profile.phoneVerified = params.phoneVerified;
          if (typeof params.profilingComplete === 'boolean') profile.profilingComplete = params.profilingComplete;
          await ServiceProviderService.updateProfile(params.email, profile);
        }
        return user;
      } else {
        // Only username/other fields
        const profile: any = {};
        if (params.username) profile.userName = params.username;
        if (typeof params.phoneVerified === 'boolean') profile.phoneVerified = params.phoneVerified;
        if (typeof params.profilingComplete === 'boolean') profile.profilingComplete = params.profilingComplete;
        const user = await ServiceProviderService.updateProfile(params.email, profile);
        return user;
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update user profile');
    }
  }
);

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VerificationService } from '../../services/verificationService';
import { UserService } from '../../services/userService';

export type ProfilingStep = 'phone' | 'otp' | 'username' | 'sectors' | 'complete';

export interface ProgressiveProfilingState {
  // Step tracking
  currentStep: ProfilingStep;
  completedSteps: ProfilingStep[];
  isRequired: boolean;
  
  // Phone verification
  phoneNumber: string;
  phoneVerified: boolean;
  phoneSending: boolean;
  phoneError: string | null;
  
  // OTP verification
  otpCode: string;
  otpVerifying: boolean;
  otpError: string | null;
  otpAttempts: number;
  maxOtpAttempts: number;
  otpSentAt: number | null;
  
  // Username
  username: string;
  usernameAvailable: boolean | null;
  usernameChecking: boolean;
  usernameError: string | null;
  
  // Sectors & Services
  selectedSectors: string[];
  selectedServices: { [sector: string]: string[] };
  sectorsLoading: boolean;
  sectorsError: string | null;
  
  // Overall state
  loading: boolean;
  error: string | null;
  profilingComplete: boolean;
}

const initialState: ProgressiveProfilingState = {
  currentStep: 'phone',
  completedSteps: [],
  isRequired: false,
  
  phoneNumber: '',
  phoneVerified: false,
  phoneSending: false,
  phoneError: null,
  
  otpCode: '',
  otpVerifying: false,
  otpError: null,
  otpAttempts: 0,
  maxOtpAttempts: 3,
  otpSentAt: null,
  
  username: '',
  usernameAvailable: null,
  usernameChecking: false,
  usernameError: null,
  
  selectedSectors: [],
  selectedServices: {},
  sectorsLoading: false,
  sectorsError: null,
  
  loading: false,
  error: null,
  profilingComplete: false,
};

// Async thunks
export const sendPhoneVerification = createAsyncThunk(
  'profiling/sendPhoneVerification',
  async (params: { phoneNumber: string }, { rejectWithValue }) => {
    try {
      const result = await VerificationService.sendOTP(params.phoneNumber);
      return { success: result.success, sentAt: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to send verification code');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'profiling/verifyOtp',
  async (params: { phoneNumber: string; otpCode: string }, { rejectWithValue }) => {
    try {
      const result = await VerificationService.verifyOTP(params.phoneNumber, params.otpCode);
      return { verified: result.verified };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to verify OTP');
    }
  }
);

export const checkUsernameAvailability = createAsyncThunk(
  'profiling/checkUsernameAvailability',
  async (params: { username: string }, { rejectWithValue }) => {
    try {
      const exists = await UserService.isUserNameExists(params.username);
      return { available: !exists };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to check username');
    }
  }
);

export const saveSectorSelection = createAsyncThunk(
  'profiling/saveSectorSelection',
  async (params: { userId: string; sectors: string[]; services: { [sector: string]: string[] } }, { rejectWithValue }) => {
    try {
      await UserService.saveSectorSelection(params.userId, params.sectors, params.services);
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to save sectors');
    }
  }
);

const progressiveProfilingSlice = createSlice({
  name: 'profiling',
  initialState,
  reducers: {
    // Step management
    setCurrentStep: (state, action: PayloadAction<ProfilingStep>) => {
      state.currentStep = action.payload;
    },
    
    markStepCompleted: (state, action: PayloadAction<ProfilingStep>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    
    setProfilingRequired: (state, action: PayloadAction<boolean>) => {
      state.isRequired = action.payload;
    },
    
    // Phone
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
      state.phoneError = null;
    },
    
    clearPhoneError: (state) => {
      state.phoneError = null;
    },
    
    // OTP
    setOtpCode: (state, action: PayloadAction<string>) => {
      state.otpCode = action.payload;
      state.otpError = null;
    },
    
    clearOtpError: (state) => {
      state.otpError = null;
    },
    
    resetOtp: (state) => {
      state.otpCode = '';
      state.otpError = null;
      state.otpAttempts = 0;
      state.otpVerifying = false;
    },
    
    // Username
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      state.usernameError = null;
      state.usernameAvailable = null;
    },
    
    clearUsernameError: (state) => {
      state.usernameError = null;
    },
    
    // Sectors
    toggleSector: (state, action: PayloadAction<string>) => {
      const sector = action.payload;
      const index = state.selectedSectors.indexOf(sector);
      
      if (index > -1) {
        state.selectedSectors.splice(index, 1);
        delete state.selectedServices[sector];
      } else {
        state.selectedSectors.push(sector);
        state.selectedServices[sector] = [];
      }
    },
    
    addServiceToSector: (state, action: PayloadAction<{ sector: string; service: string }>) => {
      const { sector, service } = action.payload;
      // Use existing array or create new
      const servicesArr = state.selectedServices[sector] || [];
      if (!servicesArr.includes(service)) {
        servicesArr.push(service);
        state.selectedServices[sector] = servicesArr;
      }
    },
    
    removeServiceFromSector: (state, action: PayloadAction<{ sector: string; service: string }>) => {
      const { sector, service } = action.payload;
      if (state.selectedServices[sector]) {
        const index = state.selectedServices[sector].indexOf(service);
        if (index > -1) {
          state.selectedServices[sector].splice(index, 1);
        }
      }
    },
    
    clearSectors: (state) => {
      state.selectedSectors = [];
      state.selectedServices = {};
    },
    
    // Overall
    resetProfiling: (state) => {
      Object.assign(state, initialState);
    },
    
    setProfilingComplete: (state, action: PayloadAction<boolean>) => {
      state.profilingComplete = action.payload;
    },
  },
  
  extraReducers: (builder) => {
        // Prefill user data when fetched by email
        builder.addCase(getUserProfileByEmail.fulfilled, (state, action) => {
          if (action.payload) {
            prefillUserProfile(state, action.payload);
          }
        });
    // Send Phone Verification
    builder
      .addCase(sendPhoneVerification.pending, (state) => {
        state.phoneSending = true;
        state.phoneError = null;
      })
      .addCase(sendPhoneVerification.fulfilled, (state, action) => {
        state.phoneSending = false;
        state.otpSentAt = action.payload.sentAt;
      })
      .addCase(sendPhoneVerification.rejected, (state, action) => {
        state.phoneSending = false;
        state.phoneError = action.payload as string;
      });
    
    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.otpVerifying = true;
        state.otpError = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.otpVerifying = false;
        state.phoneVerified = true;
        state.otpCode = '';
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpVerifying = false;
        state.otpError = action.payload as string;
        state.otpAttempts += 1;
      });
    
    // Check Username Availability
    builder
      .addCase(checkUsernameAvailability.pending, (state) => {
        state.usernameChecking = true;
        state.usernameError = null;
      })
      .addCase(checkUsernameAvailability.fulfilled, (state, action) => {
        state.usernameChecking = false;
        state.usernameAvailable = action.payload.available;
      })
      .addCase(checkUsernameAvailability.rejected, (state, action) => {
        state.usernameChecking = false;
        state.usernameError = action.payload as string;
      });
    
    // Save Sector Selection
    builder
      .addCase(saveSectorSelection.pending, (state) => {
        state.sectorsLoading = true;
        state.sectorsError = null;
      })
      .addCase(saveSectorSelection.fulfilled, (state) => {
        state.sectorsLoading = false;
        state.profilingComplete = true;
      })
      .addCase(saveSectorSelection.rejected, (state, action) => {
        state.sectorsLoading = false;
        state.sectorsError = action.payload as string;
      });
  },
});

export const {
  setCurrentStep,
  markStepCompleted,
  setProfilingRequired,
  setPhoneNumber,
  clearPhoneError,
  setOtpCode,
  clearOtpError,
  resetOtp,
  setUsername,
  clearUsernameError,
  toggleSector,
  addServiceToSector,
  removeServiceFromSector,
  clearSectors,
  resetProfiling,
  setProfilingComplete,
} = progressiveProfilingSlice.actions;

export default progressiveProfilingSlice.reducer;
