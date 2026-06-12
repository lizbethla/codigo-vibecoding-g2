import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createWarehouseColumns } from '@/components/warehouses/warehouses-columns';
import type { WarehouseSummary } from '@/docs/schemas';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

function ctx(warehouse: WarehouseSummary): CellContext<WarehouseSummary, unknown> {
  return {
    row: { original: warehouse, getValue: () => warehouse } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<WarehouseSummary>, warehouse: WarehouseSummary) {
  const cellFn = col.cell as (props: CellContext<WarehouseSummary, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(warehouse))}</>);
}

function findCol(cols: ColumnDef<WarehouseSummary>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  setOrdering: vi.fn(),
  ordering: 'name',
};

const base: WarehouseSummary = {
  id: 1,
  code: 'BOG-01',
  name: 'Almacén Central',
  city: 'Bogotá',
};

// ─── code column ─────────────────────────────────────────────────────────────

describe('code column', () => {
  it('renders warehouse code', () => {
    const cols = createWarehouseColumns(mockActions);
    renderCell(findCol(cols, 'code'), base);
    expect(screen.getByText('BOG-01')).toBeTruthy();
  });
});

// ─── name column ─────────────────────────────────────────────────────────────

describe('name column', () => {
  it('renders warehouse name', () => {
    const cols = createWarehouseColumns(mockActions);
    renderCell(findCol(cols, 'name'), base);
    expect(screen.getByText('Almacén Central')).toBeTruthy();
  });
});

// ─── city column ─────────────────────────────────────────────────────────────

describe('city column', () => {
  it('renders city', () => {
    const cols = createWarehouseColumns(mockActions);
    renderCell(findCol(cols, 'city'), base);
    expect(screen.getByText('Bogotá')).toBeTruthy();
  });
});

// ─── actions column — permission gating ──────────────────────────────────────

describe('actions column', () => {
  it('returns null when canChange=false and canDelete=false', () => {
    const cols = createWarehouseColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    expect(cellFn(ctx(base))).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createWarehouseColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createWarehouseColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
