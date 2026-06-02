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
import type { Customer } from '@/docs/schemas';

interface ColumnActions {
  onEdit: (customer: Customer) => void;
  onToggleActive: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  setOrdering: (ordering: string) => void;
  ordering: string;
}

export function createCustomerColumns(actions: ColumnActions): ColumnDef<Customer>[] {
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
      accessorKey: 'customer_type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.customer_type;
        return (
          <Badge variant={type === 'COMPANY' ? 'default' : 'secondary'}>
            {type === 'COMPANY' ? 'Empresa' : 'Particular'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
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
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(customer)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onToggleActive(customer)}>
                {customer.is_active ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onDelete(customer)}
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
