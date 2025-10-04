import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// Order status types matching your API
export type OrderStatus = 
  | 'order_received' 
  | 'order_status_update' 
  | 'order_cancelled' 
  | 'order_accepted' 
  | 'order_rejected';
// Notification interface - extended from NotificationPayload
export interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

export type NotificationPayload = {
  id?: string | number;
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

export type NotificationCallback = (payload: NotificationPayload) => void;

type NotificationError = {
  message: string;
  code?: string;
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL 

// Device registration types
export interface DeviceRegistration {
  userId: string;
  deviceToken: string;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
}

// Order types matching your API
export interface OrderItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerInfo {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface CreateOrderRequest {
  serviceProviderId: string;
  customer: CustomerInfo;
  items: OrderItem[];
}

// API notification payload types (matching your production system)
export interface ApiNotificationPayload {
  title: string;
  body: string;
  data: {
    type: OrderStatus;
    orderId: string;
    serviceProviderId?: string;
    customerId?: string;
    customerName?: string;
    totalAmount?: number;
    currency?: string;
    orderNumber?: string;
    actions?: Array<{
      id: string;
      title: string;
    }>;
  };
}

let lastToken: string | null = null;
let onInAppCallback: ((payload: NotificationPayload) => void) | undefined;

/**
 * Initialize push & local notifications.
 * - Requests permissions
 * - Registers push notifications
 * - Registers listeners for incoming notifications and actions
 *
 * Pass an optional callback that will be invoked when a notification is received
 * while the app is in the foreground (in-app notification UI can use this).
 */
export async function initNotificationService(
  inAppCallback?: NotificationCallback,
): Promise<{ success: boolean; error?: NotificationError }> {
  onInAppCallback = inAppCallback;

  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  if (!isNative) {
    console.log('[NotificationService] Running on web — skipping native registration.');
    return { success: true };
  }

  try {
    // Request push notification permissions
    const pushPermission = await PushNotifications.requestPermissions();
    if ((pushPermission as any).receive !== 'granted') {
      const error = {
        message: 'Push notification permission not granted',
        code: 'PERMISSION_DENIED'
      };
      console.warn('[NotificationService] Permission denied:', pushPermission);
      return { success: false, error };
    }

    // Request local notification permissions
    const localPermission = await LocalNotifications.requestPermissions();
    if (localPermission.display !== 'granted') {
      console.warn('[NotificationService] Local notification permission not granted:', localPermission);
    }

    // Register for push notifications
    await PushNotifications.register();

    // Set up listeners
    await setupNotificationListeners();

    console.log('[NotificationService] Successfully initialized');
    return { success: true };
  } catch (error) {
    const notificationError: NotificationError = {
      message: error instanceof Error ? error.message : 'Unknown initialization error',
      code: 'INIT_ERROR'
    };
    console.error('[NotificationService] Initialization failed:', error);
    return { success: false, error: notificationError };
  }
}

async function setupNotificationListeners(): Promise<void> {
  // Registration success
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('[NotificationService] Registration token received:', token.value);
    lastToken = token.value;
    window.dispatchEvent(new CustomEvent('push-token', { detail: token.value }));
  });

  // Registration error
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('[NotificationService] Registration failed:', error);
    window.dispatchEvent(new CustomEvent('push-registration-error', { detail: error }));
  });

  // Received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[NotificationService] Push notification received:', notification);
    handleIncoming(notification);
  });

  // User tapped on notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('[NotificationService] Push notification action performed:', action);
    handleAction(action);
  });
}

