/**
 * Order Notification Tester - Global Testing Functions
 * 
 * This file provides global testing functions for order notifications
 * that can be called from browser dev console for debugging.
 */

import { 
  registerDevice
} from './notificationService';
import { orderService } from './orderService';
import type { OrderStatus } from '../types/order';

// Global testing functions for dev console access
declare global {
  interface Window {
    orderTest: {
      showNotification: (orderId: string, status: OrderStatus, customerName?: string) => Promise<void>;
      registerDevice: (userId: string, authToken?: string) => Promise<void>;
      createOrder: (serviceProviderId: string, authToken?: string) => Promise<void>;
      createCustomOrder: (data: any, authToken?: string) => Promise<void>;
      fetchOrders: (userId: string, authToken?: string) => Promise<void>;
      testAll: () => Promise<void>;
    };
  }
}

// Global order testing object
window.orderTest = {
  // Test local notification
  showNotification: async (orderId: string, status: OrderStatus, customerName?: string) => {
    console.log(`[OrderTest] Testing ${status} notification for order ${orderId}`);
    try {
      const result = await orderService.showOrderNotification(orderId, status, customerName);
      console.log('[OrderTest] Notification result:', result);
    } catch (error) {
      console.error('[OrderTest] Notification error:', error);
    }
  },

  // Test device registration
  registerDevice: async (userId: string, authToken?: string) => {
    console.log('[OrderTest] Testing device registration for user:', userId);
    try {
      const result = await registerDevice(userId, undefined, authToken);
      console.log('[OrderTest] Registration result:', result);
    } catch (error) {
      console.error('[OrderTest] Registration error:', error);
    }
  },

  // Test order creation
  createOrder: async (serviceProviderId: string, authToken?: string) => {
    console.log('[OrderTest] Testing order creation for provider:', serviceProviderId);
    try {
      const result = await orderService.createTestOrder(serviceProviderId, authToken);
      console.log('[OrderTest] Order creation result:', result);
    } catch (error) {
      console.error('[OrderTest] Order creation error:', error);
    }
  },

  // Test custom order creation
  createCustomOrder: async (data: any, authToken?: string) => {
    console.log('[OrderTest] Testing custom order creation with data:', data);
    try {
      const result = await orderService.createOrderWithData({ ...data, authToken });
      console.log('[OrderTest] Custom order result:', result);
    } catch (error) {
      console.error('[OrderTest] Custom order error:', error);
    }
  },

  // Test fetch orders
  fetchOrders: async (userId: string, authToken?: string) => {
    console.log('[OrderTest] Testing fetch orders for user:', userId);
    try {
      const result = await orderService.fetchOrdersViaAPI(userId, authToken);
      console.log('[OrderTest] Fetch orders result:', result);
    } catch (error) {
      console.error('[OrderTest] Fetch orders error:', error);
    }
  },

  // Test all notification types
  testAll: async () => {
    console.log('[OrderTest] Running all notification tests...');
    
    const testOrderId = `TEST-${Date.now()}`;
    const statuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'rejected',
      'cancelled',
      'processing',
      'in-progress',
      'ready',
      'completed'
    ];    for (const status of statuses) {
      try {
        await window.orderTest.showNotification(testOrderId, status, 'Test Customer');
        // Wait 1 second between notifications
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[OrderTest] Error testing ${status}:`, error);
      }
    }
    
    console.log('[OrderTest] All notification tests completed');
  }
};

// Log available functions on startup
console.log('📋 Order Test Functions Available:');
console.log('  orderTest.showNotification(orderId, status, customerName?)');
console.log('  orderTest.registerDevice(userId, authToken?)');
console.log('  orderTest.createOrder(serviceProviderId, authToken?)');
console.log('  orderTest.createCustomOrder(data, authToken?)');
console.log('  orderTest.fetchOrders(userId, authToken?)');
console.log('  orderTest.testAll()');
console.log('');
console.log('📝 Example usage:');
console.log('  orderTest.showNotification("ORD-123", "order_received", "John Doe")');
console.log('  orderTest.testAll()');

// Export empty object since this is mainly for side effects
export {};