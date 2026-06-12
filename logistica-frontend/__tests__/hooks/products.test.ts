import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductsList,
} from '@/hooks/use-products';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Product, PaginatedResponse } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockProduct: Product = {
  id: 1,
  supplier: { id: 2, name: 'Tech Supplies S.A.' },
  sku: 'PROD-001',
  name: 'Laptop Pro 15',
  description: null,
  category: 'LAPTOP',
  unit_price: '1500.00',
  weight_kg: '2.00',
  dimensions_cm: '35x24x2',
  stock_quantity: 10,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPage: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockProduct],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useProducts ──────────────────────────────────────────────────────────────

describe('useProducts', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/products/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useProducts({}));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].sku).toBe('PROD-001');
  });

  it('sends search, page, page_size params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useProducts({ search: 'laptop', page: 2, page_size: 5 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=laptop');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=5');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useProducts({ ordering: '-unit_price' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=-unit_price');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/products/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useProducts({}));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useCreateProduct ─────────────────────────────────────────────────────────

describe('useCreateProduct', () => {
  it('POST /products/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockProduct, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateProduct());
    result.current.mutate({ sku: 'NEW-001', name: 'New Product', category: 'DESKTOP', unit_price: '999.00' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).sku).toBe('NEW-001');
    expect((capturedBody as any).category).toBe('DESKTOP');
  });

  it('invalidates ["products"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/products/`, async () =>
        HttpResponse.json({ ...mockProduct, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateProduct());
    result.current.mutate({ sku: 'X', name: 'X', category: 'OTHER', unit_price: '1.00' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/products/`, async () =>
        HttpResponse.json({ ...mockProduct, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateProduct(onSuccess));
    result.current.mutate({ sku: 'CB', name: 'CB', category: 'OTHER', unit_price: '1.00' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/products/`, () =>
        HttpResponse.json({ sku: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateProduct());
    result.current.mutate({ sku: 'DUP', name: 'Dup', category: 'OTHER', unit_price: '1.00' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateProduct ─────────────────────────────────────────────────────────

describe('useUpdateProduct', () => {
  it('PATCH /products/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/products/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockProduct, name: 'Updated' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateProduct());
    result.current.mutate({ id: 1, data: { name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/products/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] });
  });
});

// ─── useDeleteProduct ─────────────────────────────────────────────────────────

describe('useDeleteProduct', () => {
  it('DELETE /products/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/products/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteProduct());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/products/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] });
  });
});

// ─── useProductsList ──────────────────────────────────────────────────────────

describe('useProductsList', () => {
  it('requests page_size=100 and ordering=name', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useProductsList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=name');
  });
});
