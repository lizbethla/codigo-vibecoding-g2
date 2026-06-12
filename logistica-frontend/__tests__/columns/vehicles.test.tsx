import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createVehicleColumns } from '@/components/vehicles/vehicles-columns';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { VehicleListItem } from '@/hooks/use-vehicles';

function ctx(vehicle: VehicleListItem): CellContext<VehicleListItem, unknown> {
  return {
    row: { original: vehicle, getValue: () => vehicle } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<VehicleListItem>, vehicle: VehicleListItem) {
  const cellFn = col.cell as (props: CellContext<VehicleListItem, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(vehicle))}</>);
}

function findCol(cols: ColumnDef<VehicleListItem>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const base: VehicleListItem = {
  id: 1,
  plate: 'ABC-123',
  vehicle_type: 'VAN',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2022,
  status: 'AVAILABLE',
};

// ─── plate column ─────────────────────────────────────────────────────────────

describe('plate column', () => {
  it('renders plate', () => {
    const cols = createVehicleColumns(mockActions);
    renderCell(findCol(cols, 'plate'), base);
    expect(screen.getByText('ABC-123')).toBeTruthy();
  });
});

// ─── vehicle_type badge ───────────────────────────────────────────────────────

describe('vehicle_type column', () => {
  const cols = createVehicleColumns(mockActions);

  it('renders "Furgoneta" for VAN', () => {
    renderCell(findCol(cols, 'vehicle_type'), { ...base, vehicle_type: 'VAN' });
    expect(screen.getByText('Furgoneta')).toBeTruthy();
  });

  it('renders "Camión" for TRUCK', () => {
    renderCell(findCol(cols, 'vehicle_type'), { ...base, vehicle_type: 'TRUCK' });
    expect(screen.getByText('Camión')).toBeTruthy();
  });

  it('renders "Motocicleta" for MOTORCYCLE', () => {
    renderCell(findCol(cols, 'vehicle_type'), { ...base, vehicle_type: 'MOTORCYCLE' });
    expect(screen.getByText('Motocicleta')).toBeTruthy();
  });

  it('renders "Contenedor" for CONTAINER', () => {
    renderCell(findCol(cols, 'vehicle_type'), { ...base, vehicle_type: 'CONTAINER' });
    expect(screen.getByText('Contenedor')).toBeTruthy();
  });
});

// ─── brand_model_year column ──────────────────────────────────────────────────

describe('brand_model_year column', () => {
  it('renders brand, model and year together', () => {
    const cols = createVehicleColumns(mockActions);
    renderCell(findCol(cols, 'brand_model_year'), base);
    expect(screen.getByText('Toyota Hiace')).toBeTruthy();
    expect(screen.getByText('(2022)')).toBeTruthy();
  });
});

// ─── status badge ─────────────────────────────────────────────────────────────

describe('status column', () => {
  const cols = createVehicleColumns(mockActions);

  it('renders "Disponible" for AVAILABLE', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'AVAILABLE' });
    expect(screen.getByText('Disponible')).toBeTruthy();
  });

  it('renders "En uso" for IN_USE', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'IN_USE' });
    expect(screen.getByText('En uso')).toBeTruthy();
  });

  it('renders "En mantenimiento" for MAINTENANCE', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'MAINTENANCE' });
    expect(screen.getByText('En mantenimiento')).toBeTruthy();
  });

  it('renders "Retirado" for RETIRED', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'RETIRED' });
    expect(screen.getByText('Retirado')).toBeTruthy();
  });
});

// ─── actions column — permission gating ──────────────────────────────────────

describe('actions column', () => {
  it('returns null when canChange=false and canDelete=false', () => {
    const cols = createVehicleColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    expect(cellFn(ctx(base))).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createVehicleColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createVehicleColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
