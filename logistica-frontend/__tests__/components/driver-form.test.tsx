import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { DriverForm } from '@/components/drivers/driver-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Driver } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingDriver: Driver = {
  id: 2,
  user: { id: 10, username: 'jperez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@co.com' },
  license_number: 'LIC-99999',
  license_type: 'B',
  license_expiry: '2027-01-01',
  phone: '+57 300 000 0000',
  status: 'AVAILABLE',
  date_of_birth: null,
  national_id: '1000000002',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// Helper: fill all required fields for a valid create submission
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Ej. 1'), '1');
  await user.type(screen.getByPlaceholderText('Ej. LIC-12345'), 'LIC-00001');
  await user.type(screen.getByPlaceholderText('Ej. +57 300 000 0000'), '+57 311 000 0000');
  await user.type(screen.getByPlaceholderText('Ej. 1000000000'), '9876543210');
  // license_expiry — date input, use type on its label-adjacent input
  const dateInputs = screen.getAllByDisplayValue('');
  // find the license_expiry input (type=date)
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  if (dateInput) await user.type(dateInput, '2027-12-31');
}

// ─── validation errors ────────────────────────────────────────────────────────

describe('DriverForm — validation', () => {
  it('shows error when license_number is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<DriverForm onSuccess={vi.fn()} />);

    // fill all except license_number
    await user.type(screen.getByPlaceholderText('Ej. 1'), '1');
    await user.type(screen.getByPlaceholderText('Ej. +57 300 000 0000'), '+57 311 000 0000');
    await user.type(screen.getByPlaceholderText('Ej. 1000000000'), '9876543210');
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) await user.type(dateInput, '2027-12-31');

    await user.click(screen.getByRole('button', { name: /crear conductor/i }));
    await waitFor(() => {
      expect(screen.getByText('El numero de licencia es requerido')).toBeTruthy();
    });
  });

  it('shows error when phone is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<DriverForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Ej. 1'), '1');
    await user.type(screen.getByPlaceholderText('Ej. LIC-12345'), 'LIC-001');
    await user.type(screen.getByPlaceholderText('Ej. 1000000000'), '9876543210');
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) await user.type(dateInput, '2027-12-31');

    await user.click(screen.getByRole('button', { name: /crear conductor/i }));
    await waitFor(() => {
      expect(screen.getByText('El telefono es requerido')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('DriverForm — create', () => {
  it('calls POST /drivers/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingDriver, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<DriverForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Ej. 1'), '5');
    await user.type(screen.getByPlaceholderText('Ej. LIC-12345'), 'LIC-NEW-01');
    await user.type(screen.getByPlaceholderText('Ej. +57 300 000 0000'), '+57 320 000 0000');
    await user.type(screen.getByPlaceholderText('Ej. 1000000000'), '5555555555');
    const dateInputs = document.querySelectorAll('input[type="date"]');
    // first date input is license_expiry
    await user.type(dateInputs[0] as HTMLElement, '2028-06-01');

    await user.click(screen.getByRole('button', { name: /crear conductor/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).user).toBe(5);
    expect((capturedBody as any).license_number).toBe('LIC-NEW-01');
    expect((capturedBody as any).phone).toBe('+57 320 000 0000');
    expect((capturedBody as any).national_id).toBe('5555555555');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('DriverForm — edit', () => {
  it('renders "Actualizar conductor" button in edit mode', () => {
    renderWithQuery(<DriverForm defaultValues={existingDriver} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar conductor/i })).toBeTruthy();
  });

  it('calls PATCH /drivers/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/drivers/2/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingDriver, phone: '+57 999 999 9999' });
      }),
    );

    renderWithQuery(<DriverForm defaultValues={existingDriver} onSuccess={vi.fn()} />);

    const phoneInput = screen.getByPlaceholderText('Ej. +57 300 000 0000');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+57 999 999 9999');
    await user.click(screen.getByRole('button', { name: /actualizar conductor/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/drivers/2/');
    });
  });
});
