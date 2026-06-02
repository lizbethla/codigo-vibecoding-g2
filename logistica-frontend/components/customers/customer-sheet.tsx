'use client';

import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerForm } from './customer-form';
import { useCustomer } from '@/hooks/use-customers';
import type { Customer } from '@/docs/schemas';

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function CustomerSheet({ open, onOpenChange, customer }: CustomerSheetProps) {
  const { data: fullCustomer, isLoading } = useCustomer(customer?.id);
  const title = customer ? 'Editar cliente' : 'Nuevo cliente';

  // For edit mode, wait until full customer data is fetched so the form
  // has all fields (list endpoint only returns CustomerSummary — no tax_id, phone, etc.)
  const isReady = !customer || !!fullCustomer;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {isLoading && customer ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <CustomerForm
            key={customer?.id ?? 'new'}
            defaultValues={fullCustomer}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
