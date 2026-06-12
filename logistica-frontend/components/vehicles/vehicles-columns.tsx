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
import type { VehicleType, VehicleStatus, FuelType } from '@/docs/schemas';
import type { VehicleListItem } from '@/hooks/use-vehicles';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTORCYCLE: 'Motocicleta',
  VAN: 'Furgoneta',
  TRUCK: 'Camión',
  HEAVY_TRUCK: 'Camión pesado',
  REFRIGERATED_TRUCK: 'Camión refrigerado',
  CONTAINER: 'Contenedor',
};

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En uso',
  MAINTENANCE: 'En mantenimiento',
  RETIRED: 'Retirado',
};

export const STATUS_BADGE_CLASSES: Record<VehicleStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RETIRED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Gasolina',
  DIESEL: 'Diésel',
  ELECTRIC: 'Eléctrico',
  HYBRID: 'Híbrido',
  GAS: 'Gas',
};

export interface ColumnActions {
  onEdit: (id: number, plate: string) => void;
  onDelete: (id: number, plate: string) => void;
  canChange?: boolean;
  canDelete?: boolean;
}

export function createVehicleColumns(actions: ColumnActions): ColumnDef<VehicleListItem>[] {
  return [
    {
      accessorKey: 'plate',
      header: 'Placa',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.plate}</span>
      ),
    },
    {
      accessorKey: 'vehicle_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {VEHICLE_TYPE_LABELS[row.original.vehicle_type]}
        </Badge>
      ),
    },
    {
      id: 'brand_model_year',
      header: 'Vehículo',
      accessorFn: (row) => row.brand,
      cell: ({ row }) => (
        <span>
          <span className="font-medium">
            {row.original.brand} {row.original.model}
          </span>
          <span className="text-muted-foreground text-sm ml-1">
            ({row.original.year})
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={STATUS_BADGE_CLASSES[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const vehicle = row.original;
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
                <DropdownMenuItem onClick={() => actions.onEdit(vehicle.id, vehicle.plate)}>
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(vehicle.id, vehicle.plate)}
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
