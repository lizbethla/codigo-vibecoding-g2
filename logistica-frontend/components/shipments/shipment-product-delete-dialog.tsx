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
import { useRemoveShipmentProduct } from '@/hooks/use-shipment-products';

interface ShipmentProductDeleteDialogProps {
  productName: string;
  shipmentId: number;
  productId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ShipmentProductDeleteDialog({
  productName,
  shipmentId,
  productId,
  open,
  onOpenChange,
}: ShipmentProductDeleteDialogProps) {
  const removeMutation = useRemoveShipmentProduct(() => onOpenChange(false));

  function handleConfirm() {
    if (productId !== null) {
      removeMutation.mutate({ shipmentId, productId });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar el producto &quot;{productName}&quot; de este envío? Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={removeMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {removeMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
