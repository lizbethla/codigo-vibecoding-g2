import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { ProductForm } from '@/components/products/product-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Product } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

// ProductForm calls useSuppliersList internally — always need this handler
const suppliersHandler = http.get(`${BASE}/suppliers/`, () =>
  HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
);

const existingProduct: Product = {
  id: 4,
  supplier: null,
  sku: 'OLD-001',
  name: 'Old Product',
  description: null,
  category: 'TABLET',
  unit_price: '200.00',
  weight_kg: '0.50',
  dimensions_cm: null,
  stock_quantity: 5,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  server.use(suppliersHandler);
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('ProductForm — validation', () => {
  it('shows error when sku is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Nombre del producto'), 'My Product');
    await user.type(screen.getByPlaceholderText('Ej. 1500.00'), '100.00');
    await user.click(screen.getByRole('button', { name: /crear producto/i }));
    await waitFor(() => {
      expect(screen.getByText('El SKU es requerido')).toBeTruthy();
    });
  });

  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. PROD-001'), 'SKU-001');
    await user.type(screen.getByPlaceholderText('Ej. 1500.00'), '100.00');
    await user.click(screen.getByRole('button', { name: /crear producto/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeTruthy();
    });
  });

  it('shows error when unit_price is invalid', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. PROD-001'), 'SKU-001');
    await user.type(screen.getByPlaceholderText('Nombre del producto'), 'My Product');
    await user.type(screen.getByPlaceholderText('Ej. 1500.00'), 'abc');
    await user.click(screen.getByRole('button', { name: /crear producto/i }));
    await waitFor(() => {
      expect(screen.getByText('Debe ser un número positivo')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('ProductForm — create', () => {
  it('calls POST /products/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingProduct, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<ProductForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Ej. PROD-001'), 'NEW-001');
    await user.type(screen.getByPlaceholderText('Nombre del producto'), 'New Laptop');
    await user.type(screen.getByPlaceholderText('Ej. 1500.00'), '999.00');
    await user.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).sku).toBe('NEW-001');
    expect((capturedBody as any).name).toBe('New Laptop');
    expect((capturedBody as any).unit_price).toBe('999.00');
    expect((capturedBody as any).category).toBe('LAPTOP');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('ProductForm — edit', () => {
  it('renders "Actualizar producto" button in edit mode', () => {
    renderWithQuery(<ProductForm defaultValues={existingProduct} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar producto/i })).toBeTruthy();
  });

  it('calls PATCH /products/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/products/4/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingProduct, name: 'Updated Product' });
      }),
    );

    renderWithQuery(<ProductForm defaultValues={existingProduct} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Nombre del producto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Product');
    await user.click(screen.getByRole('button', { name: /actualizar producto/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/products/4/');
    });
  });
});
