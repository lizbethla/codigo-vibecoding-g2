import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useWarehousesList,
} from '@/hooks/use-warehouses';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Warehouse, WarehouseSummary, PaginatedResponse } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockWarehouse: Warehouse = {
  id: 1,
  manager: null,
  name: 'Almacén Central',
  code: 'BOG-01',
  address: 'Calle 1 # 2-3',
  city: 'Bogotá',
  country: 'Perú',
  latitude: null,
  longitude: null,
  capacity_m3: '500.00',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockSummary: WarehouseSummary = {
  id: 1,
  code: 'BOG-01',
  name: 'Almacén Central',
  city: 'Bogotá',
};

const mockPage: PaginatedResponse<WarehouseSummary> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSummary],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useWarehouses ────────────────────────────────────────────────────────────

describe('useWarehouses', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useWarehouses({}));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].code).toBe('BOG-01');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useWarehouses({ search: 'bog', page: 2, page_size: 10 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=bog');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=10');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useWarehouses({ ordering: 'city' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=city');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/warehouses/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useWarehouses({}));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useWarehouse ─────────────────────────────────────────────────────────────

describe('useWarehouse', () => {
  it('fetches single warehouse by id', async () => {
    server.use(http.get(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse)));
    const { result } = renderHookWithQuery(() => useWarehouse(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.code).toBe('BOG-01');
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useWarehouse(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateWarehouse ───────────────────────────────────────────────────────

describe('useCreateWarehouse', () => {
  it('POST /warehouses/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockWarehouse, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateWarehouse());
    result.current.mutate({ name: 'New Warehouse', code: 'MED-01', address: 'Av 1', city: 'Medellín' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).name).toBe('New Warehouse');
    expect((capturedBody as any).code).toBe('MED-01');
  });

  it('invalidates ["warehouses"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/warehouses/`, async () =>
        HttpResponse.json({ ...mockWarehouse, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateWarehouse());
    result.current.mutate({ name: 'X', code: 'X-01', address: 'Addr', city: 'City' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/warehouses/`, async () =>
        HttpResponse.json({ ...mockWarehouse, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateWarehouse(onSuccess));
    result.current.mutate({ name: 'CB', code: 'CB-01', address: 'Addr', city: 'City' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/warehouses/`, () =>
        HttpResponse.json({ code: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateWarehouse());
    result.current.mutate({ name: 'Dup', code: 'DUP-01', address: 'Addr', city: 'City' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateWarehouse ───────────────────────────────────────────────────────

describe('useUpdateWarehouse', () => {
  it('PATCH /warehouses/{id}/ and invalidates list and detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/warehouses/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockWarehouse, name: 'Updated' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateWarehouse());
    result.current.mutate({ id: 1, data: { name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/warehouses/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouse', 1] });
  });
});

// ─── useDeleteWarehouse ───────────────────────────────────────────────────────

describe('useDeleteWarehouse', () => {
  it('DELETE /warehouses/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/warehouses/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteWarehouse());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/warehouses/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] });
  });
});

// ─── useWarehousesList ────────────────────────────────────────────────────────

describe('useWarehousesList', () => {
  it('requests page_size=100 and ordering=name', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useWarehousesList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=name');
  });
});
