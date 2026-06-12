import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { ShipmentEditForm } from '@/components/shipments/shipment-edit-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Shipment } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const emptyPageResponse = { count: 0, next: null, previous: null, results: [] };

const existingShipment: Shipment = {
  id: 1,
  tracking_code: 'LOG-2024-0001',
  customer: { id: 1, name: 'Cliente Test', customer_type: 'COMPANY' },
  origin_warehouse: { id: 1, code: 'BOG-01', name: 'Bodega Bogotá', city: 'Bogotá' },
  route: null,
  vehicle: null,
  status: 'PENDING',
  priority: 'NORMAL',
  origin_address: 'Calle 123',
  destination_address: 'Av. 456',
  destination_city: 'Medellín',
  destination_country: 'Colombia',
  recipient_name: 'Juan García',
  recipient_phone: null,
  scheduled_date: '2024-06-15',
  estimated_delivery: null,
  actual_delivery: null,
  total_weight_kg: '0.00',
  total_volume_m3: null,
  base_cost: '0.00',
  tax_amount: '0.00',
  total_cost: '0.00',
  notes: null,
  shipment_products: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ShipmentEditForm calls useRoutesList and useVehiclesList
beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  server.use(
    http.get(`${BASE}/routes/`, () => HttpResponse.json(emptyPageResponse)),
    http.get(`${BASE}/vehicles/`, () => HttpResponse.json(emptyPageResponse)),
  );
});

// ─── render ───────────────────────────────────────────────────────────────────

describe('ShipmentEditForm — render', () => {
  it('renders "Actualizar envío" button', () => {
    renderWithQuery(<ShipmentEditForm defaultValues={existingShipment} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar envío/i })).toBeTruthy();
  });
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('ShipmentEditForm — validation', () => {
  it('shows error when base_cost is invalid', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ShipmentEditForm defaultValues={existingShipment} onSuccess={vi.fn()} />);

    const baseCostInput = screen.getByPlaceholderText('Ej. 150000.00');
    await user.clear(baseCostInput);
    await user.type(baseCostInput, 'abc');
    await user.click(screen.getByRole('button', { name: /actualizar envío/i }));

    await waitFor(() => {
      expect(screen.getByText('Debe ser un número positivo')).toBeTruthy();
    });
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('ShipmentEditForm — edit', () => {
  it('calls PATCH /shipments/{id}/ on submit with default values', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/shipments/1/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingShipment, status: 'CONFIRMED' });
      }),
    );

    renderWithQuery(<ShipmentEditForm defaultValues={existingShipment} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /actualizar envío/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/shipments/1/');
    });
  });
});
