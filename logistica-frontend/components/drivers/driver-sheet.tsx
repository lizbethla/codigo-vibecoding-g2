'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DriverForm } from './driver-form';
import { useDriver } from '@/hooks/use-drivers';

interface DriverSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId?: number;
}

function DriverSheetContent({
  driverId,
  onOpenChange,
}: {
  driverId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: driverData, isLoading } = useDriver(driverId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <DriverForm
      defaultValues={driverData}
      onSuccess={() => onOpenChange(false)}
    />
  );
}

export function DriverSheet({ open, onOpenChange, driverId }: DriverSheetProps) {
  const title = driverId ? 'Editar conductor' : 'Nuevo conductor';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {driverId ? (
          <DriverSheetContent driverId={driverId} onOpenChange={onOpenChange} />
        ) : (
          <DriverForm onSuccess={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}
