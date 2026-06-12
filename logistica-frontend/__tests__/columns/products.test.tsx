import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createProductColumns } from '@/components/products/products-columns';
import type { Product } from '@/docs/schemas';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

function ctx(product: Product): CellContext<Product, unknown> {
  return {
    row: { original: product, getValue: () => product } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<Product>, product: Product) {
  const cellFn = col.cell as (props: CellContext<Product, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(product))}</>);
}

function findCol(cols: ColumnDef<Product>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onToggleActive: vi.fn(),
  onDelete: vi.fn(),
  setOrdering: vi.fn(),
  ordering: 'name',
};

const base: Product = {
  id: 1,
  supplier: null,
  sku: 'PROD-001',
  name: 'Laptop Pro 15',
  description: null,
  category: 'LAPTOP',
  unit_price: '1500.00',
  weight_kg: '2.00',
  dimensions_cm: null,
  stock_quantity: 10,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ─── sku column ───────────────────────────────────────────────────────────────

describe('sku column', () => {
  it('renders sku', () => {
    const cols = createProductColumns(mockActions);
    renderCell(findCol(cols, 'sku'), base);
    expect(screen.getByText('PROD-001')).toBeTruthy();
  });
});

// ─── name column ─────────────────────────────────────────────────────────────

describe('name column', () => {
  it('renders product name', () => {
    const cols = createProductColumns(mockActions);
    renderCell(findCol(cols, 'name'), base);
    expect(screen.getByText('Laptop Pro 15')).toBeTruthy();
  });
});

// ─── category badge ───────────────────────────────────────────────────────────

describe('category column', () => {
  const cols = createProductColumns(mockActions);

  it('renders "Portátil" for LAPTOP', () => {
    renderCell(findCol(cols, 'category'), { ...base, category: 'LAPTOP' });
    expect(screen.getByText('Portátil')).toBeTruthy();
  });

  it('renders "Escritorio" for DESKTOP', () => {
    renderCell(findCol(cols, 'category'), { ...base, category: 'DESKTOP' });
    expect(screen.getByText('Escritorio')).toBeTruthy();
  });

  it('renders "Otro" for OTHER', () => {
    renderCell(findCol(cols, 'category'), { ...base, category: 'OTHER' });
    expect(screen.getByText('Otro')).toBeTruthy();
  });
});

// ─── unit_price column ────────────────────────────────────────────────────────

describe('unit_price column', () => {
  const cols = createProductColumns(mockActions);

  it('formats decimal string with 2 decimal places', () => {
    renderCell(findCol(cols, 'unit_price'), { ...base, unit_price: '1500.00' });
    expect(screen.getByText('1500.00')).toBeTruthy();
  });

  it('rounds to 2 decimal places', () => {
    renderCell(findCol(cols, 'unit_price'), { ...base, unit_price: '99.9' });
    expect(screen.getByText('99.90')).toBeTruthy();
  });
});

// ─── is_active badge ──────────────────────────────────────────────────────────

describe('is_active column', () => {
  const cols = createProductColumns(mockActions);

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
    const cols = createProductColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    expect(cellFn(ctx(base))).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createProductColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createProductColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
