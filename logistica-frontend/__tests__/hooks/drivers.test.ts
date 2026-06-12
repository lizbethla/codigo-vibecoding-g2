import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useDrivers,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useDriversList,
} from '@/hooks/use-drivers';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Driver, PaginatedResponse } from '@/docs/schemas';
import type { DriverListItem } from '@/hooks/use-drivers';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockDriver: Driver = {
  id: 1,
  user: { id: 10, username: 'jperez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@co.com' },
  license_number: 'LIC-12345',
  license_type: 'C',
  license_expiry: '2027-06-01',
  phone: '+57 300 000 0000',
  status: 'AVAILABLE',
  date_of_birth: null,
  national_id: '1000000001',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockListItem: DriverListItem = {
  id: 1,
  user: { id: 10, username: 'jperez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@co.com' },
  license_type: 'C',
  status: 'AVAILABLE',
  national_id: '1000000001',
};

const mockPage: PaginatedResponse<DriverListItem> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockListItem],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useDrivers ───────────────────────────────────────────────────────────────

describe('useDrivers', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useDrivers({ page: 1, page_size: 20 }));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].national_id).toBe('1000000001');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useDrivers({ search: 'juan', page: 2, page_size: 10 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=juan');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=10');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useDrivers({ page: 1, page_size: 20, ordering: '-license_expiry' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=-license_expiry');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/drivers/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useDrivers({ page: 1, page_size: 20 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useDriver ────────────────────────────────────────────────────────────────

describe('useDriver', () => {
  it('fetches single driver by id', async () => {
    server.use(http.get(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver)));
    const { result } = renderHookWithQuery(() => useDriver(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.license_number).toBe('LIC-12345');
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useDriver(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateDriver ──────────────────────────────────────────────────────────

describe('useCreateDriver', () => {
  it('POST /drivers/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockDriver, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateDriver());
    result.current.mutate({
      user: 5,
      license_number: 'LIC-99999',
      license_type: 'B',
      license_expiry: '2028-01-01',
      phone: '+57 311 111 1111',
      national_id: '9999999999',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).license_number).toBe('LIC-99999');
    expect((capturedBody as any).user).toBe(5);
  });

  it('invalidates ["drivers"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/drivers/`, async () =>
        HttpResponse.json({ ...mockDriver, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateDriver());
    result.current.mutate({
      user: 1,
      license_number: 'X',
      license_type: 'A',
      license_expiry: '2028-01-01',
      phone: '+1',
      national_id: '123',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/drivers/`, async () =>
        HttpResponse.json({ ...mockDriver, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateDriver(onSuccess));
    result.current.mutate({
      user: 2,
      license_number: 'CB',
      license_type: 'C',
      license_expiry: '2028-01-01',
      phone: '+2',
      national_id: '456',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/drivers/`, () =>
        HttpResponse.json({ national_id: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateDriver());
    result.current.mutate({
      user: 3,
      license_number: 'DUP',
      license_type: 'B',
      license_expiry: '2028-01-01',
      phone: '+3',
      national_id: 'DUP-ID',
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateDriver ──────────────────────────────────────────────────────────

describe('useUpdateDriver', () => {
  it('PATCH /drivers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/drivers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockDriver, status: 'ON_ROUTE' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateDriver());
    result.current.mutate({ id: 1, data: { status: 'ON_ROUTE' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/drivers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] });
  });
});

// ─── useDeleteDriver ──────────────────────────────────────────────────────────

describe('useDeleteDriver', () => {
  it('DELETE /drivers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/drivers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteDriver());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/drivers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] });
  });
});

// ─── useDriversList ───────────────────────────────────────────────────────────

describe('useDriversList', () => {
  it('requests page_size=100 and ordering=status', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useDriversList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=status');
  });
});
