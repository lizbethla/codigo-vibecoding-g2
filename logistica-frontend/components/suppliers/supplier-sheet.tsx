'use client';

import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SupplierForm } from './supplier-form';
import { useSupplier } from '@/hooks/use-suppliers';
import type { Supplier } from '@/docs/schemas';

interface SupplierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
}

export function SupplierSheet({ open, onOpenChange, supplier }: SupplierSheetProps) {
  const { data: fullSupplier, isLoading } = useSupplier(supplier?.id);
  const title = supplier ? 'Editar proveedor' : 'Nuevo proveedor';

  // For edit mode, wait for full supplier data — list endpoint returns only SupplierSummary
  const isReady = !supplier || !!fullSupplier;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {isLoading && supplier ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <SupplierForm
            key={supplier?.id ?? 'new'}
            defaultValues={fullSupplier}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