async function handleIncoming(notification: PushNotificationSchema): Promise<void> {
  try {
    const payload: NotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    // Handle API notification payloads (from your production system)
    const orderType = payload.data?.type as OrderStatus;
    if (orderType && ['order_received', 'order_status_update', 'order_cancelled', 'order_accepted', 'order_rejected'].includes(orderType)) {
      const orderId = payload.data?.orderId || payload.data?.orderNumber || 'Unknown';
      const customerName = payload.data?.customerName || 'Customer';
      const totalAmount = payload.data?.totalAmount;
      const currency = payload.data?.currency || 'USD';
      
      // Use API-provided title and body if available, otherwise generate defaults
      switch (orderType) {
        case 'order_received':
          payload.title = payload.title || '🎯 New Order Received!';
          payload.body = payload.body || (totalAmount 
            ? `Order #${orderId} from ${customerName} - ${currency} ${totalAmount}`
            : `Order #${orderId} from ${customerName} has been received.`);
          break;
        case 'order_accepted':
          payload.title = payload.title || '✅ Order Accepted';
          payload.body = payload.body || `Order #${orderId} has been accepted and will be processed.`;
          break;
        case 'order_rejected':
          payload.title = payload.title || '❌ Order Rejected';
          payload.body = payload.body || `Order #${orderId} has been rejected.`;
          break;
        case 'order_cancelled':
          payload.title = payload.title || '🚫 Order Cancelled';
          payload.body = payload.body || `Order #${orderId} has been cancelled.`;
          break;
        case 'order_status_update':
          payload.title = payload.title || '📋 Order Status Updated';
          payload.body = payload.body || `Order #${orderId} status has been updated.`;
          break;
      }
      
      // Log API notification details for debugging
      console.log('[NotificationService] API notification details:', {
        type: orderType,
        orderId,
        customerName,
        totalAmount,
        currency,
        actions: payload.data?.actions
      });
    }

    console.log('[NotificationService] Processing notification payload:', payload);

    // If an in-app callback is provided, call it for foreground display
    if (onInAppCallback) {
      try {
        onInAppCallback(payload);
        return;
      } catch (error) {
        console.error('[NotificationService] In-app callback error:', error);
        // Continue to fallback local notification
      }
    }

    // Fallback: show a local notification
    await showLocalNotification(
      payload.title || 'Notification',
      payload.body || 'You have a new notification',
      payload.data
    );
  } catch (error) {
    console.error('[NotificationService] Error handling incoming notification:', error);
  }
}

function handleAction(action: ActionPerformed): void {
  try {
    const notification = action.notification;
    const payload: NotificationPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    console.log('[NotificationService] Notification action performed:', {
      actionId: action.actionId,
      payload
    });

    // Emit event for the React app to handle navigation/state updates
    window.dispatchEvent(new CustomEvent('notification-action', {
      detail: {
        ...payload,
        actionId: action.actionId,
        inputValue: action.inputValue,
      }
    }));
  } catch (error) {
    console.error('[NotificationService] Error handling notification action:', error);
  }
}

/**
 * Schedule a local notification. Useful to show something when the app is backgrounded
 * or to convert a push into a local notification.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: NotificationError }> {
  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  if (!isNative) {
    // On web, emit a custom event for in-app toast
    window.dispatchEvent(new CustomEvent('local-notification', {
      detail: { title, body, data: data || {} }
    }));
    return { success: true };
  }

  try {
    const id = Date.now();
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 100) }, // Small delay to ensure proper scheduling
          extra: data || {},
          sound: 'default',
          attachments: [],
          actionTypeId: '',
          group: 'app-notifications',
        },
      ],
    });

    console.log('[NotificationService] Local notification scheduled:', { id, title, result });
    return { success: true };
  } catch (error) {
    const notificationError: NotificationError = {
      message: error instanceof Error ? error.message : 'Failed to schedule local notification',
      code: 'LOCAL_NOTIFICATION_ERROR'
    };
    console.error('[NotificationService] Local notification error:', error);
    return { success: false, error: notificationError };
  }
}

export function getLastPushToken() {
  return lastToken;
}

export async function unregister(): Promise<{ success: boolean; error?: NotificationError }> {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      console.log('[NotificationService] Web platform - no cleanup needed');
      return { success: true };
    }

    // Remove all listeners
    await PushNotifications.removeAllListeners();
    await LocalNotifications.removeAllListeners();

    // Cancel any pending local notifications
    await LocalNotifications.cancel({ notifications: [] });

    // Clear stored token
    lastToken = null;
    onInAppCallback = undefined;

    console.log('[NotificationService] Successfully unregistered');
    return { success: true };
  } catch (error) {
    const notificationError: NotificationError = {
      message: error instanceof Error ? error.message : 'Failed to unregister notifications',
      code: 'UNREGISTER_ERROR'
    };
    console.error('[NotificationService] Unregister error:', error);
    return { success: false, error: notificationError };
  }
}

// Simple helper for consumers to listen to in-app events without Hooks/Context
export function onNotificationAction(handler: (payload: NotificationPayload & { actionId?: string }) => void) {
  const listener = (ev: Event) => handler((ev as CustomEvent).detail);
  window.addEventListener('notification-action', listener as EventListener);
  return () => window.removeEventListener('notification-action', listener as EventListener);
}

// Helper to listen for push token updates
export function onPushToken(handler: (token: string) => void) {
  const listener = (ev: Event) => handler((ev as CustomEvent).detail);
  window.addEventListener('push-token', listener as EventListener);
  return () => window.removeEventListener('push-token', listener as EventListener);
}

// Order-specific notification helper
export async function showOrderNotification(
  orderId: string,
  orderStatus: OrderStatus,
  customerName?: string
): Promise<{ success: boolean; error?: NotificationError }> {
  let title: string;
  let body: string;
  
  const customer = customerName || 'Customer';
  
  // Generate appropriate title and body based on order status
  switch (orderStatus) {
    case 'order_received':
      title = 'New Order Received!';
      body = `Order #${orderId} from ${customer} has been received and is awaiting processing.`;
      break;
    case 'order_accepted':
      title = 'Order Accepted';
      body = `Order #${orderId} has been accepted and will be processed shortly.`;
      break;
    case 'order_rejected':
      title = 'Order Rejected';
      body = `Order #${orderId} has been rejected. Please check the details.`;
      break;
    case 'order_cancelled':
      title = 'Order Cancelled';
      body = `Order #${orderId} has been cancelled.`;
      break;
    case 'order_status_update':
      title = 'Order Status Updated';
      body = `Order #${orderId} status has been updated. Check for latest information.`;
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

// Check if notifications are supported and enabled
export async function checkNotificationStatus(): Promise<{
  supported: boolean;
  pushEnabled: boolean;
  localEnabled: boolean;
  token?: string;
}> {
  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';
  
  if (!isNative) {
    return {
      supported: true,
      pushEnabled: false,
      localEnabled: true, // Web can show in-app notifications
      token: undefined,
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
    console.error('[NotificationService] Status check error:', error);
    return {
      supported: false,
      pushEnabled: false,
      localEnabled: false,
      token: undefined,
    };
  }
}

// ============================================================================
// API INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get the auth token from your Auth context or local storage
 * This should be implemented to match your authentication system
 * 
 * Note: This is a placeholder - in practice, you should pass the token
 * from your React component where you have access to the Auth context
 */
