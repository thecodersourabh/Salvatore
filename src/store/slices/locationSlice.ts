import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationService, LocationData, LocationCoordinates } from '../../services/locationService';

interface LocationState {
  currentLocation: LocationCoordinates | null;
  locationData: LocationData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  permissionGranted: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  locationData: null,
  loading: false,
  error: null,
  lastUpdated: null,
  permissionGranted: false,
};

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

// Async thunk for getting current location with address
export const getCurrentLocationWithAddress = createAsyncThunk(
  'location/getCurrentLocationWithAddress',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { location: LocationState };
      const now = Date.now();
      
      // Check if we have cached data that's still valid
      if (
        state.location.locationData &&
        state.location.lastUpdated &&
        (now - state.location.lastUpdated) < CACHE_DURATION
      ) {
        return state.location.locationData;
      }

      // Check permissions first
      const permissions = await LocationService.checkPermissions();
      if (!permissions.granted) {
        const requestResult = await LocationService.requestPermissions();
        if (!requestResult.granted) {
          throw new Error('Location permission denied');
        }
      }

      // Get location with address
      const locationData = await LocationService.getCurrentLocationWithAddress();
      return locationData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get location');
    }
  }
);

// Async thunk for getting just coordinates
export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { location: LocationState };
      const now = Date.now();
      
      // Check if we have cached coordinates that are still valid
      if (
        state.location.currentLocation &&
        state.location.lastUpdated &&
        (now - state.location.lastUpdated) < CACHE_DURATION
      ) {
        return state.location.currentLocation;
      }

      // Check permissions first
      const permissions = await LocationService.checkPermissions();
      if (!permissions.granted) {
        const requestResult = await LocationService.requestPermissions();
        if (!requestResult.granted) {
          throw new Error('Location permission denied');
        }
      }

      // Get current location
      const coordinates = await LocationService.getCurrentLocation();
      return coordinates;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get location');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearLocation: (state) => {
      state.currentLocation = null;
      state.locationData = null;
      state.error = null;
      state.lastUpdated = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
    // Manual location update (for testing or fallback)
    setLocationData: (state, action: PayloadAction<LocationData>) => {
      state.locationData = action.payload;
      state.currentLocation = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        accuracy: action.payload.accuracy,
      };
      state.lastUpdated = Date.now();
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // getCurrentLocationWithAddress cases
      .addCase(getCurrentLocationWithAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentLocationWithAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.locationData = action.payload;
        state.currentLocation = {
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
          accuracy: action.payload.accuracy,
        };
        state.lastUpdated = Date.now();
        state.permissionGranted = true;
      })
      .addCase(getCurrentLocationWithAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Don't set fallback location, let user see the actual error
      })
      // getCurrentLocation cases
      .addCase(getCurrentLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLocation = action.payload;
        state.lastUpdated = Date.now();
        state.permissionGranted = true;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Don't set fallback location, let user see the actual error
      });
  },
});

export const { 
  clearLocation, 
  clearError, 
  setPermissionGranted, 
  setLocationData 
} = locationSlice.actions;

export default locationSlice.reducer;

// Selectors
export const selectLocationData = (state: { location: LocationState }) => state.location.locationData;
export const selectCurrentLocation = (state: { location: LocationState }) => state.location.currentLocation;
export const selectLocationLoading = (state: { location: LocationState }) => state.location.loading;
export const selectLocationError = (state: { location: LocationState }) => state.location.error;
export const selectLocationCity = (state: { location: LocationState }) => 
  state.location.locationData?.address?.city || (state.location.error ? 'Location Error' : 'Getting location...');
export const selectPermissionGranted = (state: { location: LocationState }) => state.location.permissionGranted;
export const selectLocationCached = (state: { location: LocationState }) => {
  const now = Date.now();
  return state.location.lastUpdated && (now - state.location.lastUpdated) < CACHE_DURATION;
};