'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  PaginatedResponse,
} from '@/docs/schemas';

interface CustomerParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export function useCustomers(params: CustomerParams) {
  return useQuery<PaginatedResponse<Customer>, AxiosError>({
    queryKey: ['customers', params],
    queryFn: () => api.get('/customers/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id?: number) {
  return useQuery<Customer, AxiosError>({
    queryKey: ['customers', id],
    queryFn: () => api.get(`/customers/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCustomer(onSuccess?: () => void) {
  return useMutation<Customer, AxiosError, CustomerCreate>({
    mutationFn: (body) => api.post('/customers/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
  });
}

export function useUpdateCustomer(onSuccess?: () => void) {
  return useMutation<Customer, AxiosError, { id: number; data: CustomerUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/customers/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
  });
}

export function useDeleteCustomer(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/customers/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
  });
}

export function useCustomersList() {
  return useQuery<PaginatedResponse<Customer>, AxiosError>({
    queryKey: ['customers-list'],
    queryFn: () =>
      api.get('/customers/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
