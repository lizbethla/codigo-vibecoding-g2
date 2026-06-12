import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createDriverColumns } from '@/components/drivers/drivers-columns';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { DriverListItem } from '@/hooks/use-drivers';

function ctx(driver: DriverListItem): CellContext<DriverListItem, unknown> {
  return {
    row: { original: driver, getValue: () => driver } as any,
    table: {} as any,
    column: {} as any,
    cell: {} as any,
    getValue: () => undefined,
    renderValue: () => undefined,
  };
}

function renderCell(col: ColumnDef<DriverListItem>, driver: DriverListItem) {
  const cellFn = col.cell as (props: CellContext<DriverListItem, unknown>) => React.ReactNode;
  return render(<>{cellFn(ctx(driver))}</>);
}

function findCol(cols: ColumnDef<DriverListItem>[], key: string) {
  return cols.find((c) => (c as any).accessorKey === key || (c as any).id === key)!;
}

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const base: DriverListItem = {
  id: 1,
  user: { id: 10, username: 'jperez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@co.com' },
  license_type: 'C',
  status: 'AVAILABLE',
  national_id: '1000000001',
};

// ─── user (conductor) column ──────────────────────────────────────────────────

describe('user column', () => {
  const cols = createDriverColumns(mockActions);

  it('renders first_name + last_name when both present', () => {
    renderCell(findCol(cols, 'user'), base);
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
  });

  it('renders last_name only when first_name is empty', () => {
    renderCell(findCol(cols, 'user'), {
      ...base,
      user: { ...base.user, first_name: '', last_name: 'Solo' },
    });
    expect(screen.getByText('Solo')).toBeTruthy();
  });

  it('falls back to username when both names are empty', () => {
    renderCell(findCol(cols, 'user'), {
      ...base,
      user: { ...base.user, first_name: '', last_name: '' },
    });
    expect(screen.getByText('jperez')).toBeTruthy();
  });
});

// ─── license_type badge ───────────────────────────────────────────────────────

describe('license_type column', () => {
  const cols = createDriverColumns(mockActions);

  it('renders "Vehículos pesados" for C', () => {
    renderCell(findCol(cols, 'license_type'), { ...base, license_type: 'C' });
    expect(screen.getByText('Vehículos pesados')).toBeTruthy();
  });

  it('renders "Motocicletas" for A', () => {
    renderCell(findCol(cols, 'license_type'), { ...base, license_type: 'A' });
    expect(screen.getByText('Motocicletas')).toBeTruthy();
  });

  it('renders "Transporte público" for BTP', () => {
    renderCell(findCol(cols, 'license_type'), { ...base, license_type: 'BTP' });
    expect(screen.getByText('Transporte público')).toBeTruthy();
  });
});

// ─── status badge ─────────────────────────────────────────────────────────────

describe('status column', () => {
  const cols = createDriverColumns(mockActions);

  it('renders "Disponible" for AVAILABLE', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'AVAILABLE' });
    expect(screen.getByText('Disponible')).toBeTruthy();
  });

  it('renders "En ruta" for ON_ROUTE', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'ON_ROUTE' });
    expect(screen.getByText('En ruta')).toBeTruthy();
  });

  it('renders "Suspendido" for SUSPENDED', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'SUSPENDED' });
    expect(screen.getByText('Suspendido')).toBeTruthy();
  });

  it('renders "Fuera de servicio" for OFF_DUTY', () => {
    renderCell(findCol(cols, 'status'), { ...base, status: 'OFF_DUTY' });
    expect(screen.getByText('Fuera de servicio')).toBeTruthy();
  });
});

// ─── actions column — permission gating ──────────────────────────────────────

describe('actions column', () => {
  it('returns null when canChange=false and canDelete=false', () => {
    const cols = createDriverColumns({ ...mockActions, canChange: false, canDelete: false });
    const cellFn = findCol(cols, 'actions').cell as (props: any) => React.ReactNode;
    expect(cellFn(ctx(base))).toBeNull();
  });

  it('renders trigger when canChange=true', () => {
    const cols = createDriverColumns({ ...mockActions, canChange: true, canDelete: false });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders trigger when canDelete=true', () => {
    const cols = createDriverColumns({ ...mockActions, canChange: false, canDelete: true });
    renderCell(findCol(cols, 'actions'), base);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
