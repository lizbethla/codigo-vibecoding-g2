import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { ShipmentCreateForm } from '@/components/shipments/shipment-create-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';

const BASE = 'http://127.0.0.1:8000/api/v1';

// ShipmentCreateForm calls useCustomersList, useWarehousesList, useRoutesList, useVehiclesList
const emptyPageResponse = { count: 0, next: null, previous: null, results: [] };

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  server.use(
    http.get(`${BASE}/customers/`, () => HttpResponse.json(emptyPageResponse)),
    http.get(`${BASE}/warehouses/`, () => HttpResponse.json(emptyPageResponse)),
    http.get(`${BASE}/routes/`, () => HttpResponse.json(emptyPageResponse)),
    http.get(`${BASE}/vehicles/`, () => HttpResponse.json(emptyPageResponse)),
  );
});

// ─── render ───────────────────────────────────────────────────────────────────

describe('ShipmentCreateForm — render', () => {
  it('renders "Crear envío" button', () => {
    renderWithQuery(<ShipmentCreateForm onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /crear envío/i })).toBeTruthy();
  });
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('ShipmentCreateForm — validation', () => {
  it('shows error when origin_address is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ShipmentCreateForm onSuccess={vi.fn()} />);

    // fill other text fields but leave origin_address empty
    await user.type(screen.getByPlaceholderText('Ej. Carrera 15 # 30-40'), 'Av. 456');
    await user.type(screen.getByPlaceholderText('Ej. Arequipa'), 'Medellín');
    await user.type(screen.getByPlaceholderText('Ej. Juan García'), 'Juan García');
    await user.click(screen.getByRole('button', { name: /crear envío/i }));

    await waitFor(() => {
      expect(screen.getByText('La dirección de origen es requerida')).toBeTruthy();
    });
  });

  it('shows error when recipient_name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<ShipmentCreateForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. Av. Javier Prado 123, Lima'), 'Calle 123');
    await user.type(screen.getByPlaceholderText('Ej. Carrera 15 # 30-40'), 'Av. 456');
    await user.type(screen.getByPlaceholderText('Ej. Arequipa'), 'Medellín');
    await user.click(screen.getByRole('button', { name: /crear envío/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre del destinatario es requerido')).toBeTruthy();
    });
  });
});
