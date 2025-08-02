export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: string;
  area: string;
  x: number;
  y: number;
  shape: string;
  sort_order: number;
  available?: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  reason: string;
  description?: string;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  time: string;
  is_available: boolean;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export interface Reservation {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date: string;
  time: string;
  table_id: number;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface TableAvailability {
  table_id: number;
  table_name: string;
  capacity: number;
  is_available: boolean;
  existing_reservation?: Reservation;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiActions {
  refetch: () => void;
  clearError: () => void;
}

export interface UseApiConfig {
  immediate?: boolean;
  cache?: boolean;
  retryOnError?: boolean;
  retryCount?: number;
} 