'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Supplier } from '@/docs/schemas';

interface ColumnActions {
  onEdit: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  setOrdering: (ordering: string) => void;
  ordering: string;
  canChange?: boolean;
  canDelete?: boolean;
}

export function createSupplierColumns(actions: ColumnActions): ColumnDef<Supplier>[] {
  return [
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
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'contact_name',
      header: 'Contacto',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contact_name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'country',
      header: 'País',
      cell: ({ row }) => <span>{row.original.country}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const supplier = row.original;
        const canChange = actions.canChange !== false;
        const canDelete = actions.canDelete !== false;
        if (!canChange && !canDelete) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChange && (
                <DropdownMenuItem onClick={() => actions.onEdit(supplier)}>
                  Editar
                </DropdownMenuItem>
              )}
              {canChange && (
                <DropdownMenuItem onClick={() => actions.onToggleActive(supplier)}>
                  {supplier.is_active ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(supplier)}
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
