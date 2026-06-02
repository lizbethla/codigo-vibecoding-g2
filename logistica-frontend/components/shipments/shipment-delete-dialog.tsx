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
import { useDeleteShipment } from '@/hooks/use-shipments';

interface ShipmentDeleteDialogProps {
  trackingCode: string;
  shipmentId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ShipmentDeleteDialog({
  trackingCode,
  shipmentId,
  open,
  onOpenChange,
}: ShipmentDeleteDialogProps) {
  const deleteMutation = useDeleteShipment(() => onOpenChange(false));

  function handleConfirm() {
    if (shipmentId !== null) {
      deleteMutation.mutate(shipmentId);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar envío</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar el envío &quot;{trackingCode}&quot;? Se eliminarán también todos los productos
            asociados. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
