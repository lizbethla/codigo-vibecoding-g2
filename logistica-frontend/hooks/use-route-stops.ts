'use client';

import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type { RouteStop, RouteStopCreate, RouteStopUpdate } from '@/docs/schemas';

export function useCreateStop(onSuccess?: () => void) {
  return useMutation<RouteStop, AxiosError, { routeId: number; data: RouteStopCreate }>({
    mutationFn: ({ routeId, data }) =>
      api.post(`/routes/${routeId}/stops/`, data).then((r) => r.data),
    onSuccess: (_, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
      onSuccess?.();
    },
  });
}

export function useUpdateStop(onSuccess?: () => void) {
  return useMutation<
    RouteStop,
    AxiosError,
    { routeId: number; stopId: number; data: RouteStopUpdate }
  >({
    mutationFn: ({ routeId, stopId, data }) =>
      api.patch(`/routes/${routeId}/stops/${stopId}/`, data).then((r) => r.data),
    onSuccess: (_, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
      onSuccess?.();
    },
  });
}

export function useDeleteStop(onSuccess?: () => void) {
  return useMutation<void, AxiosError, { routeId: number; stopId: number }>({
    mutationFn: ({ routeId, stopId }) =>
      api.delete(`/routes/${routeId}/stops/${stopId}/`).then(() => undefined),
    onSuccess: (_, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
      onSuccess?.();
    },
  });
}
