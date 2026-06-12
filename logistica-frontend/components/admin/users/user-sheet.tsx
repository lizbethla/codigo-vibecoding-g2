'use client';

import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserForm } from './user-form';
import { useUser } from '@/hooks/use-users';
import type { AppUser } from '@/docs/schemas';

interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AppUser;
}

export function UserSheet({ open, onOpenChange, user }: UserSheetProps) {
  const { data: fullUser, isLoading } = useUser(user?.id ?? 0);
  const title = user ? 'Editar usuario' : 'Nuevo usuario';
  const isReady = !user || !!fullUser;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {isLoading && user ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <UserForm
            key={user?.id ?? 'new'}
            defaultValues={fullUser}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
