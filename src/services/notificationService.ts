import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';

// Import all notification types
import type {
  OrderStatus,
  Notification,
  NotificationPayload,
  NotificationCallback,
  NotificationError,
  DeviceRegistration,
  OrderItem,
  CustomerInfo,
  CreateOrderRequest,
  NotificationStatus,
  PermissionResult,
  TestNotificationResult,
  OrderResult,
  OrdersResult,
  WebPushResult
} from '../types/notification';

// Re-export types for backward compatibility
export type {
  OrderStatus,
  Notification,
  NotificationPayload,
  NotificationCallback,
  NotificationError,
  DeviceRegistration,
  OrderItem,
  CustomerInfo,
  CreateOrderRequest,
  NotificationStatus,
  PermissionResult,
  TestNotificationResult,
  OrderResult,
  OrdersResult,
  WebPushResult
};


const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.salvatore.app';

let lastToken: string | null = null;
let onInAppCallback: ((payload: NotificationPayload) => void) | undefined;

/**
 * Initialize web notifications (browser platform)
 */
async function initializeWebNotifications(): Promise<void> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  console.log('[NotificationService] Initializing web notifications...');

  // Check and request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  // Generate web token
  const webToken = `web_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  lastToken = webToken;
  
  console.log('[NotificationService] Web notifications initialized, permission:', permission);
  window.dispatchEvent(new CustomEvent('push-token', { detail: webToken }));
}

/**
 * Initialize push & local notifications
 */
export async function initNotificationService(
  inAppCallback?: NotificationCallback,
): Promise<{ success: boolean; error?: NotificationError }> {
  onInAppCallback = inAppCallback;

  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  if (!isNative) {
    try {
      await initializeWebNotifications();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Web notification initialization failed',
          code: 'WEB_INIT_ERROR'
        }
      };
    }
  }

  // Native platform initialization
  try {
    // Request local notification permissions
    const localPermission = await LocalNotifications.requestPermissions();
    if ((localPermission as any).display !== 'granted') {
      console.warn('[NotificationService] Local notification permission not granted');
    }

    // Try push notifications
    try {
      const pushStatus = await PushNotifications.checkPermissions();
      if ((pushStatus as any).receive === 'granted' || (pushStatus as any).receive === 'prompt') {
        if ((pushStatus as any).receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }
        await PushNotifications.register();
      }
    } catch (pushError) {
      console.warn('[NotificationService] Push notification setup failed:', pushError);
    }

    // Set up listeners
    await setupNotificationListeners();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Initialization failed',
        code: 'INIT_ERROR'
      }
    };
  }
}

/**
 * Set up notification event listeners
 */
async function setupNotificationListeners(): Promise<void> {
  try {
    // Push notification listeners
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[NotificationService] Token received:', token.value);
      lastToken = token.value;
      window.dispatchEvent(new CustomEvent('push-token', { detail: token.value }));
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[NotificationService] Registration failed:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      handleIncoming(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      handleAction(action);
    });

    // Local notification listeners (native platforms)
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationReceived', (notification: LocalNotificationSchema) => {
        const payload: NotificationPayload = {
          id: notification.id?.toString() || '',
          title: notification.title,
          body: notification.body,
          data: notification.extra || {},
        };
        window.dispatchEvent(new CustomEvent('localNotification', { detail: payload }));
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
        const payload: NotificationPayload = {
          id: action.notification.id?.toString() || '',
          title: action.notification.title,
          body: action.notification.body,
          data: action.notification.extra || {},
        };
        window.dispatchEvent(new CustomEvent('localNotificationAction', { 
          detail: { notification: payload, actionId: action.actionId } 
        }));
      });
    }
  } catch (error) {
    console.error('[NotificationService] Error setting up listeners:', error);
  }
}

// ============================================================================
// NOTIFICATION HANDLING
// ============================================================================

/**
 * Handle incoming notifications
 */
async function handleIncoming(notification: PushNotificationSchema): Promise<void> {
  try {
    const payload: NotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    // Enhance order notifications
    const orderType = payload.data?.type as OrderStatus;
    if (orderType && ['order_received', 'order_status_update', 'order_cancelled', 'order_accepted', 'order_rejected'].includes(orderType)) {
      const orderId = payload.data?.orderId || 'Unknown';
      const customerName = payload.data?.customerName || 'Customer';
      
      switch (orderType) {
        case 'order_received':
          payload.title = payload.title || '🎯 New Order Received!';
          payload.body = payload.body || `Order #${orderId} from ${customerName}`;
          break;
        case 'order_accepted':
          payload.title = payload.title || '✅ Order Accepted';
          payload.body = payload.body || `Order #${orderId} has been accepted`;
          break;
        case 'order_rejected':
          payload.title = payload.title || '❌ Order Rejected';
          payload.body = payload.body || `Order #${orderId} has been rejected`;
          break;
        case 'order_cancelled':
          payload.title = payload.title || '🚫 Order Cancelled';
          payload.body = payload.body || `Order #${orderId} has been cancelled`;
          break;
        case 'order_status_update':
          payload.title = payload.title || '📋 Order Status Updated';
          payload.body = payload.body || `Order #${orderId} status updated`;
          break;
      }
    }

    // Dispatch event for UI components
    window.dispatchEvent(new CustomEvent('local-notification', {
      detail: {
        title: payload.title || 'Notification',
        body: payload.body || 'You have a new notification',
        data: { ...payload.data, source: 'capacitor-push' }
      }
    }));

    // Call in-app callback if provided
    if (onInAppCallback) {
      onInAppCallback(payload);
    }

    // Show local notification on mobile
    if (Capacitor.getPlatform() !== 'web') {
      await showLocalNotification(
        payload.title || 'Notification',
        payload.body || 'You have a new notification',
        payload.data
      );
    }
  } catch (error) {
    console.error('[NotificationService] Error handling notification:', error);
  }
}

