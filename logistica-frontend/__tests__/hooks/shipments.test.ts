import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useShipments,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
} from '@/hooks/use-shipments';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Shipment } from '@/docs/schemas';
import type { ShipmentListItem } from '@/hooks/use-shipments';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockListItem: ShipmentListItem = {
  id: 1,
  tracking_code: 'LOG-2024-0001',
  customer: { id: 1, name: 'Cliente Test', customer_type: 'COMPANY' },
  status: 'PENDING',
  priority: 'NORMAL',
  destination_city: 'Medellín',
  scheduled_date: '2024-06-15',
  total_cost: '500000.00',
};

const mockShipment: Shipment = {
  id: 1,
  tracking_code: 'LOG-2024-0001',
  customer: { id: 1, name: 'Cliente Test', customer_type: 'COMPANY' },
  origin_warehouse: { id: 1, code: 'BOG-01', name: 'Bodega Bogotá', city: 'Bogotá' },
  route: null,
  vehicle: null,
  status: 'PENDING',
  priority: 'NORMAL',
  origin_address: 'Calle 123, Bogotá',
  destination_address: 'Av. 456, Medellín',
  destination_city: 'Medellín',
  destination_country: 'Colombia',
  recipient_name: 'Juan García',
  recipient_phone: null,
  scheduled_date: '2024-06-15',
  estimated_delivery: null,
  actual_delivery: null,
  total_weight_kg: '0.00',
  total_volume_m3: null,
  base_cost: '0.00',
  tax_amount: '0.00',
  total_cost: '0.00',
  notes: null,
  shipment_products: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useShipments ─────────────────────────────────────────────────────────────

describe('useShipments', () => {
  it('GET /shipments/ returns paginated list', async () => {
    server.use(
      http.get(`${BASE}/shipments/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [mockListItem] }),
      ),
    );
    const { result } = renderHookWithQuery(() =>
      useShipments({ page: 1, page_size: 20 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].tracking_code).toBe('LOG-2024-0001');
  });

  it('passes search param to API', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useShipments({ page: 1, page_size: 20, search: 'LOG-2024' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=LOG-2024');
  });
});

// ─── useShipment ──────────────────────────────────────────────────────────────

describe('useShipment', () => {
  it('GET /shipments/{id}/ returns full shipment', async () => {
    server.use(
      http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment)),
    );
    const { result } = renderHookWithQuery(() => useShipment(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tracking_code).toBe('LOG-2024-0001');
    expect(result.current.data?.shipment_products).toHaveLength(0);
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useShipment(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateShipment ────────────────────────────────────────────────────────

describe('useCreateShipment', () => {
  it('POST /shipments/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/shipments/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockShipment, id: 5 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateShipment());
    result.current.mutate({
      customer: 1,
      origin_warehouse: 1,
      origin_address: 'Calle 123',
      destination_address: 'Av. 456',
      destination_city: 'Medellín',
      recipient_name: 'Juan García',
      scheduled_date: '2024-06-15',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).customer).toBe(1);
    expect((capturedBody as any).recipient_name).toBe('Juan García');
  });

  it('invalidates ["shipments"] on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/shipments/`, async () =>
        HttpResponse.json({ ...mockShipment, id: 6 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateShipment());
    result.current.mutate({
      customer: 1,
      origin_warehouse: 1,
      origin_address: 'Calle 123',
      destination_address: 'Av. 456',
      destination_city: 'Medellín',
      recipient_name: 'Juan García',
      scheduled_date: '2024-06-15',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/shipments/`, async () =>
        HttpResponse.json({ ...mockShipment, id: 7 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateShipment(onSuccess));
    result.current.mutate({
      customer: 1,
      origin_warehouse: 1,
      origin_address: 'Calle 123',
      destination_address: 'Av. 456',
      destination_city: 'Medellín',
      recipient_name: 'Juan García',
      scheduled_date: '2024-06-15',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/shipments/`, () =>
        HttpResponse.json({ customer: ['Cliente inválido.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateShipment());
    result.current.mutate({
      customer: 999,
      origin_warehouse: 1,
      origin_address: 'x',
      destination_address: 'y',
      destination_city: 'z',
      recipient_name: 'Test',
      scheduled_date: '2024-06-15',
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateShipment ────────────────────────────────────────────────────────

describe('useUpdateShipment', () => {
  it('PATCH /shipments/{id}/ and invalidates list and detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/shipments/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockShipment, status: 'CONFIRMED' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateShipment());
    result.current.mutate({ id: 1, data: { status: 'CONFIRMED' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/shipments/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 1] });
  });
});

// ─── useDeleteShipment ────────────────────────────────────────────────────────

describe('useDeleteShipment', () => {
  it('DELETE /shipments/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/shipments/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteShipment());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/shipments/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] });
  });
});
