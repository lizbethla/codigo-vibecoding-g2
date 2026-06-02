'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WarehouseSummary } from '@/docs/schemas';

export interface ColumnActions {
  onEdit: (w: WarehouseSummary) => void;
  onDelete: (w: WarehouseSummary) => void;
  setOrdering: (o: string) => void;
  ordering: string;
}

export function createWarehouseColumns(actions: ColumnActions): ColumnDef<WarehouseSummary>[] {
  return [
    {
      accessorKey: 'code',
      header: () => (
        <Button
          variant="ghost"
          className="h-8 px-2 -ml-2"
          onClick={() => {
            actions.setOrdering(actions.ordering === 'code' ? '-code' : 'code');
          }}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: () => (
        <Button
          variant="ghost"
          className="h-8 px-2 -ml-2"
          onClick={() => {
            actions.setOrdering(actions.ordering === 'name' ? '-name' : 'name');
          }}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      cell: ({ row }) => <span>{row.original.city}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const warehouse = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(warehouse)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onDelete(warehouse)}
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
