import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { WarehouseForm } from '@/components/warehouses/warehouse-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Warehouse } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingWarehouse: Warehouse = {
  id: 3,
  manager: null,
  name: 'Old Warehouse',
  code: 'OLD-01',
  address: 'Old Address',
  city: 'Old City',
  country: 'Perú',
  latitude: null,
  longitude: null,
  capacity_m3: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('WarehouseForm — validation', () => {
  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /crear almacén/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeTruthy();
    });
  });

  it('shows error when code is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Nombre del almacén'), 'Test Warehouse');
    await user.click(screen.getByRole('button', { name: /crear almacén/i }));
    await waitFor(() => {
      expect(screen.getByText('El código es requerido')).toBeTruthy();
    });
  });

  it('shows error when address is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Nombre del almacén'), 'Test Warehouse');
    await user.type(screen.getByPlaceholderText('BOG-01'), 'BOG-01');
    await user.click(screen.getByRole('button', { name: /crear almacén/i }));
    await waitFor(() => {
      expect(screen.getByText('La dirección es requerida')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('WarehouseForm — create', () => {
  it('calls POST /warehouses/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingWarehouse, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<WarehouseForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Nombre del almacén'), 'New Warehouse');
    await user.type(screen.getByPlaceholderText('BOG-01'), 'MED-01');
    await user.type(screen.getByPlaceholderText('Dirección del almacén'), 'Av. 123');
    await user.type(screen.getByPlaceholderText('Ciudad'), 'Medellín');
    await user.click(screen.getByRole('button', { name: /crear almacén/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).name).toBe('New Warehouse');
    expect((capturedBody as any).code).toBe('MED-01');
    expect((capturedBody as any).address).toBe('Av. 123');
    expect((capturedBody as any).city).toBe('Medellín');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('WarehouseForm — edit', () => {
  it('renders "Actualizar almacén" button in edit mode', () => {
    renderWithQuery(<WarehouseForm defaultValues={existingWarehouse} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar almacén/i })).toBeTruthy();
  });

  it('calls PATCH /warehouses/{id}/ on submit', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/warehouses/3/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingWarehouse, name: 'Updated Warehouse' });
      }),
    );

    renderWithQuery(<WarehouseForm defaultValues={existingWarehouse} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Nombre del almacén');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Warehouse');
    await user.click(screen.getByRole('button', { name: /actualizar almacén/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/warehouses/3/');
    });
  });
});
