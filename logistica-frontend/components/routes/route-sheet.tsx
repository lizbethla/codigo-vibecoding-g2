'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RouteForm } from './route-form';
import { useRoute } from '@/hooks/use-routes';

interface RouteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId?: number;
}

function RouteSheetContent({
  routeId,
  onOpenChange,
}: {
  routeId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: routeData, isLoading } = useRoute(routeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <RouteForm
      defaultValues={routeData}
      onSuccess={() => onOpenChange(false)}
    />
  );
}

export function RouteSheet({ open, onOpenChange, routeId }: RouteSheetProps) {
  const title = routeId ? 'Editar ruta' : 'Nueva ruta';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {routeId ? (
          <RouteSheetContent routeId={routeId} onOpenChange={onOpenChange} />
        ) : (
          <RouteForm onSuccess={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}
