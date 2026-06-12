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
import type { Product, ProductCategory } from '@/docs/schemas';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  LAPTOP: 'Portátil',
  DESKTOP: 'Escritorio',
  MOBILE: 'Móvil',
  TABLET: 'Tableta',
  PERIPHERAL: 'Periférico',
  NETWORKING: 'Redes',
  STORAGE: 'Almacenamiento',
  OTHER: 'Otro',
};

interface ColumnActions {
  onEdit: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onDelete: (product: Product) => void;
  setOrdering: (ordering: string) => void;
  ordering: string;
  canChange?: boolean;
  canDelete?: boolean;
}

export function createProductColumns(actions: ColumnActions): ColumnDef<Product>[] {
  return [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.sku}</span>
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
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {CATEGORY_LABELS[row.original.category]}
        </Badge>
      ),
    },
    {
      accessorKey: 'unit_price',
      header: 'Precio unitario',
      cell: ({ row }) => (
        <span>{parseFloat(row.original.unit_price).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'stock_quantity',
      header: () => (
        <Button
          variant="ghost"
          className="h-8 px-2 -ml-2"
          onClick={() => {
            actions.setOrdering(
              actions.ordering === 'stock_quantity' ? '-stock_quantity' : 'stock_quantity',
            );
          }}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span>{row.original.stock_quantity}</span>,
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
        const product = row.original;
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
                <DropdownMenuItem onClick={() => actions.onEdit(product)}>
                  Editar
                </DropdownMenuItem>
              )}
              {canChange && (
                <DropdownMenuItem onClick={() => actions.onToggleActive(product)}>
                  {product.is_active ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(product)}
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
