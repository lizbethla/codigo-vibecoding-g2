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
import type { ShipmentStatus, ShipmentPriority } from '@/docs/schemas';
import type { ShipmentListItem } from '@/hooks/use-shipments';

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING:          'Pendiente',
  CONFIRMED:        'Confirmado',
  IN_WAREHOUSE:     'En almacén',
  IN_TRANSIT:       'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED:        'Entregado',
  FAILED:           'Fallido',
  CANCELLED:        'Cancelado',
  RETURNED:         'Devuelto',
};

export const STATUS_BADGE_CLASSES: Record<ShipmentStatus, string> = {
  PENDING:          'bg-gray-100 text-gray-800 border-gray-200',
  CONFIRMED:        'bg-blue-100 text-blue-800 border-blue-200',
  IN_WAREHOUSE:     'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_TRANSIT:       'bg-orange-100 text-orange-800 border-orange-200',
  OUT_FOR_DELIVERY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELIVERED:        'bg-green-100 text-green-800 border-green-200',
  FAILED:           'bg-red-100 text-red-800 border-red-200',
  CANCELLED:        'bg-red-100 text-red-800 border-red-200',
  RETURNED:         'bg-purple-100 text-purple-800 border-purple-200',
};

export const PRIORITY_LABELS: Record<ShipmentPriority, string> = {
  LOW:    'Baja',
  NORMAL: 'Normal',
  HIGH:   'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_BADGE_CLASSES: Record<ShipmentPriority, string> = {
  LOW:    'bg-gray-100 text-gray-800 border-gray-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH:   'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

export interface ColumnActions {
  onEdit: (id: number) => void;
  onDelete: (id: number, trackingCode: string) => void;
  onView: (id: number) => void;
}

export function createShipmentColumns(actions: ColumnActions): ColumnDef<ShipmentListItem>[] {
  return [
    {
      accessorKey: 'tracking_code',
      header: 'Código',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-sm">{row.original.tracking_code}</span>
      ),
    },
    {
      id: 'customer_name',
      header: 'Cliente',
      accessorFn: (row) => row.customer.name,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.customer.name}</span>
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
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge variant="outline" className={PRIORITY_BADGE_CLASSES[priority]}>
            {PRIORITY_LABELS[priority]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'destination_city',
      header: 'Destino',
    },
    {
      accessorKey: 'scheduled_date',
      header: 'Fecha prog.',
      cell: ({ row }) => {
        const date = new Date(row.original.scheduled_date + 'T00:00:00');
        return <span>{date.toLocaleDateString('es-PE')}</span>;
      },
    },
    {
      accessorKey: 'total_cost',
      header: 'Costo total',
      cell: ({ row }) => (
        <span>
          S/ {parseFloat(row.original.total_cost).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const shipment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(shipment.id)}>
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(shipment.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onDelete(shipment.id, shipment.tracking_code)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
