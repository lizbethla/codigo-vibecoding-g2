'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProductForm } from './product-form';
import type { Product } from '@/docs/schemas';

interface ProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductSheet({ open, onOpenChange, product }: ProductSheetProps) {
  const title = product ? 'Editar producto' : 'Nuevo producto';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ProductForm
          defaultValues={product}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
