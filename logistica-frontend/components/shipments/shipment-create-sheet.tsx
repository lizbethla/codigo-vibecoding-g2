'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ShipmentCreateForm } from './shipment-create-form';

interface ShipmentCreateSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ShipmentCreateSheet({ open, onOpenChange }: ShipmentCreateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>Nuevo envío</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Completa los datos para registrar un nuevo envío
          </p>
        </SheetHeader>
        <ShipmentCreateForm onSuccess={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
