import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Vehicle } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

// VehicleForm calls useDriversList internally — always need this handler
const driversHandler = http.get(`${BASE}/drivers/`, () =>
  HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
);

const existingVehicle: Vehicle = {
  id: 6,
  driver: null,
  plate: 'OLD-001',
  vehicle_type: 'TRUCK',
  brand: 'Ford',
  model: 'F-350',
  year: 2020,
  capacity_kg: '3000.00',
  capacity_m3: null,
  fuel_type: 'DIESEL',
  status: 'AVAILABLE',
  last_maintenance: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  server.use(driversHandler);
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('VehicleForm — validation', () => {
  it('shows error when plate is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<VehicleForm onSuccess={vi.fn()} />);

    // fill all required except plate, then submit
    await user.type(screen.getByPlaceholderText('Ej. Toyota'), 'Honda');
    await user.type(screen.getByPlaceholderText('Ej. Hilux'), 'CRV');
    await user.type(screen.getByPlaceholderText('Ej. 1500'), '800');
    await user.click(screen.getByRole('button', { name: /crear vehículo/i }));
    await waitFor(() => {
      expect(screen.getByText('La placa es requerida')).toBeTruthy();
    });
  }, 10000);

  it('shows error when brand is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<VehicleForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. ABC-123'), 'XYZ-999');
    await user.type(screen.getByPlaceholderText('Ej. Hilux'), 'CRV');
    await user.type(screen.getByPlaceholderText('Ej. 1500'), '800');
    await user.click(screen.getByRole('button', { name: /crear vehículo/i }));
    await waitFor(() => {
      expect(screen.getByText('La marca es requerida')).toBeTruthy();
    });
  });

  it('shows error when capacity_kg is invalid on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<VehicleForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. ABC-123'), 'XYZ-999');
    await user.type(screen.getByPlaceholderText('Ej. Toyota'), 'Honda');
    await user.type(screen.getByPlaceholderText('Ej. Hilux'), 'CRV');
    await user.type(screen.getByPlaceholderText('Ej. 1500'), 'abc');
    await user.click(screen.getByRole('button', { name: /crear vehículo/i }));
    await waitFor(() => {
      expect(screen.getByText('Debe ser un número positivo')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('VehicleForm — create', () => {
  it('calls POST /vehicles/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/vehicles/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingVehicle, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<VehicleForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Ej. ABC-123'), 'NEW-999');
    await user.type(screen.getByPlaceholderText('Ej. Toyota'), 'Chevrolet');
    await user.type(screen.getByPlaceholderText('Ej. Hilux'), 'Express');
    await user.type(screen.getByPlaceholderText('Ej. 1500'), '1200.00');
    await user.click(screen.getByRole('button', { name: /crear vehículo/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).plate).toBe('NEW-999');
    expect((capturedBody as any).brand).toBe('Chevrolet');
    expect((capturedBody as any).model).toBe('Express');
    expect((capturedBody as any).capacity_kg).toBe('1200.00');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('VehicleForm — edit', () => {
  it('renders "Actualizar vehículo" button in edit mode', () => {
    renderWithQuery(<VehicleForm defaultValues={existingVehicle} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar vehículo/i })).toBeTruthy();
  });

  it('calls PATCH /vehicles/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/vehicles/6/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingVehicle, brand: 'Updated Brand' });
      }),
    );

    renderWithQuery(<VehicleForm defaultValues={existingVehicle} onSuccess={vi.fn()} />);

    const brandInput = screen.getByPlaceholderText('Ej. Toyota');
    await user.clear(brandInput);
    await user.type(brandInput, 'Updated Brand');
    await user.click(screen.getByRole('button', { name: /actualizar vehículo/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/vehicles/6/');
    });
  });
});
