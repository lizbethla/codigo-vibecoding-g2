'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VehicleForm } from './vehicle-form';
import { useVehicle } from '@/hooks/use-vehicles';

interface VehicleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId?: number;
}

function VehicleSheetContent({
  vehicleId,
  onOpenChange,
}: {
  vehicleId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: vehicleData, isLoading } = useVehicle(vehicleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <VehicleForm
      defaultValues={vehicleData}
      onSuccess={() => onOpenChange(false)}
    />
  );
}

export function VehicleSheet({ open, onOpenChange, vehicleId }: VehicleSheetProps) {
  const title = vehicleId ? 'Editar vehículo' : 'Nuevo vehículo';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {vehicleId ? (
          <VehicleSheetContent vehicleId={vehicleId} onOpenChange={onOpenChange} />
        ) : (
          <VehicleForm onSuccess={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}
