import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createSupplierColumns } from '@/components/suppliers/suppliers-columns';
import type { Supplier } from '@/docs/schemas';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

function ctx(supplier: Supplier): CellContext<Supplier, unknown> {
  return {
    row: { original: supplier, getValue: () => supplier } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<Supplier>, supplier: Supplier) {
  const cellFn = col.cell as (props: CellContext<Supplier, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(supplier))}</>);
}

function findCol(cols: ColumnDef<Supplier>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onToggleActive: vi.fn(),
  onDelete: vi.fn(),
  setOrdering: vi.fn(),
  ordering: 'name',
};

const base: Supplier = {
  id: 1,
  name: 'Tech Supplies S.A.',
  contact_name: 'Ana Gómez',
  email: 'ventas@techsupplies.com',
  phone: null,
  address: null,
  city: null,
  country: 'Perú',
  tax_id: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ─── name column ─────────────────────────────────────────────────────────────

describe('name column', () => {
  it('renders supplier name', () => {
    const cols = createSupplierColumns(mockActions);
    renderCell(findCol(cols, 'name'), base);
    expect(screen.getByText('Tech Supplies S.A.')).toBeTruthy();
  });
});

// ─── contact_name column ─────────────────────────────────────────────────────

describe('contact_name column', () => {
  const cols = createSupplierColumns(mockActions);

  it('renders contact name when present', () => {
    renderCell(findCol(cols, 'contact_name'), { ...base, contact_name: 'Ana Gómez' });
    expect(screen.getByText('Ana Gómez')).toBeTruthy();
  });

  it('renders "—" when contact_name is null', () => {
    renderCell(findCol(cols, 'contact_name'), { ...base, contact_name: null });
    expect(screen.getByText('—')).toBeTruthy();
  });
});

// ─── is_active badge ──────────────────────────────────────────────────────────

describe('is_active column', () => {
  const cols = createSupplierColumns(mockActions);

  it('renders "Activo" when true', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: true });
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('renders "Inactivo" when false', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: false });
    expect(screen.getByText('Inactivo')).toBeTruthy();
  });
});

// ─── actions column — permission gating ──────────────────────────────────────

describe('actions column', () => {
  it('returns null when canChange=false and canDelete=false', () => {
    const cols = createSupplierColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    expect(cellFn(ctx(base))).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createSupplierColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createSupplierColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
