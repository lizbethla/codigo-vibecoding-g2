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
import type { AppUser } from '@/docs/schemas';

interface ColumnActions {
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

export function createUserColumns(actions: ColumnActions): ColumnDef<AppUser>[] {
  return [
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div>
            <p className="font-medium">{u.username}</p>
            {(u.first_name || u.last_name) && (
              <p className="text-xs text-muted-foreground">
                {u.first_name} {u.last_name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const u = row.original;
        if (u.is_superuser) return <Badge variant="secondary">Superadmin</Badge>;
        if (u.is_staff) return <Badge variant="outline">Staff</Badge>;
        return <span className="text-sm text-muted-foreground">Usuario</span>;
      },
    },
    {
      id: 'groups',
      header: 'Grupos',
      cell: ({ row }) => {
        const groups = row.original.groups;
        if (!groups.length) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {groups.slice(0, 2).map((g) => (
              <Badge key={g.id} variant="outline" className="text-xs">
                {g.name}
              </Badge>
            ))}
            {groups.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{groups.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'destructive'}>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(user)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onDelete(user)}
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
