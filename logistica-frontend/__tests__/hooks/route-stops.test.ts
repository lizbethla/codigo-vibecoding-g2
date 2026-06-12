import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { useCreateStop, useUpdateStop, useDeleteStop } from '@/hooks/use-route-stops';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { RouteStop } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockStop: RouteStop = {
  id: 1,
  stop_name: 'Terminal Norte',
  order: 1,
  estimated_arrival_hours: '2.50',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useCreateStop ────────────────────────────────────────────────────────────

describe('useCreateStop', () => {
  it('POST /routes/{routeId}/stops/ with correct body', async () => {
    let capturedBody: unknown;
    let capturedUrl = '';
    server.use(
      http.post(`${BASE}/routes/5/stops/`, async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockStop, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateStop());
    result.current.mutate({ routeId: 5, data: { stop_name: 'Terminal Sur', order: 2 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/routes/5/stops/');
    expect((capturedBody as any).stop_name).toBe('Terminal Sur');
    expect((capturedBody as any).order).toBe(2);
  });

  it('invalidates ["routes", routeId] on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/routes/5/stops/`, async () =>
        HttpResponse.json({ ...mockStop, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateStop());
    result.current.mutate({ routeId: 5, data: { stop_name: 'Parada X', order: 3 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 5] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/routes/5/stops/`, async () =>
        HttpResponse.json({ ...mockStop, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateStop(onSuccess));
    result.current.mutate({ routeId: 5, data: { stop_name: 'CB', order: 4 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error (duplicate order)', async () => {
    server.use(
      http.post(`${BASE}/routes/5/stops/`, () =>
        HttpResponse.json({ order: ['Ya existe una parada con este número de orden.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateStop());
    result.current.mutate({ routeId: 5, data: { stop_name: 'Dup', order: 1 } });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateStop ────────────────────────────────────────────────────────────

describe('useUpdateStop', () => {
  it('PATCH /routes/{routeId}/stops/{stopId}/ and invalidates detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/routes/5/stops/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockStop, stop_name: 'Updated' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateStop());
    result.current.mutate({ routeId: 5, stopId: 1, data: { stop_name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/routes/5/stops/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 5] });
  });
});

// ─── useDeleteStop ────────────────────────────────────────────────────────────

describe('useDeleteStop', () => {
  it('DELETE /routes/{routeId}/stops/{stopId}/ and invalidates detail', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/routes/5/stops/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteStop());
    result.current.mutate({ routeId: 5, stopId: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/routes/5/stops/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 5] });
  });
});
