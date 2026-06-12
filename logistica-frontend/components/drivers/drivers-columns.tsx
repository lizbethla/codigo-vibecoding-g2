'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LicenseType, DriverStatus } from '@/docs/schemas';
import type { DriverListItem } from '@/hooks/use-drivers';

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  A: 'Motocicletas',
  B: 'Vehículos livianos',
  C: 'Vehículos pesados',
  CE: 'Vehículos articulados pesados',
  BTP: 'Transporte público',
};

export const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: 'Disponible',
  ON_ROUTE: 'En ruta',
  OFF_DUTY: 'Fuera de servicio',
  SUSPENDED: 'Suspendido',
};

export const STATUS_BADGE_CLASSES: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_ROUTE: 'bg-blue-100 text-blue-800 border-blue-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
};

export interface ColumnActions {
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
  canChange?: boolean;
  canDelete?: boolean;
}

export function createDriverColumns(actions: ColumnActions): ColumnDef<DriverListItem>[] {
  return [
    {
      accessorKey: 'user',
      header: 'Conductor',
      cell: ({ row }) => {
        const user = row.original.user;
        const fullName =
          user.first_name.trim() || user.last_name.trim()
            ? `${user.first_name} ${user.last_name}`.trim()
            : user.username;
        return <span className="font-medium">{fullName}</span>;
      },
    },
    {
      accessorKey: 'national_id',
      header: 'Cedula',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.national_id}</span>
      ),
    },
    {
      accessorKey: 'license_type',
      header: 'Tipo de licencia',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {LICENSE_TYPE_LABELS[row.original.license_type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={STATUS_BADGE_CLASSES[status]}
          >
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const driver = row.original;
        const user = driver.user;
        const name =
          user.first_name.trim() || user.last_name.trim()
            ? `${user.first_name} ${user.last_name}`.trim()
            : user.username;

        const canChange = actions.canChange !== false;
        const canDelete = actions.canDelete !== false;
        if (!canChange && !canDelete) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChange && (
                <DropdownMenuItem onClick={() => actions.onEdit(driver.id, name)}>
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(driver.id, name)}
                >
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
