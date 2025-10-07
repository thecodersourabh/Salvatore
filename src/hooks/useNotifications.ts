// React Hook for Push Notifications
// This hook provides an easy way to integrate push notifications in React components

import { useState, useEffect, useCallback } from 'react';
import { 
  initNotificationService,
  registerForWebPushNotifications,
  testNotificationFunctionality,
  enableNotificationsManually,
  areNotificationsEnabled,
  onPushToken,
  onNotificationAction,
  type NotificationError 
} from '../services/notificationService';

export interface NotificationHookState {
  isInitialized: boolean;
  isEnabled: boolean;
  token: string | null;
  isLoading: boolean;
  error: NotificationError | null;
}

export interface NotificationHookActions {
  initializeNotifications: () => Promise<boolean>;
  registerForPush: (userId: string, authToken?: string) => Promise<boolean>;
  enableManually: () => Promise<boolean>;
  testNotifications: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom React hook for managing push notifications
 * 
 * Usage:
 * ```tsx
 * const { state, actions } = useNotifications();
 * 
 * // Initialize notifications when component mounts
 * useEffect(() => {
 *   actions.initializeNotifications();
 * }, []);
 * 
 * // Register for push notifications
 * const handleRegister = async () => {
 *   const success = await actions.registerForPush(userId, authToken);
 *   if (success) {
 *     console.log('Registered successfully!');
 *   }
 * };
 * ```
 */
export function useNotifications(): {
  state: NotificationHookState;
  actions: NotificationHookActions;
} {
  const [state, setState] = useState<NotificationHookState>({
    isInitialized: false,
    isEnabled: false,
    token: null,
    isLoading: false,
    error: null
  });

  // Initialize notifications
  const initializeNotifications = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await initNotificationService();
      
      if (result.success) {
        const enabled = await areNotificationsEnabled();
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isEnabled: enabled,
          isLoading: false
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isInitialized: false,
          isLoading: false,
          error: result.error || { message: 'Unknown initialization error', code: 'INIT_ERROR' }
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isLoading: false,
        error: {
          message: error instanceof Error ? error.message : 'Initialization failed',
          code: 'INIT_EXCEPTION'
        }
      }));
      return false;
    }
  }, []);

  // Register for push notifications
  const registerForPush = useCallback(async (userId: string, authToken?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use the appropriate registration method based on platform
      const result = await registerForWebPushNotifications(userId, authToken);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          token: result.token || null,
          isLoading: false
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || { message: 'Registration failed', code: 'REG_ERROR' }
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          message: error instanceof Error ? error.message : 'Registration failed',
          code: 'REG_EXCEPTION'
        }
      }));
      return false;
    }
  }, []);

  // Enable notifications manually
  const enableManually = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await enableNotificationsManually();
      
      setState(prev => ({
        ...prev,
        isEnabled: result.success,
        isLoading: false,
        error: result.success ? null : {
          message: result.error || 'Failed to enable notifications',
          code: 'ENABLE_ERROR'
        }
      }));

      return result.success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          message: error instanceof Error ? error.message : 'Enable failed',
          code: 'ENABLE_EXCEPTION'
        }
      }));
      return false;
    }
  }, []);

  // Test notifications
  const testNotifications = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await testNotificationFunctionality();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.success ? null : {
          message: result.error || 'Test failed',
          code: 'TEST_ERROR'
        }
      }));

      return result.success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          message: error instanceof Error ? error.message : 'Test failed',
          code: 'TEST_EXCEPTION'
        }
      }));
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Listen for push token updates
    const unsubscribeToken = onPushToken((token: string) => {
      setState(prev => ({ ...prev, token }));
    });

    // Listen for notification actions
    const unsubscribeAction = onNotificationAction((payload) => {
      console.log('[useNotifications] Notification action received:', payload);
      // You can emit custom events here for components to handle
      window.dispatchEvent(new CustomEvent('notification-received', { detail: payload }));
    });

    return () => {
      unsubscribeToken();
      unsubscribeAction();
    };
  }, []);

  return {
    state,
    actions: {
      initializeNotifications,
      registerForPush,
      enableManually,
      testNotifications,
      clearError
    }
  };
}

// Export types for external use
export type { NotificationError };