/**
 * Cliente API para comunicarse con las rutas API de Next.js
 * Las rutas API actúan como proxy y manejan la autenticación y API key server-side
 */

// Nota: usamos proxies distintos para mantener API keys en el servidor.
// - Permit: usuarios + notificaciones
// - Vendor: productos + clientes + órdenes
const PERMIT_API_BASE_URL = '/api/permit';
const VENDOR_API_BASE_URL = '/api/vendor';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// ==================== USUARIOS ====================

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string | Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    return fetchApi<User[]>(PERMIT_API_BASE_URL, '/users/');
  },

  getById: async (id: number): Promise<User> => {
    return fetchApi<User>(PERMIT_API_BASE_URL, `/users/${id}`);
  },

  create: async (data: CreateUserInput): Promise<User> => {
    return fetchApi<User>(PERMIT_API_BASE_URL, '/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateUserInput): Promise<User> => {
    return fetchApi<User>(PERMIT_API_BASE_URL, `/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; user: User }> => {
    return fetchApi<{ message: string; user: User }>(PERMIT_API_BASE_URL, `/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== PRODUCTOS ====================

export interface Product {
  id: number;
  imageUrl: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  price: number;
  stock: number;
  availableAt: string | Date;
}

export interface CreateProductInput {
  imageUrl: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  price: number;
  stock: number;
  availableAt: string;
}

export interface UpdateProductInput {
  imageUrl?: string;
  name?: string;
  status?: 'active' | 'inactive' | 'archived';
  price?: number;
  stock?: number;
  availableAt?: string;
}

export interface ProductFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'archived';
  offset?: number;
  limit?: number;
}

export const productsApi = {
  getAll: async (filters?: ProductFilters): Promise<{ products: Product[]; total: number; offset: number | null }> => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('q', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.offset) params.set('offset', filters.offset.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    
    const query = params.toString();
    const res = await fetchApi<{ data: Product[]; total: number; offset: number | null; limit: number | null }>(
      VENDOR_API_BASE_URL,
      `/products${query ? `?${query}` : ''}`
    );
    return {
      products: res.data,
      total: res.total ?? res.data.length,
      offset: res.offset ?? null,
    };
  },

  getById: async (id: number): Promise<Product> => {
    const res = await fetchApi<{ data: Product }>(VENDOR_API_BASE_URL, `/products/${id}`);
    return res.data;
  },

  create: async (data: CreateProductInput): Promise<Product> => {
    return fetchApi<Product>(VENDOR_API_BASE_URL, '/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateProductInput): Promise<Product> => {
    return fetchApi<Product>(VENDOR_API_BASE_URL, `/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; product: Product }> => {
    return fetchApi<{ message: string; product: Product }>(VENDOR_API_BASE_URL, `/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== CLIENTES ====================

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string | Date;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const res = await fetchApi<{ data: Customer[]; total?: number }>(VENDOR_API_BASE_URL, '/customers');
    return res.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const res = await fetchApi<{ data: Customer }>(VENDOR_API_BASE_URL, `/customers/${id}`);
    return res.data;
  },

  create: async (data: CreateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>(VENDOR_API_BASE_URL, '/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>(VENDOR_API_BASE_URL, `/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; customer: Customer }> => {
    return fetchApi<{ message: string; customer: Customer }>(VENDOR_API_BASE_URL, `/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ÓRDENES ====================

export interface Order {
  id: number;
  customerId: number;
  customerName?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  items?: OrderItem[];
  payments?: PaymentRecord[];
  statusEvents?: OrderStatusEvent[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPriceBase: number;
  unitPriceFinal: number;
  discountAmount: number;
  discountPercent: number;
  lineTotal: number;
  createdAt: string | Date;
}

export interface PaymentRecord {
  id: number;
  orderId: number;
  method: 'bank_transfer';
  status: 'pending' | 'confirmed';
  amount: number;
  reference?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
}

export interface OrderStatusEvent {
  id: number;
  orderId: number;
  fromStatus: Order['status'] | null;
  toStatus: Order['status'];
  reason?: string | null;
  createdAt: string | Date;
}

// ==================== SHIPMENTS (READ-ONLY) ====================

export interface Shipment {
  id: number;
  orderId: number;
  status: 'pending' | 'packed' | 'shipped' | 'in_transit' | 'delivered' | 'exception' | 'cancelled';
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ShipmentEvent {
  id: number;
  shipmentId: number;
  type: 'created' | 'packed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  location?: string | null;
  message?: string | null;
  occurredAt: string | Date;
  createdAt: string | Date;
}

export interface ShipmentDetail extends Shipment {
  events: ShipmentEvent[];
}

const SHIPMENTS_API_BASE_URL = '/api/shipments';

export const shipmentsApi = {
  getByOrderId: async (orderId: number): Promise<Shipment[]> => {
    return fetchApi<Shipment[]>(SHIPMENTS_API_BASE_URL, `/shipments?orderId=${orderId}`);
  },
  getById: async (shipmentId: number): Promise<ShipmentDetail> => {
    return fetchApi<ShipmentDetail>(SHIPMENTS_API_BASE_URL, `/shipments/${shipmentId}`);
  },
};

export interface CreateOrderInput {
  customerId: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total?: number;
  items?: Array<{
    productId: number;
    quantity: number;
    unitPriceBase?: number;
    unitPriceFinal?: number;
    discountAmount?: number;
    discountPercent?: number;
  }>;
}

export interface UpdateOrderInput {
  customerId?: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total?: number;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const res = await fetchApi<{ data: Order[]; total?: number; offset?: number | null; limit?: number | null }>(
      VENDOR_API_BASE_URL,
      '/orders'
    );
    return res.data;
  },

  getById: async (id: number): Promise<Order> => {
    const res = await fetchApi<{ data: Order }>(VENDOR_API_BASE_URL, `/orders/${id}`);
    return res.data;
  },

  create: async (data: CreateOrderInput): Promise<Order> => {
    return fetchApi<Order>(VENDOR_API_BASE_URL, '/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateOrderInput): Promise<Order> => {
    return fetchApi<Order>(VENDOR_API_BASE_URL, `/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; order: Order }> => {
    return fetchApi<{ message: string; order: Order }>(VENDOR_API_BASE_URL, `/orders/${id}`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (
    id: number,
    data: { toStatus: Order['status']; reason?: string }
  ): Promise<Order> => {
    return fetchApi<Order>(VENDOR_API_BASE_URL, `/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  addPayment: async (
    id: number,
    data: { amount: number; reference?: string; proofUrl?: string; notes?: string; paidAt?: string }
  ): Promise<PaymentRecord> => {
    return fetchApi<PaymentRecord>(VENDOR_API_BASE_URL, `/orders/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==================== NOTIFICACIONES ====================

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  readAt?: string | Date | null;
  actionUrl?: string | null;
  createdAt: string | Date;
}

export interface NotificationPreference {
  id: number;
  userId: number;
  channel: 'email' | 'in-app' | 'push';
  notificationType: string;
  enabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UpdateNotificationPreferenceInput {
  channel: 'email' | 'in-app' | 'push';
  notificationType: string;
  enabled: boolean;
}

export const notificationsApi = {
  getAll: async (userId: number, filters?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]> => {
    const params = new URLSearchParams();
    params.set('userId', userId.toString());
    if (filters?.unreadOnly) params.set('unreadOnly', 'true');
    if (filters?.limit) params.set('limit', filters.limit.toString());
    return fetchApi<Notification[]>(PERMIT_API_BASE_URL, `/v1/notifications?${params.toString()}`);
  },
  getUnreadCount: async (userId: number): Promise<{ count: number }> => {
    return fetchApi<{ count: number }>(PERMIT_API_BASE_URL, `/v1/notifications/unread-count?userId=${userId}`);
  },
  markAsRead: async (id: number, userId: number): Promise<Notification> => {
    return fetchApi<Notification>(PERMIT_API_BASE_URL, `/v1/notifications/${id}/read?userId=${userId}`, {
      method: 'PUT',
    });
  },
  markAllAsRead: async (userId: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(PERMIT_API_BASE_URL, `/v1/notifications/read-all?userId=${userId}`, {
      method: 'PUT',
    });
  },
  getPreferences: async (userId: number): Promise<NotificationPreference[]> => {
    return fetchApi<NotificationPreference[]>(PERMIT_API_BASE_URL, `/v1/notifications/preferences?userId=${userId}`);
  },
  updatePreference: async (userId: number, data: UpdateNotificationPreferenceInput): Promise<NotificationPreference> => {
    return fetchApi<NotificationPreference>(PERMIT_API_BASE_URL, `/v1/notifications/preferences?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};




