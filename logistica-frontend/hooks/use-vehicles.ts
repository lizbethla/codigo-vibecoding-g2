'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Vehicle,
  VehicleCreate,
  VehicleUpdate,
  VehicleType,
  VehicleStatus,
  PaginatedResponse,
} from '@/docs/schemas';

// Shape returned by the list endpoint (subset of Vehicle — no driver field)
export interface VehicleListItem {
  id: number;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
}

interface VehicleParams {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export function useVehicles(params: VehicleParams) {
  return useQuery<PaginatedResponse<VehicleListItem>, AxiosError>({
    queryKey: ['vehicles', params],
    queryFn: () => api.get('/vehicles/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useVehicle(id: number | undefined) {
  return useQuery<Vehicle, AxiosError>({
    queryKey: ['vehicles', id],
    queryFn: () => api.get(`/vehicles/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateVehicle(onSuccess?: () => void) {
  return useMutation<Vehicle, AxiosError, VehicleCreate>({
    mutationFn: (body) => api.post('/vehicles/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess?.();
    },
  });
}

export function useUpdateVehicle(onSuccess?: () => void) {
  return useMutation<Vehicle, AxiosError, { id: number; data: VehicleUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/vehicles/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess?.();
    },
  });
}

export function useDeleteVehicle(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/vehicles/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess?.();
    },
  });
}

export function useVehiclesList() {
  return useQuery<PaginatedResponse<VehicleListItem>, AxiosError>({
    queryKey: ['vehicles-list'],
    queryFn: () =>
      api.get('/vehicles/', { params: { page_size: 100, ordering: 'plate' } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
