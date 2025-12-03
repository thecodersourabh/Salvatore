import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import { userApi } from './api/userApi';
import { authMiddleware } from './middleware/authMiddleware';

// Persist configuration for auth slice only
const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage,
};

// Root reducer
const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  [userApi.reducerPath]: userApi.reducer,
};

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
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