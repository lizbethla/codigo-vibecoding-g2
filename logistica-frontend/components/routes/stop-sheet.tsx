'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StopForm } from './stop-form';
import type { RouteStop } from '@/docs/schemas';

interface StopSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: number;
  stop?: RouteStop;
}

export function StopSheet({ open, onOpenChange, routeId, stop }: StopSheetProps) {
  const title = stop ? 'Editar parada' : 'Agregar parada';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <StopForm
          defaultValues={stop}
          routeId={routeId}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
