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
import { useDeleteDriver } from '@/hooks/use-drivers';

interface DriverDeleteDialogProps {
  driverName: string;
  driverId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverDeleteDialog({
  driverName,
  driverId,
  open,
  onOpenChange,
}: DriverDeleteDialogProps) {
  const deleteMutation = useDeleteDriver(() => onOpenChange(false));

  function handleConfirm() {
    if (driverId === null) return;
    deleteMutation.mutate(driverId);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar conductor</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar al conductor &quot;{driverName}&quot;? Esta accion no se puede deshacer.
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
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
