import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCustomersList,
} from '@/hooks/use-customers';
import { renderHookWithQuery } from '@/test/utils/renderWithQuery';
import type { Customer, PaginatedResponse } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const mockCustomer: Customer = {
  id: 1,
  name: 'Test Company S.A.',
  customer_type: 'COMPANY',
  tax_id: null,
  email: 'test@company.com',
  phone: null,
  address: null,
  city: null,
  country: 'Perú',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPage: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── useCustomers ─────────────────────────────────────────────────────────────

describe('useCustomers', () => {
  it('starts pending then resolves list', async () => {
    server.use(http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPage)));
    const { result } = renderHookWithQuery(() => useCustomers({}));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.results[0].name).toBe('Test Company S.A.');
  });

  it('sends search and page params in query string', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useCustomers({ search: 'acme', page: 2, page_size: 10 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('search=acme');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('page_size=10');
  });

  it('sends ordering param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useCustomers({ ordering: '-name' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('ordering=-name');
  });

  it('propagates 403 error', async () => {
    server.use(http.get(`${BASE}/customers/`, () => new HttpResponse(null, { status: 403 })));
    const { result } = renderHookWithQuery(() => useCustomers({}));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(403);
  });
});

// ─── useCustomer ──────────────────────────────────────────────────────────────

describe('useCustomer', () => {
  it('fetches single customer by id', async () => {
    server.use(http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer)));
    const { result } = renderHookWithQuery(() => useCustomer(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.email).toBe('test@company.com');
  });

  it('is disabled when id is undefined (idle status)', () => {
    const { result } = renderHookWithQuery(() => useCustomer(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useCreateCustomer ────────────────────────────────────────────────────────

describe('useCreateCustomer', () => {
  it('POST to /customers/ with correct body', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE}/customers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...mockCustomer, id: 2 }, { status: 201 });
      }),
    );
    const { result } = renderHookWithQuery(() => useCreateCustomer());
    result.current.mutate({ name: 'New Co', email: 'new@co.com', customer_type: 'COMPANY', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((capturedBody as any).name).toBe('New Co');
    expect((capturedBody as any).email).toBe('new@co.com');
  });

  it('invalidates ["customers"] queryKey on success', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.post(`${BASE}/customers/`, async () =>
        HttpResponse.json({ ...mockCustomer, id: 2 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateCustomer());
    result.current.mutate({ name: 'X', email: 'x@x.com', customer_type: 'COMPANY', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    server.use(
      http.post(`${BASE}/customers/`, async () =>
        HttpResponse.json({ ...mockCustomer, id: 3 }, { status: 201 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateCustomer(onSuccess));
    result.current.mutate({ name: 'Cb', email: 'cb@co.com', customer_type: 'INDIVIDUAL', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('surfaces 400 error', async () => {
    server.use(
      http.post(`${BASE}/customers/`, () =>
        HttpResponse.json({ email: ['Ya existe.'] }, { status: 400 }),
      ),
    );
    const { result } = renderHookWithQuery(() => useCreateCustomer());
    result.current.mutate({ name: 'X', email: 'dup@co.com', customer_type: 'COMPANY', is_active: true, country: 'Perú' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as any)?.response?.status).toBe(400);
  });
});

// ─── useUpdateCustomer ────────────────────────────────────────────────────────

describe('useUpdateCustomer', () => {
  it('PATCH /customers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.patch(`${BASE}/customers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockCustomer, name: 'Updated' });
      }),
    );
    const { result } = renderHookWithQuery(() => useUpdateCustomer());
    result.current.mutate({ id: 1, data: { name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/customers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] });
  });
});

// ─── useDeleteCustomer ────────────────────────────────────────────────────────

describe('useDeleteCustomer', () => {
  it('DELETE /customers/{id}/ and invalidates list', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    let capturedUrl = '';
    server.use(
      http.delete(`${BASE}/customers/1/`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHookWithQuery(() => useDeleteCustomer());
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('/customers/1/');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] });
  });
});

// ─── useCustomersList ─────────────────────────────────────────────────────────

describe('useCustomersList', () => {
  it('requests page_size=100 and ordering=name', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPage);
      }),
    );
    const { result } = renderHookWithQuery(() => useCustomersList());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page_size=100');
    expect(capturedUrl).toContain('ordering=name');
  });
});
