'use client';

import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type {
  ShipmentProduct,
  ShipmentProductCreate,
  ShipmentProductUpdate,
} from '@/docs/schemas';

export function useAddShipmentProduct(onSuccess?: () => void) {
  return useMutation<
    ShipmentProduct,
    AxiosError,
    { shipmentId: number; data: ShipmentProductCreate }
  >({
    mutationFn: ({ shipmentId, data }) =>
      api.post(`/shipments/${shipmentId}/products/`, data).then((r) => r.data),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
      onSuccess?.();
    },
  });
}

export function useUpdateShipmentProduct(onSuccess?: () => void) {
  return useMutation<
    ShipmentProduct,
    AxiosError,
    { shipmentId: number; productId: number; data: ShipmentProductUpdate }
  >({
    mutationFn: ({ shipmentId, productId, data }) =>
      api.patch(`/shipments/${shipmentId}/products/${productId}/`, data).then((r) => r.data),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
      onSuccess?.();
    },
  });
}

export function useRemoveShipmentProduct(onSuccess?: () => void) {
  return useMutation<void, AxiosError, { shipmentId: number; productId: number }>({
    mutationFn: ({ shipmentId, productId }) =>
      api.delete(`/shipments/${shipmentId}/products/${productId}/`).then(() => undefined),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
      onSuccess?.();
    },
  });
}
