import { useState, useEffect, useCallback, useRef } from 'react';
import { api, errorHandler, ApiError } from '../utils/api';
import { ApiState, ApiActions, UseApiConfig } from '../types';

// 基礎 useApi hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  config: UseApiConfig = {}
): [ApiState<T>, ApiActions] {
  const { immediate = true, retryOnError = true, retryCount = 3 } = config;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const apiCallRef = useRef(apiCall);

  // 更新 apiCall 引用
  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    retryCountRef.current = 0;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const executeWithRetry = async (): Promise<void> => {
      try {
        const data = await apiCallRef.current();
        
        if (!abortControllerRef.current?.signal.aborted) {
          setState({
            data,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const errorMessage = errorHandler.handle(error);
        
        if (retryOnError && retryCountRef.current < retryCount && error instanceof ApiError && error.status >= 500) {
          retryCountRef.current++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
          return executeWithRetry();
        }

        setState({
          data: null,
          loading: false,
          error: errorMessage
        });
      }
    };

    await executeWithRetry();
  }, [retryOnError, retryCount]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate]);

  return [state, { refetch, clearError }];
}

// 專門用於訂位的 hook
export function useReservations() {
  return useApi(() => api.admin.getAllReservations(), {
    immediate: true,
    cache: true,
    retryOnError: true
  });
}

// 專門用於餐桌的 hook
export function useTables() {
  return useApi(() => api.tables.getAll(), {
    immediate: true,
    cache: true,
    retryOnError: true
  });
}

// 專門用於公休日的 hook
export function useHolidays() {
  return useApi(() => api.holidays.getAll(), {
    immediate: true,
    cache: true,
    retryOnError: true
  });
}

// 專門用於可訂位時間的 hook
export function useTimeSlots() {
  return useApi(() => api.timeSlots.getAll(), {
    immediate: true,
    cache: true,
    retryOnError: true
  });
}

// 專門用於餐桌可用性的 hook
export function useTableAvailability(date: string, time: string) {
  const [debouncedDate, setDebouncedDate] = useState(date);
  const [debouncedTime, setDebouncedTime] = useState(time);

  // 防抖機制，避免頻繁的 API 調用
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDate(date);
      setDebouncedTime(time);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [date, time]);

  const apiCall = useCallback(() => api.tables.checkAvailability(debouncedDate, debouncedTime), [debouncedDate, debouncedTime]);
  
  return useApi(apiCall, {
    immediate: !!debouncedDate && !!debouncedTime,
    cache: true,
    retryOnError: true
  });
}

// 用於創建訂位的 hook
export function useCreateReservation() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const createReservation = useCallback(async (data: any) => {
    setState({ loading: true, error: null, success: false });

    try {
      await api.reservations.create(data);
      setState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = errorHandler.handle(error);
      setState({ loading: false, error: errorMessage, success: false });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, createReservation, reset };
}

// 用於取消訂位的 hook
export function useCancelReservation() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const cancelReservation = useCallback(async (id: number) => {
    setState({ loading: true, error: null, success: false });

    try {
      await api.reservations.cancel(id);
      setState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = errorHandler.handle(error);
      setState({ loading: false, error: errorMessage, success: false });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, cancelReservation, reset };
}

// 用於標記到店的 hook
export function useMarkArrived() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const markArrived = useCallback(async (id: number) => {
    setState({ loading: true, error: null, success: false });

    try {
      await api.reservations.markArrived(id);
      setState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = errorHandler.handle(error);
      setState({ loading: false, error: errorMessage, success: false });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, markArrived, reset };
}

// 用於刪除所有訂位的 hook
export function useDeleteAllReservations() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const deleteAllReservations = useCallback(async () => {
    setState({ loading: true, error: null, success: false });

    try {
      await api.admin.deleteAllReservations();
      setState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = errorHandler.handle(error);
      setState({ loading: false, error: errorMessage, success: false });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, deleteAllReservations, reset };
} 