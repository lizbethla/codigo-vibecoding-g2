'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteWarehouse } from '@/hooks/use-warehouses';
import type { WarehouseSummary } from '@/docs/schemas';

interface WarehouseDeleteDialogProps {
  warehouse: WarehouseSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WarehouseDeleteDialog({
  warehouse,
  open,
  onOpenChange,
}: WarehouseDeleteDialogProps) {
  const deleteMutation = useDeleteWarehouse(() => onOpenChange(false));

  function handleConfirm() {
    if (!warehouse) return;
    deleteMutation.mutate(warehouse.id);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar almacén?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el almacén{' '}
            <strong>{warehouse?.name}</strong> y todos sus datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
