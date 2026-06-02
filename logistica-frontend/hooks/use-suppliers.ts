'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  PaginatedResponse,
} from '@/docs/schemas';

interface SupplierParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export function useSuppliers(params: SupplierParams) {
  return useQuery<PaginatedResponse<Supplier>, AxiosError>({
    queryKey: ['suppliers', params],
    queryFn: () => api.get('/suppliers/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id?: number) {
  return useQuery<Supplier, AxiosError>({
    queryKey: ['suppliers', id],
    queryFn: () => api.get(`/suppliers/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSupplier(onSuccess?: () => void) {
  return useMutation<Supplier, AxiosError, SupplierCreate>({
    mutationFn: (body) => api.post('/suppliers/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess?.();
    },
  });
}

export function useUpdateSupplier(onSuccess?: () => void) {
  return useMutation<Supplier, AxiosError, { id: number; data: SupplierUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/suppliers/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess?.();
    },
  });
}

export function useDeleteSupplier(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/suppliers/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess?.();
    },
  });
}

// Lightweight hook for populating select dropdowns — non-paginated, fetches all suppliers
export function useSuppliersList() {
  return useQuery<PaginatedResponse<Supplier>, AxiosError>({
    queryKey: ['suppliers-list'],
    queryFn: () =>
      api.get('/suppliers/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 min — supplier list changes rarely
  });
}
