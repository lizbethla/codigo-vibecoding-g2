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
import type { RouteStop } from '@/docs/schemas';

interface StopsTableProps {
  stops: RouteStop[];
  onEdit: (stop: RouteStop) => void;
  onDelete: (stop: RouteStop) => void;
}

export function StopsTable({ stops, onEdit, onDelete }: StopsTableProps) {
  const sorted = [...stops].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Parada</TableHead>
            <TableHead>Llegada estimada (h)</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                Sin paradas. Agrega la primera parada.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((stop) => (
              <TableRow key={stop.id}>
                <TableCell>
                  <span className="font-mono font-medium text-sm">{stop.order}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{stop.stop_name}</span>
                </TableCell>
                <TableCell>
                  {stop.estimated_arrival_hours ? (
                    `${stop.estimated_arrival_hours} h`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {stop.notes ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(stop)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(stop)}
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
