'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type { Route, RouteCreate, RouteUpdate, PaginatedResponse } from '@/docs/schemas';

// Shape returned by the list endpoint (RouteSummary)
export interface RouteListItem {
  id: number;
  code: string;
  name: string;
  origin_city: string;
  destination_city: string;
  is_active: boolean;
}

interface RouteParams {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export function useRoutes(params: RouteParams) {
  return useQuery<PaginatedResponse<RouteListItem>, AxiosError>({
    queryKey: ['routes', params],
    queryFn: () => api.get('/routes/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useRoute(id: number | undefined) {
  return useQuery<Route, AxiosError>({
    queryKey: ['routes', id],
    queryFn: () => api.get(`/routes/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateRoute(onSuccess?: () => void) {
  return useMutation<Route, AxiosError, RouteCreate>({
    mutationFn: (body) => api.post('/routes/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onSuccess?.();
    },
  });
}

export function useUpdateRoute(onSuccess?: () => void) {
  return useMutation<Route, AxiosError, { id: number; data: RouteUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/routes/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onSuccess?.();
    },
  });
}

export function useDeleteRoute(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/routes/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onSuccess?.();
    },
  });
}

export function useRoutesList() {
  return useQuery<PaginatedResponse<RouteListItem>, AxiosError>({
    queryKey: ['routes-list'],
    queryFn: () =>
      api.get('/routes/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
