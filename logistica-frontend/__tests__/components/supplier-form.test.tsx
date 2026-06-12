import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { queryClient } from '@/lib/query-client';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { renderWithQuery } from '@/test/utils/renderWithQuery';
import type { Supplier } from '@/docs/schemas';

const BASE = 'http://127.0.0.1:8000/api/v1';

const existingSupplier: Supplier = {
  id: 5,
  name: 'Old Supplier',
  contact_name: 'Pedro',
  email: 'old@sup.com',
  phone: null,
  address: null,
  city: null,
  country: 'Perú',
  tax_id: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// ─── validation errors ────────────────────────────────────────────────────────

describe('SupplierForm — validation', () => {
  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /crear proveedor/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeTruthy();
    });
  });

  it('shows "Correo inválido" when email is empty on submit', async () => {
    // type="email" + non-empty invalid value triggers jsdom HTML5 constraint validation
    // before Zod runs. Use empty email: HTML5 allows empty, z.string().email() rejects it.
    const user = userEvent.setup({ delay: null });
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Nombre del proveedor'), 'My Supplier');
    // email field is empty by default — leave it empty
    await user.click(screen.getByRole('button', { name: /crear proveedor/i }));

    await waitFor(() => {
      expect(screen.getByText('Correo inválido')).toBeTruthy();
    });
  });
});

// ─── create mode ──────────────────────────────────────────────────────────────

describe('SupplierForm — create', () => {
  it('calls POST /suppliers/ with filled data', async () => {
    const user = userEvent.setup({ delay: null });
    const onSuccess = vi.fn();
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...existingSupplier, id: 10 }, { status: 201 });
      }),
    );

    renderWithQuery(<SupplierForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText('Nombre del proveedor'), 'New Supplier');
    await user.clear(screen.getByPlaceholderText('correo@ejemplo.com'));
    await user.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'new@supplier.com');
    await user.click(screen.getByRole('button', { name: /crear proveedor/i }));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect((capturedBody as any).name).toBe('New Supplier');
    expect((capturedBody as any).email).toBe('new@supplier.com');
  });
});

// ─── edit mode ────────────────────────────────────────────────────────────────

describe('SupplierForm — edit', () => {
  it('renders "Actualizar proveedor" button in edit mode', () => {
    renderWithQuery(<SupplierForm defaultValues={existingSupplier} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /actualizar proveedor/i })).toBeTruthy();
  });

  it('calls PATCH /suppliers/{id}/ on submit', async () => {
    const user = userEvent.setup({ delay: null });
    let capturedUrl = '';

    server.use(
      http.patch(`${BASE}/suppliers/5/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...existingSupplier, name: 'Updated Supplier' });
      }),
    );

    renderWithQuery(<SupplierForm defaultValues={existingSupplier} onSuccess={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Nombre del proveedor');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Supplier');
    await user.click(screen.getByRole('button', { name: /actualizar proveedor/i }));

    await waitFor(() => {
      expect(capturedUrl).toContain('/suppliers/5/');
    });
  });
});
