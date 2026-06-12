import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useRoutes,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useRoutesList,
} from '@/hooks/use-routes';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Route, PaginatedResponse } from '@/docs/schemas';
import type { RouteListItem } from '@/hooks/use-routes';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockRoute: Route = {
  id: 1,
  name: 'Lima - Arequipa',
  code: 'LIM-AQP-01',
  origin_city: 'Lima',
  destination_city: 'Arequipa',
  distance_km: '1008.00',
  estimated_hours: '14.00',
  is_active: true,
  stops: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockListItem: RouteListItem = {
  id: 1,
  code: 'LIM-AQP-01',
  name: 'Lima - Arequipa',
  origin_city: 'Lima',
  destination_city: 'Arequipa',
  is_active: true,
};

const mockPage: PaginatedResponse<RouteListItem> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockListItem],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useRoutes ────────────────────────────────────────────────────────────────

describe('useRoutes', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useRoutes({ page: 1, page_size: 20 }));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].code).toBe('LIM-AQP-01');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useRoutes({ search: 'lima', page: 2, page_size: 10 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=lima');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=10');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useRoutes({ page: 1, page_size: 20, ordering: 'code' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=code');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/routes/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useRoutes({ page: 1, page_size: 20 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useRoute ─────────────────────────────────────────────────────────────────

describe('useRoute', () => {
  it('fetches single route by id', async () => {
    server.use(http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute)));
    const { result } = renderHookWithQuery(() => useRoute(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.code).toBe('LIM-AQP-01');
    expect(result.current.data?.origin_city).toBe('Lima');
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useRoute(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateRoute ───────────────────────────────────────────────────────────

describe('useCreateRoute', () => {
  it('POST /routes/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/routes/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockRoute, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateRoute());
    result.current.mutate({
      name: 'Bogotá - Medellín',
      code: 'BOG-MED-01',
      origin_city: 'Bogotá',
      destination_city: 'Medellín',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).code).toBe('BOG-MED-01');
    expect((capturedBody as any).origin_city).toBe('Bogotá');
  });

  it('invalidates ["routes"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/routes/`, async () =>
        HttpResponse.json({ ...mockRoute, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateRoute());
    result.current.mutate({ name: 'X', code: 'X', origin_city: 'A', destination_city: 'B' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/routes/`, async () =>
        HttpResponse.json({ ...mockRoute, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateRoute(onSuccess));
    result.current.mutate({ name: 'CB', code: 'CB', origin_city: 'A', destination_city: 'B' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/routes/`, () =>
        HttpResponse.json({ code: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateRoute());
    result.current.mutate({ name: 'Dup', code: 'DUP', origin_city: 'A', destination_city: 'B' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateRoute ───────────────────────────────────────────────────────────

describe('useUpdateRoute', () => {
  it('PATCH /routes/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/routes/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockRoute, is_active: false });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateRoute());
    result.current.mutate({ id: 1, data: { is_active: false } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/routes/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] });
  });
});

// ─── useDeleteRoute ───────────────────────────────────────────────────────────

describe('useDeleteRoute', () => {
  it('DELETE /routes/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/routes/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteRoute());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/routes/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] });
  });
});

// ─── useRoutesList ────────────────────────────────────────────────────────────

describe('useRoutesList', () => {
  it('requests page_size=100 and ordering=name', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useRoutesList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=name');
  });
});
