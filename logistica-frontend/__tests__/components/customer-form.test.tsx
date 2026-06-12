import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { CustomerForm } from '@/components/customers/customer-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Customer } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingCustomer: Customer = {
  id: 7,
  name: 'Old Name',
  customer_type: 'COMPANY',
  tax_id: null,
  email: 'old@co.com',
  phone: null,
  address: null,
  city: null,
  country: 'Perú',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('CustomerForm — validation', () => {
  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /crear cliente/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeTruthy();
    });
  });

  it('shows "Correo inválido" when email is empty on submit', async () => {
    // type="email" + non-empty invalid value blocks jsdom's HTML5 constraint validation
    // before Zod can run. Use empty email instead: no required attr → HTML5 allows it,
    // but z.string().email() rejects empty string → Zod error shown.
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Nombre del cliente'), 'Test Company');
    // email field is empty by default — leave it empty
    await user.click(screen.getByRole('button', { name: /crear cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('Correo inválido')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('CustomerForm — create', () => {
  it('calls POST /customers/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/customers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingCustomer, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<CustomerForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Nombre del cliente'), 'New Corp');
    await user.clear(screen.getByPlaceholderText('correo@ejemplo.com'));
    await user.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'new@corp.com');
    await user.click(screen.getByRole('button', { name: /crear cliente/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).name).toBe('New Corp');
    expect((capturedBody as any).email).toBe('new@corp.com');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('CustomerForm — edit', () => {
  it('renders "Actualizar cliente" button in edit mode', () => {
    renderWithQuery(<CustomerForm defaultValues={existingCustomer} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar cliente/i })).toBeTruthy();
  });

  it('calls PATCH /customers/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/customers/7/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingCustomer, name: 'Updated Name' });
      }),
    );

    renderWithQuery(<CustomerForm defaultValues={existingCustomer} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Nombre del cliente');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    await user.click(screen.getByRole('button', { name: /actualizar cliente/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/customers/7/');
    });
  });
});
