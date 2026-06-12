import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { ShipmentProductForm } from '@/components/shipments/shipment-product-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { ShipmentProduct } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

// ShipmentProductForm calls useProductsList
const productsHandler = http.get(`${BASE}/products/`, () =>
  HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
);

const existingProduct: ShipmentProduct = {
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
  server.use(productsHandler);
});

// ─── render ───────────────────────────────────────────────────────────────────

describe('ShipmentProductForm — render', () => {
  it('renders "Agregar producto" in add mode', () => {
    renderWithQuery(<ShipmentProductForm shipmentId={5} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /agregar producto/i })).toBeTruthy();
  });

  it('renders "Actualizar producto" in edit mode', () => {
    renderWithQuery(
      <ShipmentProductForm shipmentId={5} defaultValues={existingProduct} onSuccess={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /actualizar producto/i })).toBeTruthy();
  });
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('ShipmentProductForm — validation', () => {
  it('shows error when unit_price is non-numeric', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ShipmentProductForm shipmentId={5} onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. 2500000.00'), 'caro');
    await user.click(screen.getByRole('button', { name: /agregar producto/i }));

    await waitFor(() => {
      expect(screen.getByText('Debe ser un número positivo')).toBeTruthy();
    });
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('ShipmentProductForm — edit', () => {
  it('calls PATCH /shipments/{shipmentId}/products/{productId}/', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/shipments/5/products/2/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingProduct, quantity: 10 });
      }),
    );

    renderWithQuery(
      <ShipmentProductForm shipmentId={5} defaultValues={existingProduct} onSuccess={vi.fn()} />,
    );

    const priceInput = screen.getByPlaceholderText('Ej. 2500000.00');
    await user.clear(priceInput);
    await user.type(priceInput, '3000000.00');
    await user.click(screen.getByRole('button', { name: /actualizar producto/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/shipments/5/products/2/');
    });
  });
});
