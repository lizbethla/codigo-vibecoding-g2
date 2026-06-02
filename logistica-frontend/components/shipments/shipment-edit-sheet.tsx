'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useShipment } from '@/hooks/use-shipments';
import { ShipmentEditForm } from './shipment-edit-form';

interface ShipmentEditSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shipmentId?: number;
}

function ShipmentEditSheetContent({
  shipmentId,
  onOpenChange,
}: {
  shipmentId: number;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: shipment, isLoading } = useShipment(shipmentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground px-4">
        Cargando...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground px-4">
        No se pudo cargar el envío.
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Código de rastreo
        </p>
        <p className="font-mono text-sm text-muted-foreground">{shipment.tracking_code}</p>
      </div>
      <ShipmentEditForm
        defaultValues={shipment}
        onSuccess={() => onOpenChange(false)}
      />
    </div>
  );
}

export function ShipmentEditSheet({ open, onOpenChange, shipmentId }: ShipmentEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>Editar envío</SheetTitle>
        </SheetHeader>
        {shipmentId ? (
          <ShipmentEditSheetContent shipmentId={shipmentId} onOpenChange={onOpenChange} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
