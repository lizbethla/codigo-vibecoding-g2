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
import { useDeleteVehicle } from '@/hooks/use-vehicles';

interface VehicleDeleteDialogProps {
  vehiclePlate: string;
  vehicleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDeleteDialog({
  vehiclePlate,
  vehicleId,
  open,
  onOpenChange,
}: VehicleDeleteDialogProps) {
  const deleteMutation = useDeleteVehicle(() => onOpenChange(false));

  function handleConfirm() {
    if (vehicleId === null) return;
    deleteMutation.mutate(vehicleId);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar vehículo</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar el vehículo &quot;{vehiclePlate}&quot;? Esta acción no se puede deshacer.
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
