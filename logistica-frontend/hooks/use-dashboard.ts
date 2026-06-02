'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type {
  PaginatedResponse,
  Product,
  Customer,
  ShipmentStatus,
  ShipmentPriority,
  VehicleStatus,
  DriverStatus,
  LicenseType,
  VehicleType,
} from '@/docs/schemas';

// ─── Shipments ────────────────────────────────────────────────────────────────

export interface DashboardShipmentItem {
  id: number;
  tracking_code: string;
  customer: { id: number; name: string; customer_type: string };
  status: ShipmentStatus;
  priority: ShipmentPriority;
  destination_city: string;
  scheduled_date: string;
  total_cost: string;
}

export function useShipmentStats(dateRange?: { from: string; to: string }) {
  const params: Record<string, string | number> = {
    page_size: 100,
    ordering: '-scheduled_date',
  };
  if (dateRange?.from) params['scheduled_date_after'] = dateRange.from;
  if (dateRange?.to) params['scheduled_date_before'] = dateRange.to;

  return useQuery<PaginatedResponse<DashboardShipmentItem>, AxiosError>({
    queryKey: ['dashboard-shipments', dateRange],
    queryFn: () => api.get('/shipments/', { params }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export interface DashboardVehicleItem {
  id: number;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
}

export function useVehicleStats() {
  return useQuery<PaginatedResponse<DashboardVehicleItem>, AxiosError>({
    queryKey: ['dashboard-vehicles'],
    queryFn: () =>
      api.get('/vehicles/', { params: { page_size: 100 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

export interface DashboardDriverItem {
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

export function useDriverStats() {
  return useQuery<PaginatedResponse<DashboardDriverItem>, AxiosError>({
    queryKey: ['dashboard-drivers'],
    queryFn: () =>
      api.get('/drivers/', { params: { page_size: 100 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function useProductStats() {
  return useQuery<PaginatedResponse<Product>, AxiosError>({
    queryKey: ['dashboard-products'],
    queryFn: () =>
      api.get('/products/', { params: { page_size: 100 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useCustomerStats() {
  return useQuery<PaginatedResponse<Customer>, AxiosError>({
    queryKey: ['dashboard-customers'],
    queryFn: () =>
      api.get('/customers/', { params: { page_size: 100 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
