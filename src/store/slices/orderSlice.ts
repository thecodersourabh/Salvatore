import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  serviceProviderId: string;
  title: string;
  body: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: string;
  isRead: boolean;
  data: Record<string, any>;
}

interface OrderByRole {
  asCustomer: OrderNotification[];
  asServiceProvider: OrderNotification[];
}

interface OrderState {
  orders: OrderByRole;
  unreadCounts: {
    asCustomer: number;
    asServiceProvider: number;
  };
}

const initialState: OrderState = {
  orders: {
    asCustomer: [],
    asServiceProvider: [],
  },
  unreadCounts: {
    asCustomer: 0,
    asServiceProvider: 0,
  },
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Add order notification for customer role
    addOrderAsCustomer: (state, action: PayloadAction<OrderNotification>) => {
      state.orders.asCustomer.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCounts.asCustomer += 1;
      }
    },

    // Add order notification for service provider role
    addOrderAsServiceProvider: (state, action: PayloadAction<OrderNotification>) => {
      state.orders.asServiceProvider.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCounts.asServiceProvider += 1;
      }
    },

    // Add order with automatic role detection
    addOrder: (state, action: PayloadAction<{ order: OrderNotification; currentUserInternalId: string }>) => {
      const { order, currentUserInternalId } = action.payload;

      // Add to service provider orders if user is the service provider
      if (order.serviceProviderId === currentUserInternalId) {
        state.orders.asServiceProvider.unshift(order);
        if (!order.isRead) {
          state.unreadCounts.asServiceProvider += 1;
        }
      }

      // Add to customer orders if user is the customer
      if (order.customerId === currentUserInternalId) {
        state.orders.asCustomer.unshift(order);
        if (!order.isRead) {
          state.unreadCounts.asCustomer += 1;
        }
      }
    },

    // Mark order as read in customer role
    markOrderAsReadCustomer: (state, action: PayloadAction<string>) => {
      const order = state.orders.asCustomer.find(o => o.id === action.payload);
      if (order && !order.isRead) {
        order.isRead = true;
        state.unreadCounts.asCustomer = Math.max(0, state.unreadCounts.asCustomer - 1);
      }
    },

    // Mark order as read in service provider role
    markOrderAsReadServiceProvider: (state, action: PayloadAction<string>) => {
      const order = state.orders.asServiceProvider.find(o => o.id === action.payload);
      if (order && !order.isRead) {
        order.isRead = true;
        state.unreadCounts.asServiceProvider = Math.max(0, state.unreadCounts.asServiceProvider - 1);
      }
    },

    // Mark all customer orders as read
    markAllCustomerOrdersAsRead: (state) => {
      state.orders.asCustomer.forEach(o => {
        if (!o.isRead) {
          o.isRead = true;
          state.unreadCounts.asCustomer = Math.max(0, state.unreadCounts.asCustomer - 1);
        }
      });
    },

    // Mark all service provider orders as read
    markAllServiceProviderOrdersAsRead: (state) => {
      state.orders.asServiceProvider.forEach(o => {
        if (!o.isRead) {
          o.isRead = true;
          state.unreadCounts.asServiceProvider = Math.max(0, state.unreadCounts.asServiceProvider - 1);
        }
      });
    },

    // Delete order from customer role
    deleteOrderAsCustomer: (state, action: PayloadAction<string>) => {
      const order = state.orders.asCustomer.find(o => o.id === action.payload);
      if (order && !order.isRead) {
        state.unreadCounts.asCustomer = Math.max(0, state.unreadCounts.asCustomer - 1);
      }
      state.orders.asCustomer = state.orders.asCustomer.filter(o => o.id !== action.payload);
    },

    // Delete order from service provider role
    deleteOrderAsServiceProvider: (state, action: PayloadAction<string>) => {
      const order = state.orders.asServiceProvider.find(o => o.id === action.payload);
      if (order && !order.isRead) {
        state.unreadCounts.asServiceProvider = Math.max(0, state.unreadCounts.asServiceProvider - 1);
      }
      state.orders.asServiceProvider = state.orders.asServiceProvider.filter(o => o.id !== action.payload);
    },

    // Update order status
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: OrderNotification['status']; role: 'customer' | 'serviceProvider' }>) => {
      const { orderId, status, role } = action.payload;
      const orders = role === 'customer' ? state.orders.asCustomer : state.orders.asServiceProvider;
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        order.status = status;
      }
    },

    // Clear all customer orders
    clearAllCustomerOrders: (state) => {
      state.orders.asCustomer = [];
      state.unreadCounts.asCustomer = 0;
    },

    // Clear all service provider orders
    clearAllServiceProviderOrders: (state) => {
      state.orders.asServiceProvider = [];
      state.unreadCounts.asServiceProvider = 0;
    },

    // Clear all orders
    clearAllOrders: (state) => {
      state.orders.asCustomer = [];
      state.orders.asServiceProvider = [];
      state.unreadCounts.asCustomer = 0;
      state.unreadCounts.asServiceProvider = 0;
    },
  },
});

export const {
  addOrderAsCustomer,
  addOrderAsServiceProvider,
  addOrder,
  markOrderAsReadCustomer,
  markOrderAsReadServiceProvider,
  markAllCustomerOrdersAsRead,
  markAllServiceProviderOrdersAsRead,
  deleteOrderAsCustomer,
  deleteOrderAsServiceProvider,
  updateOrderStatus,
  clearAllCustomerOrders,
  clearAllServiceProviderOrders,
  clearAllOrders,
} = orderSlice.actions;

// Selectors
export const selectCustomerOrders = (state: { orders: OrderState }) => state.orders.orders.asCustomer;
export const selectServiceProviderOrders = (state: { orders: OrderState }) => state.orders.orders.asServiceProvider;
export const selectUnreadCountAsCustomer = (state: { orders: OrderState }) => state.orders.unreadCounts.asCustomer;
export const selectUnreadCountAsServiceProvider = (state: { orders: OrderState }) => state.orders.unreadCounts.asServiceProvider;

export default orderSlice.reducer;
