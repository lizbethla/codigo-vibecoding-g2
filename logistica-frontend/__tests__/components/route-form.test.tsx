import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { RouteForm } from '@/components/routes/route-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Route } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingRoute: Route = {
  id: 7,
  name: 'Old Route',
  code: 'OLD-01',
  origin_city: 'Old City',
  destination_city: 'Other City',
  distance_km: null,
  estimated_hours: null,
  is_active: true,
  stops: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('RouteForm — validation', () => {
  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<RouteForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. LIM-AQP-01'), 'BOG-01');
    await user.type(screen.getByPlaceholderText('Ej. Lima'), 'Bogotá');
    await user.type(screen.getByPlaceholderText('Ej. Arequipa'), 'Medellín');
    await user.click(screen.getByRole('button', { name: /crear ruta/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeTruthy();
    });
  });

  it('shows error when origin_city is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<RouteForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. Lima - Arequipa'), 'Bogotá - Medellín');
    await user.type(screen.getByPlaceholderText('Ej. LIM-AQP-01'), 'BOG-MED-01');
    await user.type(screen.getByPlaceholderText('Ej. Arequipa'), 'Medellín');
    await user.click(screen.getByRole('button', { name: /crear ruta/i }));
    await waitFor(() => {
      expect(screen.getByText('La ciudad de origen es requerida')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('RouteForm — create', () => {
  it('calls POST /routes/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/routes/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingRoute, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<RouteForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Ej. Lima - Arequipa'), 'Bogotá - Medellín');
    await user.type(screen.getByPlaceholderText('Ej. LIM-AQP-01'), 'BOG-MED-01');
    await user.type(screen.getByPlaceholderText('Ej. Lima'), 'Bogotá');
    await user.type(screen.getByPlaceholderText('Ej. Arequipa'), 'Medellín');
    await user.click(screen.getByRole('button', { name: /crear ruta/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).name).toBe('Bogotá - Medellín');
    expect((capturedBody as any).code).toBe('BOG-MED-01');
    expect((capturedBody as any).origin_city).toBe('Bogotá');
    expect((capturedBody as any).destination_city).toBe('Medellín');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('RouteForm — edit', () => {
  it('renders "Actualizar ruta" button in edit mode', () => {
    renderWithQuery(<RouteForm defaultValues={existingRoute} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar ruta/i })).toBeTruthy();
  });

  it('calls PATCH /routes/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/routes/7/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingRoute, name: 'Updated Route' });
      }),
    );

    renderWithQuery(<RouteForm defaultValues={existingRoute} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Ej. Lima - Arequipa');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Route');
    await user.click(screen.getByRole('button', { name: /actualizar ruta/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/routes/7/');
    });
  });
});
