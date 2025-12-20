/**
 * Cliente API server-side para comunicarse con vendor-backend
 * La API key se mantiene solo en el servidor
 */

import 'server-only';
import { auth } from '@/lib/auth';
import { 
  CreateUserInput, 
  UpdateUserInput, 
  User,
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Order,
  CreateOrderInput,
  UpdateOrderInput
} from './api';

// Para usuarios, siempre usar el backend de Permit
const PERMIT_API_URL = process.env.PERMIT_API_URL || 'http://localhost:8000';
const PERMIT_API_KEY = process.env.PERMIT_API_KEY || '';

// Para productos, clientes y órdenes, usar el backend de Vendor (si existe) o Permit
const VENDOR_API_URL = process.env.VENDOR_API_URL || PERMIT_API_URL;
const VENDOR_API_KEY = process.env.VENDOR_API_KEY || PERMIT_API_KEY;

if (!PERMIT_API_KEY) {
  console.warn('⚠️ PERMIT_API_KEY no está configurada. Las llamadas al backend pueden fallar.');
}

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

/**
 * Función helper para hacer requests al backend con API key
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  usePermitBackend: boolean = false
): Promise<T> {
  // Verificar que el usuario esté autenticado
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('No autenticado', 401);
  }

  const baseUrl = usePermitBackend ? PERMIT_API_URL : VENDOR_API_URL;
  const apiKey = usePermitBackend ? PERMIT_API_KEY : VENDOR_API_KEY;
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // API key solo en el servidor
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

// Re-exportar tipos del cliente público
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Order,
  CreateOrderInput,
  UpdateOrderInput,
} from './api';

// Exportar funciones API server-side
// Los usuarios siempre vienen del backend de Permit
export const usersApi = {
  getAll: async () => fetchApi<User[]>('/v1/users/', undefined, true),
  getById: async (id: number) => fetchApi<User>(`/v1/users/${id}`, undefined, true),
  create: async (data: CreateUserInput) =>
    fetchApi<User>('/v1/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),
  update: async (id: number, data: UpdateUserInput) =>
    fetchApi<User>(`/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true),
  delete: async (id: number) =>
    fetchApi<{ message: string; user: User }>(`/v1/users/${id}`, {
      method: 'DELETE',
    }, true),
};

// ==================== PRODUCTOS ====================

export const productsApi = {
  getAll: async (filters?: ProductFilters): Promise<{ products: Product[]; total: number; offset: number | null }> => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('q', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.offset) params.set('offset', filters.offset.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    
    const query = params.toString();
    const res = await fetchApi<{ data: Product[]; total?: number; offset?: number | null; limit?: number | null }>(
      `/v1/products${query ? `?${query}` : ''}`
    );
    return {
      products: res.data,
      total: res.total ?? res.data.length,
      offset: res.offset ?? null,
    };
  },

  getById: async (id: number): Promise<Product> => {
    const res = await fetchApi<{ data: Product }>(`/v1/products/${id}`);
    return res.data;
  },

  create: async (data: CreateProductInput): Promise<Product> => {
    return fetchApi<Product>('/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateProductInput): Promise<Product> => {
    return fetchApi<Product>(`/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; product: Product }> => {
    return fetchApi<{ message: string; product: Product }>(`/v1/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== CLIENTES ====================

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const res = await fetchApi<{ data: Customer[]; total?: number }>(
      '/v1/customers'
    );
    return res.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const res = await fetchApi<{ data: Customer }>(`/v1/customers/${id}`);
    return res.data;
  },

  create: async (data: CreateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>(`/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; customer: Customer }> => {
    return fetchApi<{ message: string; customer: Customer }>(`/v1/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ÓRDENES ====================

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const res = await fetchApi<{ data: Order[]; total?: number; offset?: number | null; limit?: number | null }>(
      '/v1/orders'
    );
    return res.data;
  },

  getById: async (id: number): Promise<Order> => {
    const res = await fetchApi<{ data: Order }>(`/v1/orders/${id}`);
    return res.data;
  },

  create: async (data: CreateOrderInput): Promise<Order> => {
    return fetchApi<Order>('/v1/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateOrderInput): Promise<Order> => {
    return fetchApi<Order>(`/v1/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; order: Order }> => {
    return fetchApi<{ message: string; order: Order }>(`/v1/orders/${id}`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (
    id: number,
    data: { toStatus: Order['status']; reason?: string }
  ): Promise<Order> => {
    return fetchApi<Order>(`/v1/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  addPayment: async (
    id: number,
    data: { amount: number; reference?: string; proofUrl?: string; notes?: string; paidAt?: string }
  ) => {
    return fetchApi(`/v1/orders/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

