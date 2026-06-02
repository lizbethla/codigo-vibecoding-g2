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
import type { RouteListItem } from '@/hooks/use-routes';

export const IS_ACTIVE_BADGE_CLASSES: Record<string, string> = {
  true: 'bg-green-100 text-green-800 border-green-200',
  false: 'bg-gray-100 text-gray-800 border-gray-200',
};

export interface ColumnActions {
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
  onView: (id: number) => void;
}

export function createRouteColumns(actions: ColumnActions): ColumnDef<RouteListItem>[] {
  return [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: 'route_path',
      header: 'Ruta',
      accessorFn: (row) => row.origin_city,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.origin_city}{' '}
          <span className="text-muted-foreground">→</span>{' '}
          {row.original.destination_city}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <Badge
            variant="outline"
            className={IS_ACTIVE_BADGE_CLASSES[String(isActive)]}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const route = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(route.id)}>
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(route.id, route.name)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onDelete(route.id, route.name)}
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
