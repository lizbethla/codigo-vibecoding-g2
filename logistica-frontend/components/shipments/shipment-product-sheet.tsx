'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ShipmentProductForm } from './shipment-product-form';
import type { ShipmentProduct } from '@/docs/schemas';

interface ShipmentProductSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shipmentId: number;
  product?: ShipmentProduct;
}

export function ShipmentProductSheet({
  open,
  onOpenChange,
  shipmentId,
  product,
}: ShipmentProductSheetProps) {
  const title = product ? 'Editar producto' : 'Agregar producto';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ShipmentProductForm
          defaultValues={product}
          shipmentId={shipmentId}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
