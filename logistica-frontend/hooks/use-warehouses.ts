'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Warehouse,
  WarehouseCreate,
  WarehouseUpdate,
  WarehouseSummary,
  PaginatedResponse,
} from '@/docs/schemas';

interface WarehouseParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export function useWarehouses(params: WarehouseParams) {
  return useQuery<PaginatedResponse<WarehouseSummary>, AxiosError>({
    queryKey: ['warehouses', params],
    queryFn: () => api.get('/warehouses/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useWarehouse(id?: number) {
  return useQuery<Warehouse, AxiosError>({
    queryKey: ['warehouse', id],
    queryFn: () => api.get(`/warehouses/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateWarehouse(onSuccess?: () => void) {
  return useMutation<Warehouse, AxiosError, WarehouseCreate>({
    mutationFn: (body) => api.post('/warehouses/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onSuccess?.();
    },
  });
}

export function useUpdateWarehouse(onSuccess?: () => void) {
  return useMutation<Warehouse, AxiosError, { id: number; data: WarehouseUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/warehouses/${id}/`, data).then((r) => r.data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', variables.id] });
      onSuccess?.();
    },
  });
}

export function useDeleteWarehouse(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/warehouses/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onSuccess?.();
    },
  });
}

export function useWarehousesList() {
  return useQuery<PaginatedResponse<WarehouseSummary>, AxiosError>({
    queryKey: ['warehouses-list'],
    queryFn: () =>
      api.get('/warehouses/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
