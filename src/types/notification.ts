
// Order status types matching your API
export type OrderStatus = 
  | 'order_received' 
  | 'order_status_update' 
  | 'order_cancelled' 
  | 'order_accepted' 
  | 'order_rejected';

// Notification interface
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

// Notification payload for handling incoming notifications
export type NotificationPayload = {
  id?: string | number;
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

// Callback function type for handling notifications
export type NotificationCallback = (payload: NotificationPayload) => void;

// Error type for notification operations
export type NotificationError = {
  message: string;
  code?: string;
};

// ============================================================================
// API TYPES
// ============================================================================

// Device registration payload for push notification API
export interface DeviceRegistration {
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
}

// Order item structure
export interface OrderItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Customer information structure
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

// Order creation request payload
export interface CreateOrderRequest {
  serviceProviderId: string;
  customer: CustomerInfo;
  items: OrderItem[];
}

// ============================================================================
// RESULT TYPES
// ============================================================================

// Standard success/error result pattern used throughout the notification service
export interface NotificationResult<T = void> {
  success: boolean;
  error?: NotificationError;
  data?: T;
}

// Notification status information
export interface NotificationStatus {
  supported: boolean;
  pushEnabled: boolean;
  localEnabled: boolean;
  token?: string;
}

// Permission management result
export interface PermissionResult {
  success: boolean;
  alreadyEnabled: boolean;
  permissionGranted: boolean;
  error?: string;
}

// Test notification result
export interface TestNotificationResult {
  success: boolean;
  permissionGranted: boolean;
  notificationSent: boolean;
  error?: string;
}

// Order creation result
export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: NotificationError;
}

// Orders fetch result
export interface OrdersResult {
  success: boolean;
  orders?: any[];
  error?: NotificationError;
}

// Web push registration result
export interface WebPushResult {
  success: boolean;
  token?: string;
  error?: NotificationError;
}