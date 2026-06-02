'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  PaginatedResponse,
} from '@/docs/schemas';

interface ProductParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export function useProducts(params: ProductParams) {
  return useQuery<PaginatedResponse<Product>, AxiosError>({
    queryKey: ['products', params],
    queryFn: () => api.get('/products/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct(onSuccess?: () => void) {
  return useMutation<Product, AxiosError, ProductCreate>({
    mutationFn: (body) => api.post('/products/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });
}

export function useUpdateProduct(onSuccess?: () => void) {
  return useMutation<Product, AxiosError, { id: number; data: ProductUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/products/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });
}

export function useDeleteProduct(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/products/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });
}

export function useProductsList() {
  return useQuery<PaginatedResponse<Product>, AxiosError>({
    queryKey: ['products-list'],
    queryFn: () =>
      api.get('/products/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
