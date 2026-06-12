import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useAddShipmentProduct,
  useUpdateShipmentProduct,
  useRemoveShipmentProduct,
} from '@/hooks/use-shipment-products';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { ShipmentProduct } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockShipmentProduct: ShipmentProduct = {
  id: 2,
  product: { id: 3, sku: 'LAP-001', name: 'Laptop Pro' },
  quantity: 5,
  unit_price: '2500000.00',
  line_total: '12500000.00',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useAddShipmentProduct ────────────────────────────────────────────────────

describe('useAddShipmentProduct', () => {
  it('POST /shipments/{shipmentId}/products/ with correct body', async () => {
    let capturedBody: unknown;
    let capturedUrl = '';
    server.use(
      http.post(`${BASE}/shipments/5/products/`, async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockShipmentProduct, id: 10 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useAddShipmentProduct());
    result.current.mutate({
      shipmentId: 5,
      data: { product: 3, quantity: 2, unit_price: '2500000.00' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/shipments/5/products/');
    expect((capturedBody as any).product).toBe(3);
    expect((capturedBody as any).quantity).toBe(2);
  });

  it('invalidates ["shipments", shipmentId] on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/shipments/5/products/`, async () =>
        HttpResponse.json({ ...mockShipmentProduct, id: 11 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useAddShipmentProduct());
    result.current.mutate({
      shipmentId: 5,
      data: { product: 3, quantity: 1, unit_price: '1000.00' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 5] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/shipments/5/products/`, async () =>
        HttpResponse.json({ ...mockShipmentProduct, id: 12 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useAddShipmentProduct(onSuccess));
    result.current.mutate({
      shipmentId: 5,
      data: { product: 3, quantity: 1, unit_price: '1000.00' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error (duplicate product)', async () => {
    server.use(
      http.post(`${BASE}/shipments/5/products/`, () =>
        HttpResponse.json(
          { product: ['Este producto ya está registrado en este envío.'] },
          { status: 400 },
        ),
      ),
    );
    const { result } = renderHookWithQuery(() => useAddShipmentProduct());
    result.current.mutate({
      shipmentId: 5,
      data: { product: 3, quantity: 1, unit_price: '1000.00' },
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateShipmentProduct ─────────────────────────────────────────────────

describe('useUpdateShipmentProduct', () => {
  it('PATCH /shipments/{shipmentId}/products/{productId}/ and invalidates detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/shipments/5/products/2/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockShipmentProduct, quantity: 10 });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateShipmentProduct());
    result.current.mutate({ shipmentId: 5, productId: 2, data: { quantity: 10 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/shipments/5/products/2/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 5] });
  });
});

// ─── useRemoveShipmentProduct ─────────────────────────────────────────────────

describe('useRemoveShipmentProduct', () => {
  it('DELETE /shipments/{shipmentId}/products/{productId}/ and invalidates detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/shipments/5/products/2/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useRemoveShipmentProduct());
    result.current.mutate({ shipmentId: 5, productId: 2 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/shipments/5/products/2/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 5] });
  });
});
