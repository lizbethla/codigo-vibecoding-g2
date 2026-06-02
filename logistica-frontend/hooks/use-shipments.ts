'use client';

import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  Shipment,
  ShipmentCreate,
  ShipmentUpdate,
  ShipmentStatus,
  ShipmentPriority,
  PaginatedResponse,
} from '@/docs/schemas';

export interface ShipmentListItem {
  id: number;
  tracking_code: string;
  customer: { id: number; name: string; customer_type: string };
  status: ShipmentStatus;
  priority: ShipmentPriority;
  destination_city: string;
  scheduled_date: string;
  total_cost: string;
}

interface ShipmentParams {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export function useShipments(params: ShipmentParams) {
  return useQuery<PaginatedResponse<ShipmentListItem>, AxiosError>({
    queryKey: ['shipments', params],
    queryFn: () => api.get('/shipments/', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useShipment(id: number | undefined) {
  return useQuery<Shipment, AxiosError>({
    queryKey: ['shipments', id],
    queryFn: () => api.get(`/shipments/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateShipment(onSuccess?: () => void) {
  return useMutation<Shipment, AxiosError, ShipmentCreate>({
    mutationFn: (body) => api.post('/shipments/', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      onSuccess?.();
    },
  });
}

export function useUpdateShipment(onSuccess?: () => void) {
  return useMutation<Shipment, AxiosError, { id: number; data: ShipmentUpdate }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/shipments/${id}/`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
      onSuccess?.();
    },
  });
}

export function useDeleteShipment(onSuccess?: () => void) {
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => api.delete(`/shipments/${id}/`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      onSuccess?.();
    },
  });
}
