import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useVehiclesList,
} from '@/hooks/use-vehicles';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Vehicle, PaginatedResponse } from '@/docs/schemas';
import type { VehicleListItem } from '@/hooks/use-vehicles';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockVehicle: Vehicle = {
  id: 1,
  driver: null,
  plate: 'ABC-123',
  vehicle_type: 'VAN',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2022,
  capacity_kg: '1500.00',
  capacity_m3: null,
  fuel_type: 'DIESEL',
  status: 'AVAILABLE',
  last_maintenance: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockListItem: VehicleListItem = {
  id: 1,
  plate: 'ABC-123',
  vehicle_type: 'VAN',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2022,
  status: 'AVAILABLE',
};

const mockPage: PaginatedResponse<VehicleListItem> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockListItem],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useVehicles ──────────────────────────────────────────────────────────────

describe('useVehicles', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/vehicles/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useVehicles({ page: 1, page_size: 20 }));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].plate).toBe('ABC-123');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/vehicles/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useVehicles({ search: 'abc', page: 2, page_size: 10 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=abc');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=10');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/vehicles/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useVehicles({ page: 1, page_size: 20, ordering: '-year' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=-year');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/vehicles/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useVehicles({ page: 1, page_size: 20 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useVehicle ───────────────────────────────────────────────────────────────

describe('useVehicle', () => {
  it('fetches single vehicle by id', async () => {
    server.use(http.get(`${BASE}/vehicles/1/`, () => HttpResponse.json(mockVehicle)));
    const { result } = renderHookWithQuery(() => useVehicle(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plate).toBe('ABC-123');
    expect(result.current.data?.brand).toBe('Toyota');
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useVehicle(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateVehicle ─────────────────────────────────────────────────────────

describe('useCreateVehicle', () => {
  it('POST /vehicles/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/vehicles/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockVehicle, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateVehicle());
    result.current.mutate({
      plate: 'XYZ-999',
      vehicle_type: 'TRUCK',
      brand: 'Ford',
      model: 'F-150',
      year: 2023,
      capacity_kg: '2000.00',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).plate).toBe('XYZ-999');
    expect((capturedBody as any).vehicle_type).toBe('TRUCK');
  });

  it('invalidates ["vehicles"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/vehicles/`, async () =>
        HttpResponse.json({ ...mockVehicle, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateVehicle());
    result.current.mutate({ plate: 'X', vehicle_type: 'VAN', brand: 'X', model: 'X', year: 2020, capacity_kg: '100' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['vehicles'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/vehicles/`, async () =>
        HttpResponse.json({ ...mockVehicle, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateVehicle(onSuccess));
    result.current.mutate({ plate: 'CB', vehicle_type: 'VAN', brand: 'CB', model: 'CB', year: 2021, capacity_kg: '100' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/vehicles/`, () =>
        HttpResponse.json({ plate: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateVehicle());
    result.current.mutate({ plate: 'DUP', vehicle_type: 'VAN', brand: 'X', model: 'X', year: 2020, capacity_kg: '100' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateVehicle ─────────────────────────────────────────────────────────

describe('useUpdateVehicle', () => {
  it('PATCH /vehicles/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/vehicles/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockVehicle, status: 'IN_USE' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateVehicle());
    result.current.mutate({ id: 1, data: { status: 'IN_USE' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/vehicles/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['vehicles'] });
  });
});

// ─── useDeleteVehicle ─────────────────────────────────────────────────────────

describe('useDeleteVehicle', () => {
  it('DELETE /vehicles/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/vehicles/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteVehicle());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/vehicles/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['vehicles'] });
  });
});

// ─── useVehiclesList ──────────────────────────────────────────────────────────

describe('useVehiclesList', () => {
  it('requests page_size=100 and ordering=plate', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/vehicles/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useVehiclesList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=plate');
  });
});
