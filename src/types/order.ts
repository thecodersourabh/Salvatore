export type OrderStatus = 
  | 'pending'
  | 'confirmed' 
  | 'processing'
  | 'in-progress'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

// Customer information structure for order creation
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
  items: OrderCreationItem[];
}

// Order item structure for order creation (different from main OrderItem)
export interface OrderCreationItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Order creation result
export interface OrderResult<T> {
  success: boolean;
  orderId?: string;
  raw?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Orders fetch result
export interface OrdersResult {
  success: boolean;
  orders?: Order[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address: Address;
  orderHistory?: {
    totalOrders: number;
    completedOrders: number;
    rating: number;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, any>;
  images?: string[];
}

export interface PriceBreakdown {
  subtotal: number;
  taxes: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
  appliedCredits?: number;
}

export interface PaymentInfo {
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAmount?: number;
  dueAmount?: number;
  paymentDate?: string;
}

export interface DeliveryInfo {
  type: 'pickup' | 'delivery' | 'on-site';
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration?: number; // in minutes
  address?: Address;
  instructions?: string;
  contactPerson?: {
    name: string;
    phone: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  pricing: PriceBreakdown;
  status: OrderStatus;
  priority: OrderPriority;
  paymentInfo: PaymentInfo;
  deliveryInfo?: DeliveryInfo;
  serviceProviderId: string;
  serviceProviderName: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  notes?: string;
  internalNotes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  timeline?: Array<{
    id: string;
    status: OrderStatus;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }>;
  rating?: {
    score: number;
    review: string;
    ratedAt: string;
  };
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | OrderStatus[];
  priority?: OrderPriority;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'priority' | 'scheduledDate';
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    currency: string;
  };
}

export interface OrderUpdateRequest {
  status?: OrderStatus;
  notes?: string;
  internalNotes?: string;
  estimatedCompletion?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface OrderAcceptRequest {
  acceptWithModifications?: boolean;
  modifications?: {
    pricing?: Partial<PriceBreakdown>;
    scheduledDate?: string;
    scheduledTime?: string;
    estimatedDuration?: number;
    notes?: string;
  };
  message?: string;
}

export interface OrderRejectRequest {
  reason: string;
  detailedReason?: string;
  suggestAlternative?: boolean;
  alternativeSuggestion?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
  statusBreakdown: Array<{
    status: OrderStatus;
    count: number;
    percentage: number;
  }>;
  revenueBreakdown: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}