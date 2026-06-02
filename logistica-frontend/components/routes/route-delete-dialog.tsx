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
import { useDeleteRoute } from '@/hooks/use-routes';

interface RouteDeleteDialogProps {
  routeName: string;
  routeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouteDeleteDialog({
  routeName,
  routeId,
  open,
  onOpenChange,
}: RouteDeleteDialogProps) {
  const deleteMutation = useDeleteRoute(() => onOpenChange(false));

  function handleConfirm() {
    if (routeId === null) return;
    deleteMutation.mutate(routeId);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar ruta</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar la ruta &quot;{routeName}&quot;? Se eliminarán también todas las
            paradas asociadas. Esta acción no se puede deshacer.
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
