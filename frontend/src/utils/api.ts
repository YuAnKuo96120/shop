import config from '../config';
import { Table, Holiday, TimeSlot, Reservation, TableAvailability } from '../types';

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

const cache = new SimpleCache();

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryRequest<T>(requestFn: () => Promise<T>, retries = RETRY_CONFIG.maxRetries): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    const delayMs = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, RETRY_CONFIG.maxRetries - retries),
      RETRY_CONFIG.maxDelay
    );
    
    await delay(delayMs);
    return retryRequest(requestFn, retries - 1);
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, useCache = false, cacheKey?: string): Promise<T> {
  const url = `${config.API_URL}${endpoint}`;
  
  if (useCache && cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;
  }

  const response = await retryRequest(async () => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${res.status}: ${res.statusText}`,
        res.status,
        errorData
      );
    }

    return res;
  });

  const data = await response.json();
  
  if (useCache && cacheKey) {
    cache.set(cacheKey, data);
  }

  return data;
}

export const api = {
  // Tables
  getTables: () => apiRequest<Table[]>('/api/admin/tables', { method: 'GET' }, true, 'tables'),
  getTable: (id: number) => apiRequest<Table>(`/api/admin/tables/${id}`, { method: 'GET' }, true, `table_${id}`),
  tables: {
    getAll: () => apiRequest<Table[]>('/api/admin/tables', { method: 'GET' }, true, 'tables'),
    getById: (id: number) => apiRequest<Table>(`/api/admin/tables/${id}`, { method: 'GET' }, true, `table_${id}`),
    update: (id: number, table: Partial<Table>) => apiRequest<Table>(`/api/admin/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(table)
    }),
    create: (table: Omit<Table, 'id'>) => apiRequest<Table>('/api/admin/tables', {
      method: 'POST',
      body: JSON.stringify(table)
    }),
    delete: (id: number) => apiRequest<void>(`/api/admin/tables/${id}`, { method: 'DELETE' }),
    deleteAll: () => apiRequest<{ success: boolean; message: string; deletedCount: number }>('/api/admin/tables', { method: 'DELETE' }),
    checkAvailability: (date: string, time: string) => 
      apiRequest<TableAvailability[]>(`/api/check-table-availability?date=${date}&time=${time}`, { method: 'GET' }, true, `availability_${date}_${time}`)
  },
  
  // Holidays
  getHolidays: () => apiRequest<Holiday[]>('/api/holidays', { method: 'GET' }, true, 'holidays'),
  createHoliday: (holiday: Omit<Holiday, 'id'>) => apiRequest<Holiday>('/api/admin/holidays', {
    method: 'POST',
    body: JSON.stringify(holiday)
  }),
  updateHoliday: (id: number, holiday: Partial<Holiday>) => apiRequest<Holiday>(`/api/admin/holidays/${id}`, {
    method: 'PUT',
    body: JSON.stringify(holiday)
  }),
  deleteHoliday: (id: number) => apiRequest<void>(`/api/admin/holidays/${id}`, { method: 'DELETE' }),
  holidays: {
    getAll: () => apiRequest<Holiday[]>('/api/holidays', { method: 'GET' }, true, 'holidays'),
    getById: (id: number) => apiRequest<Holiday>(`/api/admin/holidays/${id}`, { method: 'GET' }, true, `holiday_${id}`),
    create: (holiday: Omit<Holiday, 'id'>) => apiRequest<Holiday>('/api/admin/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday)
    }),
    update: (id: number, holiday: Partial<Holiday>) => apiRequest<Holiday>(`/api/admin/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holiday)
    }),
    delete: (id: number) => apiRequest<void>(`/api/admin/holidays/${id}`, { method: 'DELETE' })
  },
  
  // Time Slots
  getTimeSlots: () => apiRequest<TimeSlot[]>('/api/time-slots', { method: 'GET' }, true, 'timeslots'),
  createTimeSlot: (timeSlot: Omit<TimeSlot, 'id'>) => apiRequest<TimeSlot>('/api/admin/time-slots', {
    method: 'POST',
    body: JSON.stringify(timeSlot)
  }),
  updateTimeSlot: (id: number, timeSlot: Partial<TimeSlot>) => apiRequest<TimeSlot>(`/api/admin/time-slots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(timeSlot)
  }),
  deleteTimeSlot: (id: number) => apiRequest<void>(`/api/admin/time-slots/${id}`, { method: 'DELETE' }),
  timeSlots: {
    getAll: () => apiRequest<TimeSlot[]>('/api/time-slots', { method: 'GET' }, true, 'timeslots'),
    getById: (id: number) => apiRequest<TimeSlot>(`/api/admin/time-slots/${id}`, { method: 'GET' }, true, `timeslot_${id}`),
    create: (timeSlot: Omit<TimeSlot, 'id'>) => apiRequest<TimeSlot>('/api/admin/time-slots', {
      method: 'POST',
      body: JSON.stringify(timeSlot)
    }),
    update: (id: number, timeSlot: Partial<TimeSlot>) => apiRequest<TimeSlot>(`/api/admin/time-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timeSlot)
    }),
    delete: (id: number) => apiRequest<void>(`/api/admin/time-slots/${id}`, { method: 'DELETE' })
  },
  
  // Reservations
  getReservations: () => apiRequest<Reservation[]>('/api/reservations', { method: 'GET' }, true, 'reservations'),
  getReservation: (id: number) => apiRequest<Reservation>(`/api/reservations/${id}`, { method: 'GET' }, true, `reservation_${id}`),
  createReservation: (reservation: Omit<Reservation, 'id'>) => apiRequest<Reservation>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(reservation)
  }),
  updateReservation: (id: number, reservation: Partial<Reservation>) => apiRequest<Reservation>(`/api/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reservation)
  }),
  deleteReservation: (id: number) => apiRequest<void>(`/api/reservations/${id}`, { method: 'DELETE' }),
  reservations: {
    getAll: () => apiRequest<Reservation[]>('/api/admin/reservations', { method: 'GET' }, true, 'reservations'),
    getById: (id: number) => apiRequest<Reservation>(`/api/reservations/${id}`, { method: 'GET' }, true, `reservation_${id}`),
    create: (reservation: Omit<Reservation, 'id'>) => apiRequest<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation)
    }),
    update: (id: number, reservation: Partial<Reservation>) => apiRequest<Reservation>(`/api/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservation)
    }),
    delete: (id: number) => apiRequest<void>(`/api/reservations/${id}`, { method: 'DELETE' }),
    cancel: (id: number) => apiRequest<Reservation>(`/api/reservations/${id}`, { method: 'DELETE' }),
    markArrived: (id: number) => apiRequest<Reservation>(`/api/reservations/${id}/arrive`, { method: 'POST' })
  },
  
  // Table Availability
  getTableAvailability: (date: string, time: string) => 
    apiRequest<TableAvailability[]>(`/api/check-table-availability?date=${date}&time=${time}`, { method: 'GET' }, true, `availability_${date}_${time}`),
  
  // Admin APIs
  admin: {
    getAllReservations: () => apiRequest<Reservation[]>('/api/admin/reservations', { method: 'GET' }, true, 'admin_reservations'),
    updateReservationStatus: (id: number, status: Reservation['status']) => apiRequest<Reservation>(`/api/admin/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    getReservationStats: () => apiRequest<any>('/api/admin/stats', { method: 'GET' }, true, 'admin_stats'),
    deleteAllReservations: () => apiRequest<void>('/api/admin/reservations/all', { method: 'DELETE' })
  }
};

export const cacheManager = {
  clearCache: () => cache.clear(),
  clearTableCache: () => {
    cache.delete('tables');
    // Clear individual table caches
    for (let i = 1; i <= 20; i++) {
      cache.delete(`table_${i}`);
    }
  },
  clearReservationCache: () => {
    cache.delete('reservations');
    // Clear individual reservation caches
    for (let i = 1; i <= 100; i++) {
      cache.delete(`reservation_${i}`);
    }
  },
  clearAvailabilityCache: () => {
    // Clear availability caches for common dates
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      ['12:00', '13:00', '18:00', '19:00', '20:00'].forEach(time => {
        cache.delete(`availability_${dateStr}_${time}`);
      });
    }
  }
};

export const errorHandler = {
  handle: (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
  
  isNetworkError: (error: unknown): boolean => {
    if (error instanceof ApiError) {
      return error.status === 0 || error.status >= 500;
    }
    return false;
  },
  
  isClientError: (error: unknown): boolean => {
    if (error instanceof ApiError) {
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }
};

export { ApiError };
export default api;
