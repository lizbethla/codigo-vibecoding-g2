'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ShipmentProduct } from '@/docs/schemas';

interface ShipmentProductsTableProps {
  products: ShipmentProduct[];
  onEdit: (product: ShipmentProduct) => void;
  onDelete: (product: ShipmentProduct) => void;
}

function formatCurrency(decStr: string): string {
  return `S/ ${parseFloat(decStr).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export function ShipmentProductsTable({
  products,
  onEdit,
  onDelete,
}: ShipmentProductsTableProps) {
  const sorted = [...products].sort((a, b) => a.id - b.id);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Precio unitario</TableHead>
            <TableHead>Total línea</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                Sin productos. Agrega el primer producto al envío.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <span className="font-mono text-sm">{product.product.sku}</span>
                    <br />
                    <span className="font-medium">{product.product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{formatCurrency(product.unit_price)}</TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(product.line_total)}</span>
                </TableCell>
                <TableCell>
                  {product.notes ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