async function getAuthToken(): Promise<string | null> {
  // This function is mainly for fallback - prefer passing token explicitly
  // from components that have access to the Auth context
  console.warn('[NotificationService] getAuthToken called - prefer passing token explicitly');
  return null;
}

/**
 * Register device with the push notification API
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

    // Use the last FCM token if no device token provided
    const finalDeviceToken = deviceToken || lastToken || `web_${Date.now()}`;
    
    const platform = Capacitor.getPlatform();
    const devicePlatform = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';

    const registrationData: DeviceRegistration = {
      userId,
      deviceToken: finalDeviceToken,
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

    console.log('[NotificationService] Device registered successfully');
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
    console.error('[NotificationService] Registration error:', error);
    return {
      success: false,
      error: { message: errorMessage, code: 'REGISTRATION_ERROR' }
    };
  }
}

/**
 * Create an order through the API (automatically triggers push notifications)
 */
export async function createOrder(
  orderData: CreateOrderRequest,
  authToken?: string
): Promise<{ success: boolean; orderId?: string; error?: NotificationError }> {
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
    console.log('[NotificationService] Order created successfully:', result);
    
    return { 
      success: true, 
      orderId: result.orderId || result.id 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown order creation error';
    console.error('[NotificationService] Order creation error:', error);
    return {
      success: false,
      error: { message: errorMessage, code: 'ORDER_CREATION_ERROR' }
    };
  }
}

/**
 * Fetch orders for a user (customer or service provider)
 */
export async function fetchOrders(
  userId: string,
  authToken?: string
): Promise<{ success: boolean; orders?: any[]; error?: NotificationError }> {
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
    console.log('[NotificationService] Orders fetched successfully:', orders);
    
    return { success: true, orders };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
    console.error('[NotificationService] Fetch orders error:', error);
    return {
      success: false,
      error: { message: errorMessage, code: 'FETCH_ORDERS_ERROR' }
    };
  }
}

/**
 * Test order creation with sample data
 */
export async function createTestOrder(
  serviceProviderId: string,
  authToken?: string
): Promise<{ success: boolean; orderId?: string; error?: NotificationError }> {
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
        description: "Test notification service delivery",
        quantity: 1,
        unitPrice: 25.00
      }
    ]
  };

  return await createOrder(testOrderData, authToken);
}

/**
 * Helper to create order with dynamic data
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
}): Promise<{ success: boolean; orderId?: string; error?: NotificationError }> {
  
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
