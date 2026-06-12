import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { StopForm } from '@/components/routes/stop-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { RouteStop } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingStop: RouteStop = {
  id: 3,
  stop_name: 'Terminal Norte',
  order: 1,
  estimated_arrival_hours: null,
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('StopForm — validation', () => {
  it('shows error when stop_name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<StopForm routeId={5} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /agregar parada/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre de la parada es requerido')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('StopForm — create', () => {
  it('calls POST /routes/{routeId}/stops/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;
    let capturedUrl = '';

    server.use(
      http.post(`${BASE}/routes/5/stops/`, async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingStop, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<StopForm routeId={5} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Ej. Terminal Norte'), 'Parada Central');
    await user.click(screen.getByRole('button', { name: /agregar parada/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect(capturedUrl).toContain('/routes/5/stops/');
    expect((capturedBody as any).stop_name).toBe('Parada Central');
    expect((capturedBody as any).order).toBe(1);
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('StopForm — edit', () => {
  it('renders "Actualizar parada" button in edit mode', () => {
    renderWithQuery(<StopForm routeId={5} defaultValues={existingStop} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar parada/i })).toBeTruthy();
  });

  it('calls PATCH /routes/{routeId}/stops/{stopId}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/routes/5/stops/3/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingStop, stop_name: 'Updated Stop' });
      }),
    );

    renderWithQuery(<StopForm routeId={5} defaultValues={existingStop} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Ej. Terminal Norte');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Stop');
    await user.click(screen.getByRole('button', { name: /actualizar parada/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/routes/5/stops/3/');
    });
  });
});
