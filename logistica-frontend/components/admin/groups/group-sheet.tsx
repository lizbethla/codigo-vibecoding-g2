'use client';

import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GroupForm } from './group-form';
import { useGroup } from '@/hooks/use-users';
import type { Group } from '@/docs/schemas';

interface GroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
}

export function GroupSheet({ open, onOpenChange, group }: GroupSheetProps) {
  const { data: fullGroup, isLoading } = useGroup(group?.id ?? 0);
  const title = group ? 'Editar grupo' : 'Nuevo grupo';
  const isReady = !group || !!fullGroup;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {isLoading && group ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <GroupForm
            key={group?.id ?? 'new'}
            defaultValues={fullGroup}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
