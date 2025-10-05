import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// Minimal notification types
export interface SafeNotificationPayload {
  id?: string | number;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export type SafeNotificationCallback = (payload: SafeNotificationPayload) => void;

let lastToken: string | null = null;
let onInAppCallback: SafeNotificationCallback | undefined;
let isInitialized = false;

/**
 * Safe notification service initialization
 * This version initializes step by step with extensive error handling
 */
export async function initSafeNotificationService(
  inAppCallback?: SafeNotificationCallback,
): Promise<{ success: boolean; error?: string }> {
  
  if (isInitialized) {
    console.log('[SafeNotificationService] Already initialized');
    return { success: true };
  }

  onInAppCallback = inAppCallback;
  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  console.log('[SafeNotificationService] Initializing on platform:', platform);

  if (!isNative) {
    console.log('[SafeNotificationService] Web platform - skipping native setup');
    isInitialized = true;
    return { success: true };
  }

  try {
    // Step 1: Check if push notifications are available
    console.log('[SafeNotificationService] Step 1: Checking push notification availability');
    
    // Step 2: Request permissions safely
    console.log('[SafeNotificationService] Step 2: Requesting push permissions');
    const pushPermission = await PushNotifications.requestPermissions();
    console.log('[SafeNotificationService] Push permission result:', pushPermission);

    // Continue even if push permissions are denied
    if ((pushPermission as any).receive === 'granted') {
      console.log('[SafeNotificationService] Push notifications granted');
      
      // Step 3: Register for push notifications (with error handling)
      try {
        console.log('[SafeNotificationService] Step 3: Registering for push notifications');
        await PushNotifications.register();
        console.log('[SafeNotificationService] Push registration successful');
      } catch (error) {
        console.warn('[SafeNotificationService] Push registration failed:', error);
        // Continue without push notifications
      }
    } else {
      console.log('[SafeNotificationService] Push notifications not granted, continuing without them');
    }

    // Step 4: Request local notification permissions safely
    console.log('[SafeNotificationService] Step 4: Requesting local notification permissions');
    try {
      const localPermission = await LocalNotifications.requestPermissions();
      console.log('[SafeNotificationService] Local permission result:', localPermission);
    } catch (error) {
      console.warn('[SafeNotificationService] Local notification permission request failed:', error);
      // Continue without local notifications
    }

    // Step 5: Set up minimal listeners with error handling
    console.log('[SafeNotificationService] Step 5: Setting up listeners');
    await setupSafeListeners();

    isInitialized = true;
    console.log('[SafeNotificationService] Successfully initialized');
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    console.error('[SafeNotificationService] Initialization failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Safe listener setup with individual error handling
 */
async function setupSafeListeners(): Promise<void> {
  try {
    // Registration listener
    PushNotifications.addListener('registration', (token: any) => {
      try {
        console.log('[SafeNotificationService] Registration token received:', token.value);
        lastToken = token.value;
      } catch (error) {
        console.error('[SafeNotificationService] Token handling error:', error);
      }
    });

    // Registration error listener
    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('[SafeNotificationService] Registration error:', error);
    });

    // Notification received listener
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      try {
        console.log('[SafeNotificationService] Push notification received:', notification);
        handleSafeIncoming(notification);
      } catch (error) {
        console.error('[SafeNotificationService] Error handling incoming notification:', error);
      }
    });

    // Notification action listener
    PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      try {
        console.log('[SafeNotificationService] Notification action performed:', action);
        handleSafeAction(action);
      } catch (error) {
        console.error('[SafeNotificationService] Error handling notification action:', error);
      }
    });

    console.log('[SafeNotificationService] Listeners set up successfully');
  } catch (error) {
    console.error('[SafeNotificationService] Listener setup failed:', error);
    // Don't throw - continue without listeners
  }
}

/**
 * Safe incoming notification handler
 */
function handleSafeIncoming(notification: PushNotificationSchema): void {
  try {
    const payload: SafeNotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    console.log('[SafeNotificationService] Processing notification payload:', payload);

    // Call the in-app callback if provided
    if (onInAppCallback) {
      try {
        onInAppCallback(payload);
      } catch (error) {
        console.error('[SafeNotificationService] In-app callback error:', error);
      }
    }
  } catch (error) {
    console.error('[SafeNotificationService] Error handling incoming notification:', error);
  }
}

/**
 * Safe action handler
 */
function handleSafeAction(action: any): void {
  try {
    const notification = action.notification;
    const payload: SafeNotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    console.log('[SafeNotificationService] Notification action performed:', {
      actionId: action.actionId,
      payload
    });

    // Handle action (could extend this later)
    if (onInAppCallback) {
      try {
        onInAppCallback(payload);
      } catch (error) {
        console.error('[SafeNotificationService] Action callback error:', error);
      }
    }
  } catch (error) {
    console.error('[SafeNotificationService] Error handling notification action:', error);
  }
}

/**
 * Safe local notification display (simplified)
 */
export async function showSafeLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  if (!isNative) {
    // On web, emit a custom event for in-app toast
    try {
      window.dispatchEvent(new CustomEvent('local-notification', {
        detail: { title, body, data: data || {} }
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Web notification dispatch failed' };
    }
  }

  try {
    // Use a simple counter for ID instead of Date.now()
    const id = Math.floor(Math.random() * 1000000);  // Simple 6-digit ID
    
    console.log('[SafeNotificationService] Scheduling local notification with ID:', id);
    
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 100) },
          extra: data || {},
          sound: 'default'
        },
      ],
    });

    console.log('[SafeNotificationService] Local notification scheduled successfully:', result);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Local notification failed';
    console.error('[SafeNotificationService] Local notification error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get the last received push token
 */
export function getSafePushToken(): string | null {
  return lastToken;
}

/**
 * Check if the service is initialized
 */
export function isSafeNotificationServiceInitialized(): boolean {
  return isInitialized;
}

/**
 * Safe cleanup
 */
export async function cleanupSafeNotificationService(): Promise<void> {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      console.log('[SafeNotificationService] Web platform - no cleanup needed');
      return;
    }

    console.log('[SafeNotificationService] Cleaning up...');
    await PushNotifications.removeAllListeners();
    await LocalNotifications.removeAllListeners();
    
    isInitialized = false;
    lastToken = null;
    onInAppCallback = undefined;
    
    console.log('[SafeNotificationService] Successfully cleaned up');
  } catch (error) {
    console.error('[SafeNotificationService] Cleanup error:', error);
  }
}