import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createShipmentColumns } from '@/components/shipments/shipments-columns';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { ShipmentListItem } from '@/hooks/use-shipments';

function ctx(item: ShipmentListItem): CellContext<ShipmentListItem, unknown> {
  return {
    row: { original: item, getValue: () => item } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<ShipmentListItem>, item: ShipmentListItem) {
  const cellFn = col.cell as (props: CellContext<ShipmentListItem, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(item))}</>);
}

function findCol(cols: ColumnDef<ShipmentListItem>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onView: vi.fn(),
};

const base: ShipmentListItem = {
  id: 1,
  tracking_code: 'LOG-2024-0001',
  customer: { id: 1, name: 'Cliente Test', customer_type: 'COMPANY' },
  status: 'PENDING',
  priority: 'NORMAL',
  destination_city: 'Medellín',
  scheduled_date: '2024-06-15',
  total_cost: '500000.00',
};

// ─── tracking_code column ─────────────────────────────────────────────────────

describe('tracking_code column', () => {
  it('renders tracking code', () => {
    const cols = createShipmentColumns(mockActions);
    renderCell(findCol(cols, 'tracking_code'), base);
    expect(screen.getByText('LOG-2024-0001')).toBeTruthy();
  });
});

// ─── customer_name column ─────────────────────────────────────────────────────

describe('customer_name column', () => {
  it('renders customer name', () => {
    const cols = createShipmentColumns(mockActions);
    renderCell(findCol(cols, 'customer_name'), base);
    expect(screen.getByText('Cliente Test')).toBeTruthy();
  });
});

// ─── status column ────────────────────────────────────────────────────────────

describe('status column', () => {
  const cols = createShipmentColumns(mockActions);

  it('renders "Pendiente" for PENDING', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'PENDING' });
    expect(screen.getByText('Pendiente')).toBeTruthy();
  });

  it('renders "Entregado" for DELIVERED', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'DELIVERED' });
    expect(screen.getByText('Entregado')).toBeTruthy();
  });

  it('renders "Cancelado" for CANCELLED', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'CANCELLED' });
    expect(screen.getByText('Cancelado')).toBeTruthy();
  });

  it('renders "En tránsito" for IN_TRANSIT', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'IN_TRANSIT' });
    expect(screen.getByText('En tránsito')).toBeTruthy();
  });
});

// ─── priority column ──────────────────────────────────────────────────────────

describe('priority column', () => {
  const cols = createShipmentColumns(mockActions);

  it('renders "Normal" for NORMAL', () => {
    renderCell(findCol(cols, 'priority'), { ...base, priority: 'NORMAL' });
    expect(screen.getByText('Normal')).toBeTruthy();
  });

  it('renders "Urgente" for URGENT', () => {
    renderCell(findCol(cols, 'priority'), { ...base, priority: 'URGENT' });
    expect(screen.getByText('Urgente')).toBeTruthy();
  });

  it('renders "Baja" for LOW', () => {
    renderCell(findCol(cols, 'priority'), { ...base, priority: 'LOW' });
    expect(screen.getByText('Baja')).toBeTruthy();
  });
});

// ─── total_cost column ────────────────────────────────────────────────────────

describe('total_cost column', () => {
  it('renders "S/" prefix', () => {
    const cols = createShipmentColumns(mockActions);
    const { container } = renderCell(findCol(cols, 'total_cost'), base);
    expect(container.textContent).toContain('S/');
  });
});

// ─── actions column ───────────────────────────────────────────────────────────

describe('actions column', () => {
  it('renders trigger button', () => {
    const cols = createShipmentColumns(mockActions);
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canChange=false and canDelete=false', () => {
    const cols = createShipmentColumns({ ...mockActions, canChange: false, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
