'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Driver,
  DriverCreate,
  DriverUpdate,
  LicenseType,
  DriverStatus,
  PaginatedResponse,
} from '@/docs/schemas';

// Shape returned by the list endpoint (subset of Driver)
export interface DriverListItem {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  license_type: LicenseType;
  status: DriverStatus;
  national_id: string;
}

interface DriverParams {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export function useDrivers(params: DriverParams) {
  return useQuery<PaginatedResponse<DriverListItem>, AxiosError>({
    queryKey: ['drivers', params],
    queryFn: () => api.get('/drivers/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useDriver(id: number | undefined) {
  return useQuery<Driver, AxiosError>({
    queryKey: ['drivers', id],
    queryFn: () => api.get(`/drivers/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateDriver(onSuccess?: () => void) {
  return useMutation<Driver, AxiosError, DriverCreate>({
    mutationFn: (body) => api.post('/drivers/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      onSuccess?.();
    },
  });
}

export function useUpdateDriver(onSuccess?: () => void) {
  return useMutation<Driver, AxiosError, { id: number; data: DriverUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/drivers/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      onSuccess?.();
    },
  });
}

export function useDeleteDriver(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/drivers/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      onSuccess?.();
    },
  });
}

// Lightweight query for dropdown population — fetches all drivers (page_size=100),
// does NOT filter by status so the currently assigned driver shows in edit mode.
export function useDriversList() {
  return useQuery<PaginatedResponse<DriverListItem>, AxiosError>({
    queryKey: ['drivers-list'],
    queryFn: () =>
      api.get('/drivers/', { params: { page_size: 100, ordering: 'status' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
