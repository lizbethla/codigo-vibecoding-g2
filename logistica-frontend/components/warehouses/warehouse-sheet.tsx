'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useWarehouse } from '@/hooks/use-warehouses';
import { WarehouseForm } from './warehouse-form';

interface WarehouseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: number;
}

export function WarehouseSheet({ open, onOpenChange, warehouseId }: WarehouseSheetProps) {
  const title = warehouseId ? 'Editar almacén' : 'Nuevo almacén';

  const { data: warehouseData, isLoading } = useWarehouse(warehouseId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {warehouseId && isLoading ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="space-y-3 w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full rounded-md bg-muted animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <WarehouseForm
            defaultValues={warehouseId ? warehouseData : undefined}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
