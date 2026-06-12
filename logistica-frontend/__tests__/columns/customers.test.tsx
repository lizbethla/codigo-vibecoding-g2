import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createCustomerColumns } from '@/components/customers/customers-columns';
import type { Customer } from '@/docs/schemas';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

// Minimal mock context — cells only use row.original
function ctx(customer: Customer): CellContext<Customer, unknown> {
  return {
    row: { original: customer, getValue: () => customer } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<Customer>, customer: Customer) {
  const cellFn = col.cell as (props: CellContext<Customer, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(customer))}</>);
}

function findCol(cols: ColumnDef<Customer>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onToggleActive: vi.fn(),
  onDelete: vi.fn(),
  setOrdering: vi.fn(),
  ordering: 'name',
};

const base: Customer = {
  id: 1,
  name: 'ACME Corp',
  customer_type: 'COMPANY',
  tax_id: null,
  email: 'acme@corp.com',
  phone: null,
  address: null,
  city: null,
  country: 'Perú',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ─── customer_type badge ──────────────────────────────────────────────────────

describe('customer_type column', () => {
  const cols = createCustomerColumns(mockActions);

  it('renders "Empresa" for COMPANY', () => {
    renderCell(findCol(cols, 'customer_type'), { ...base, customer_type: 'COMPANY' });
    expect(screen.getByText('Empresa')).toBeTruthy();
  });

  it('renders "Particular" for INDIVIDUAL', () => {
    renderCell(findCol(cols, 'customer_type'), { ...base, customer_type: 'INDIVIDUAL' });
    expect(screen.getByText('Particular')).toBeTruthy();
  });
});

// ─── is_active badge ──────────────────────────────────────────────────────────

describe('is_active column', () => {
  const cols = createCustomerColumns(mockActions);

  it('renders "Activo" when true', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: true });
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('renders "Inactivo" when false', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: false });
    expect(screen.getByText('Inactivo')).toBeTruthy();
  });
});

// ─── name column ─────────────────────────────────────────────────────────────

describe('name column', () => {
  it('renders customer name', () => {
    const cols = createCustomerColumns(mockActions);
    renderCell(findCol(cols, 'name'), base);
    expect(screen.getByText('ACME Corp')).toBeTruthy();
  });
});

// ─── actions column — permission gating ──────────────────────────────────────

describe('actions column', () => {
  it('returns null when canChange=false and canDelete=false', () => {
    const cols = createCustomerColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    const output = cellFn(ctx(base));
    expect(output).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createCustomerColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createCustomerColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
