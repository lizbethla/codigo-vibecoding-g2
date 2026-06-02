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
import { useDeleteStop } from '@/hooks/use-route-stops';

interface StopDeleteDialogProps {
  stopName: string;
  routeId: number;
  stopId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StopDeleteDialog({
  stopName,
  routeId,
  stopId,
  open,
  onOpenChange,
}: StopDeleteDialogProps) {
  const deleteMutation = useDeleteStop(() => onOpenChange(false));

  function handleConfirm() {
    if (stopId === null) return;
    deleteMutation.mutate({ routeId, stopId });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar parada</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar la parada &quot;{stopName}&quot;? Esta acción no se puede deshacer.
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
