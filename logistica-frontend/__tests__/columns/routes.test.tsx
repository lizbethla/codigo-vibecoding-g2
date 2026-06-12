import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRouteColumns } from '@/components/routes/routes-columns';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { RouteListItem } from '@/hooks/use-routes';

function ctx(route: RouteListItem): CellContext<RouteListItem, unknown> {
  return {
    row: { original: route, getValue: () => route } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<RouteListItem>, route: RouteListItem) {
  const cellFn = col.cell as (props: CellContext<RouteListItem, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(route))}</>);
}

function findCol(cols: ColumnDef<RouteListItem>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onView: vi.fn(),
};

const base: RouteListItem = {
  id: 1,
  code: 'LIM-AQP-01',
  name: 'Lima - Arequipa',
  origin_city: 'Lima',
  destination_city: 'Arequipa',
  is_active: true,
};

// ─── code column ─────────────────────────────────────────────────────────────

describe('code column', () => {
  it('renders route code', () => {
    const cols = createRouteColumns(mockActions);
    renderCell(findCol(cols, 'code'), base);
    expect(screen.getByText('LIM-AQP-01')).toBeTruthy();
  });
});

// ─── name column ─────────────────────────────────────────────────────────────

describe('name column', () => {
  it('renders route name', () => {
    const cols = createRouteColumns(mockActions);
    renderCell(findCol(cols, 'name'), base);
    expect(screen.getByText('Lima - Arequipa')).toBeTruthy();
  });
});

// ─── route_path column ───────────────────────────────────────────────────────

describe('route_path column', () => {
  it('renders origin and destination cities', () => {
    const cols = createRouteColumns(mockActions);
    const { container } = renderCell(findCol(cols, 'route_path'), base);
    expect(container.textContent).toContain('Lima');
    expect(container.textContent).toContain('Arequipa');
    expect(container.textContent).toContain('→');
  });
});

// ─── is_active badge ──────────────────────────────────────────────────────────

describe('is_active column', () => {
  const cols = createRouteColumns(mockActions);

  it('renders "Activo" when true', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: true });
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('renders "Inactivo" when false', () => {
    renderCell(findCol(cols, 'is_active'), { ...base, is_active: false });
    expect(screen.getByText('Inactivo')).toBeTruthy();
  });
});

// ─── actions column — always renders (Ver detalle always present) ─────────────

describe('actions column', () => {
  it('always renders trigger (Ver detalle always shown)', () => {
    const cols = createRouteColumns({ ...mockActions, canChange: false, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createRouteColumns({ ...mockActions, canChange: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