/**
 * Handle notification actions (when user taps notification)
 */
function handleAction(action: ActionPerformed): void {
  try {
    const notification = action.notification;
    const payload: NotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    window.dispatchEvent(new CustomEvent('notification-action', {
      detail: {
        ...payload,
        actionId: action.actionId,
        inputValue: action.inputValue,
      }
    }));
  } catch (error) {
    console.error('[NotificationService] Error handling action:', error);
  }
}

// ============================================================================
// NOTIFICATION DISPLAY
// ============================================================================

/**
 * Show a local notification
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: NotificationError }> {
  const platform = Capacitor.getPlatform();
  
  // Always dispatch event for UI
  window.dispatchEvent(new CustomEvent('local-notification', {
    detail: { title, body, data: data || {} }
  }));

  // For web, event is enough
  if (platform === 'web') {
    return { success: true };
  }

  // For mobile, schedule actual notification
  try {
    const id = Math.floor(Math.random() * 2147483647);
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 100) },
          extra: data || {},
          sound: 'default',
          group: 'app-notifications',
        },
      ],
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to schedule notification',
        code: 'LOCAL_NOTIFICATION_ERROR'
      }
    };
  }
}

/**
 * Show order-specific notification
 */
export async function showOrderNotification(
  orderId: string,
  orderStatus: OrderStatus,
  customerName?: string
): Promise<{ success: boolean; error?: NotificationError }> {
  let title: string;
  let body: string;
  
  const customer = customerName || 'Customer';
  
  switch (orderStatus) {
    case 'order_received':
      title = 'New Order Received!';
      body = `Order #${orderId} from ${customer} has been received.`;
      break;
    case 'order_accepted':
      title = 'Order Accepted';
      body = `Order #${orderId} has been accepted.`;
      break;
    case 'order_rejected':
      title = 'Order Rejected';
      body = `Order #${orderId} has been rejected.`;
      break;
    case 'order_cancelled':
      title = 'Order Cancelled';
      body = `Order #${orderId} has been cancelled.`;
      break;
    case 'order_status_update':
      title = 'Order Status Updated';
      body = `Order #${orderId} status has been updated.`;
      break;
    default:
      title = 'Order Notification';
      body = `Order #${orderId} - Status: ${orderStatus}`;
  }
  
  return await showLocalNotification(title, body, {
    type: orderStatus,
    orderId,
    orderStatus,
    customerName,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the last received push token
 */
export function getLastPushToken(): string | null {
  return lastToken;
}

/**
 * Check notification status
 */
export async function checkNotificationStatus(): Promise<NotificationStatus> {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'web') {
    return {
      supported: 'Notification' in window,
      pushEnabled: false,
      localEnabled: Notification.permission === 'granted',
      token: lastToken || undefined,
    };
  }

  try {
    const pushStatus = await PushNotifications.checkPermissions();
    const localStatus = await LocalNotifications.checkPermissions();
    
    return {
      supported: true,
      pushEnabled: (pushStatus as any).receive === 'granted',
      localEnabled: (localStatus as any).display === 'granted',
      token: lastToken || undefined,
    };
  } catch (error) {
    return {
      supported: false,
      pushEnabled: false,
      localEnabled: false,
    };
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return Notification.permission === 'granted';
    }
    
    const permission = await LocalNotifications.checkPermissions();
    return (permission as any).display === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Enable notifications manually
 */
export async function enableNotificationsManually(): Promise<PermissionResult> {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      if (!('Notification' in window)) {
        return {
          success: false,
          alreadyEnabled: false,
          permissionGranted: false,
          error: 'Browser does not support notifications'
        };
      }

      const currentPermission = Notification.permission;
      
      if (currentPermission === 'granted') {
        await showLocalNotification('✅ Notifications Enabled', 'Notifications are working!');
        return { success: true, alreadyEnabled: true, permissionGranted: true };
      }
      
      if (currentPermission === 'denied') {
        return {
          success: false,
          alreadyEnabled: false,
          permissionGranted: false,
          error: 'Notifications blocked. Please enable in browser settings.'
        };
      }
      
      const newPermission = await Notification.requestPermission();
      if (newPermission === 'granted') {
        await showLocalNotification('🎉 Notifications Enabled!', 'You will now receive notifications.');
        return { success: true, alreadyEnabled: false, permissionGranted: true };
      }
      
      return {
        success: false,
        alreadyEnabled: false,
        permissionGranted: false,
        error: 'Permission denied'
      };
    }

    // Mobile platform
    const currentPermission = await LocalNotifications.checkPermissions();
    
    if ((currentPermission as any).display === 'granted') {
      await showLocalNotification('✅ Notifications Enabled', 'Notifications are working!');
      return { success: true, alreadyEnabled: true, permissionGranted: true };
    }

    const permissionResult = await LocalNotifications.requestPermissions();
    
    if ((permissionResult as any).display === 'granted') {
      await showLocalNotification('🎉 Notifications Enabled!', 'You will now receive notifications.');
      return { success: true, alreadyEnabled: false, permissionGranted: true };
    }

    return {
      success: false,
      alreadyEnabled: false,
      permissionGranted: false,
      error: 'Permission denied'
    };

  } catch (error) {
    return {
      success: false,
      alreadyEnabled: false,
      permissionGranted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test notification functionality
 */
export async function testNotificationFunctionality(): Promise<TestNotificationResult> {
  try {
    const hasPermission = await areNotificationsEnabled();
    
    if (!hasPermission) {
      return {
        success: false,
        permissionGranted: false,
        notificationSent: false,
        error: 'Notifications not enabled'
      };
    }

    const result = await showLocalNotification(
      '🔔 Test Notification',
      'This is a test to verify notifications are working.',
      { type: 'test', testId: `test_${Date.now()}` }
    );

    return {
      success: result.success,
      permissionGranted: true,
      notificationSent: result.success,
      error: result.error?.message
    };

  } catch (error) {
    return {
      success: false,
      permissionGranted: false,
      notificationSent: false,
      error: error instanceof Error ? error.message : 'Test failed'
    };
  }
}

/**
 * Cleanup and unregister
 */
export async function unregister(): Promise<{ success: boolean; error?: NotificationError }> {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform !== 'web') {
      await PushNotifications.removeAllListeners();
      await LocalNotifications.removeAllListeners();
      await LocalNotifications.cancel({ notifications: [] });
    }

    lastToken = null;
    onInAppCallback = undefined;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unregister failed',
        code: 'UNREGISTER_ERROR'
      }
    };
  }
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Listen for notification actions
 */
export function onNotificationAction(handler: (payload: NotificationPayload & { actionId?: string }) => void) {
  const listener = (ev: Event) => handler((ev as CustomEvent).detail);
  window.addEventListener('notification-action', listener as EventListener);
  return () => window.removeEventListener('notification-action', listener as EventListener);
}

/**
 * Listen for push token updates
 */
export function onPushToken(handler: (token: string) => void) {
  const listener = (ev: Event) => handler((ev as CustomEvent).detail);
  window.addEventListener('push-token', listener as EventListener);
  return () => window.removeEventListener('push-token', listener as EventListener);
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Get auth token (helper)
 */
async function getAuthToken(): Promise<string | null> {
  console.warn('[NotificationService] getAuthToken called - prefer passing token explicitly');
  return null;
}

/**
 * Register device with API
 */
export async function registerDevice(
  userId: string,
  deviceToken?: string,
  authToken?: string
): Promise<{ success: boolean; error?: NotificationError }> {
  try {
    const token = authToken || await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
      };
    }

    const platform = Capacitor.getPlatform();
    const devicePlatform = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';
    
    const finalDeviceToken = deviceToken || lastToken || `${platform}_${Date.now()}`;

    const registrationData = {
      userId,
      token: finalDeviceToken,
      platform: devicePlatform,
      appVersion: '1.0.0'
    };

    const response = await fetch(`${API_BASE_URL}/api/push/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        error: { 
          message: `Registration failed: ${response.status} - ${errorData}`,
          code: 'REGISTRATION_FAILED'
        }
      };
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: { 
        message: error instanceof Error ? error.message : 'Registration error',
        code: 'REGISTRATION_ERROR'
      }
    };
  }
}

/**
 * Register for web push notifications
 */
export async function registerForWebPushNotifications(
  userId: string,
  authToken?: string
): Promise<WebPushResult> {
  const platform = Capacitor.getPlatform();
  
  if (platform !== 'web') {
    return {
      success: false,
      error: {
        message: 'This function is only for web platform. Use registerDevice() for mobile.',
        code: 'WRONG_PLATFORM'
      }
    };
  }

  try {
    // Initialize if needed
    if (!lastToken) {
      await initializeWebNotifications();
    }

    // Register with backend
    const result = await registerDevice(userId, lastToken || undefined, authToken);
    
    return {
      success: result.success,
      token: lastToken || undefined,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Web registration failed',
        code: 'WEB_REGISTRATION_ERROR'
      }
    };
  }
}

/**
 * Create order via API
 */
export async function createOrder(
  orderData: CreateOrderRequest,
  authToken?: string
): Promise<OrderResult> {
  try {
    const token = authToken || await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        error: { 
          message: `Order creation failed: ${response.status} - ${errorData}`,
          code: 'ORDER_CREATION_FAILED'
        }
      };
    }

    const result = await response.json();
    return { 
      success: true, 
      orderId: result.orderId || result.id 
    };

  } catch (error) {
    return {
      success: false,
      error: { 
        message: error instanceof Error ? error.message : 'Order creation error',
        code: 'ORDER_CREATION_ERROR'
      }
    };
  }
}

/**
 * Fetch orders from API
 */
export async function fetchOrders(
  userId: string,
  authToken?: string
): Promise<OrdersResult> {
  try {
    const token = authToken || await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/orders?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        error: { 
          message: `Fetch orders failed: ${response.status} - ${errorData}`,
          code: 'FETCH_ORDERS_FAILED'
        }
      };
    }

    const orders = await response.json();
    return { success: true, orders };

  } catch (error) {
    return {
      success: false,
      error: { 
        message: error instanceof Error ? error.message : 'Fetch error',
        code: 'FETCH_ORDERS_ERROR'
      }
    };
  }
}

/**
 * Create test order
 */
export async function createTestOrder(
  serviceProviderId: string,
  authToken?: string
): Promise<OrderResult> {
  const testOrderData: CreateOrderRequest = {
    serviceProviderId,
    customer: {
      contactInfo: {
        name: "Test Customer",
        email: "test.customer@example.com",
        phone: "+1-555-123-4567"
      },
      address: {
        street: "123 Test Street",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        country: "USA"
      }
    },
    items: [
      {
        name: "Test Service",
        description: "Test notification service",
        quantity: 1,
        unitPrice: 25.00
      }
    ]
  };

  return await createOrder(testOrderData, authToken);
}

/**
 * Create order with custom data
 */
export async function createOrderWithData({
  serviceProviderId,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  serviceDescription,
  price,
  authToken
}: {
  serviceProviderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  serviceDescription: string;
  price: number;
  authToken?: string;
}): Promise<OrderResult> {
  
  const orderData: CreateOrderRequest = {
    serviceProviderId,
    customer: {
      contactInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      address: {
        street: "123 Service Street",
        city: "Service City", 
        state: "SC",
        zipCode: "12345",
        country: "USA"
      }
    },
    items: [
      {
        name: serviceName,
        description: serviceDescription,
        quantity: 1,
        unitPrice: price
      }
    ]
  };

  return await createOrder(orderData, authToken);
}