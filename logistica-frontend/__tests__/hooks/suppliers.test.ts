import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useSuppliers,
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useSuppliersList,
} from '@/hooks/use-suppliers';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Supplier, PaginatedResponse } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockSupplier: Supplier = {
  id: 1,
  name: 'Tech Supplies S.A.',
  contact_name: 'Ana Gómez',
  email: 'ventas@techsupplies.com',
  phone: '+57 300 111 2222',
  address: 'Av. Tecnología 100',
  city: 'Medellín',
  country: 'Perú',
  tax_id: '900-111-222',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPage: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSupplier],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useSuppliers ─────────────────────────────────────────────────────────────

describe('useSuppliers', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useSuppliers({}));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].name).toBe('Tech Supplies S.A.');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useSuppliers({ search: 'tech', page: 3, page_size: 5 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=tech');
    expect(capturedUrl).toContain('page=3');
    expect(capturedUrl).toContain('page_size=5');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useSuppliers({ ordering: '-created_at' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=-created_at');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/suppliers/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useSuppliers({}));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useSupplier ──────────────────────────────────────────────────────────────

describe('useSupplier', () => {
  it('fetches single supplier by id', async () => {
    server.use(http.get(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier)));
    const { result } = renderHookWithQuery(() => useSupplier(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.contact_name).toBe('Ana Gómez');
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHookWithQuery(() => useSupplier(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateSupplier ────────────────────────────────────────────────────────

describe('useCreateSupplier', () => {
  it('POST /suppliers/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockSupplier, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateSupplier());
    result.current.mutate({ name: 'New Supplier', email: 'new@supplier.com', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).name).toBe('New Supplier');
    expect((capturedBody as any).email).toBe('new@supplier.com');
  });

  it('invalidates ["suppliers"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/suppliers/`, async () =>
        HttpResponse.json({ ...mockSupplier, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateSupplier());
    result.current.mutate({ name: 'X', email: 'x@x.com', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/suppliers/`, async () =>
        HttpResponse.json({ ...mockSupplier, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateSupplier(onSuccess));
    result.current.mutate({ name: 'CB', email: 'cb@sup.com', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/suppliers/`, () =>
        HttpResponse.json({ email: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateSupplier());
    result.current.mutate({ name: 'Dup', email: 'dup@sup.com', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateSupplier ────────────────────────────────────────────────────────

describe('useUpdateSupplier', () => {
  it('PATCH /suppliers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/suppliers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockSupplier, name: 'Updated' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateSupplier());
    result.current.mutate({ id: 1, data: { name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/suppliers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] });
  });
});

// ─── useDeleteSupplier ────────────────────────────────────────────────────────

describe('useDeleteSupplier', () => {
  it('DELETE /suppliers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/suppliers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteSupplier());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/suppliers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] });
  });
});

// ─── useSuppliersList ─────────────────────────────────────────────────────────

describe('useSuppliersList', () => {
  it('requests page_size=100 and ordering=name', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useSuppliersList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=name');
  });
});
