import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import notificationReducer from './slices/notificationSlice';
import orderReducer from './slices/orderSlice';
import currencyReducer from './slices/currencySlice';
import wishlistReducer from './slices/wishlistSlice';
import webSocketReducer from './slices/webSocketSlice';
import themeReducer from './slices/themeSlice';
import languageReducer from './slices/languageSlice';
import stepReducer from './slices/stepSlice';
import locationReducer from './slices/locationSlice';
import progressiveProfilingReducer from './slices/progressiveProfilingSlice';
import { userApi } from './api/userApi';
import { authMiddleware } from './middleware/authMiddleware';

// Persist configuration for auth slice
const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage,
};

// Persist configuration for theme slice
const themePersistConfig = {
  key: 'theme',
  version: 1,
  storage,
};

// Persist configuration for language slice
const languagePersistConfig = {
  key: 'language',
  version: 1,
  storage,
};

// Persist configuration for location slice
const locationPersistConfig = {
  key: 'location',
  version: 1,
  storage,
  // Only persist essential location data, not loading states
  whitelist: ['locationData', 'currentLocation', 'lastUpdated', 'permissionGranted']
};

// Persist configuration for orders slice
const orderPersistConfig = {
  key: 'orders',
  version: 1,
  storage,
};

// Persist configuration for progressive profiling slice
const profilingPersistConfig = {
  key: 'profiling',
  version: 1,
  storage,
  // Only persist completed steps and user selections
  whitelist: ['currentStep', 'completedSteps', 'phoneNumber', 'username', 'selectedSectors', 'selectedServices', 'profilingComplete']
};

// Root reducer with all slices
const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  cart: cartReducer, // Already has persist config in the slice
  notifications: notificationReducer,
  orders: persistReducer(orderPersistConfig, orderReducer),
  currency: currencyReducer, // Already has persist config in the slice
  wishlist: wishlistReducer, // Already has persist config in the slice
  websocket: webSocketReducer,
  theme: persistReducer(themePersistConfig, themeReducer),
  language: persistReducer(languagePersistConfig, languageReducer),
  location: persistReducer(locationPersistConfig, locationReducer),
  step: stepReducer,
  profiling: persistReducer(profilingPersistConfig, progressiveProfilingReducer),
  [userApi.reducerPath]: userApi.reducer,
};

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore date serialization warnings since we're converting to ISO strings
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['auth.user.lastLogin', 'notifications.notifications.timestamp', 'orders.orders.asCustomer.timestamp', 'orders.orders.asServiceProvider.timestamp', 'websocket.messages.timestamp', 'wishlist.items.createdAt', 'location.lastUpdated'],
      },
    })
      .concat(userApi.middleware)
      .concat(authMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Configure persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;