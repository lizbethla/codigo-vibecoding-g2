'use client';

import { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search: SearchConfig;
  actions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table: _table,
  search,
  actions,
}: DataTableToolbarProps<TData>) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasActiveFilter = !!search.value;

  return (
    <div className="flex items-center justify-between gap-2">

      {/* Desktop: inline search */}
      <div className="hidden sm:flex flex-1 items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={search.placeholder ?? 'Buscar…'}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="h-8 pl-8 w-[220px] lg:w-[300px]"
          />
        </div>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => search.onChange('')}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Mobile: filter sheet trigger */}
      <div className="sm:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 relative">
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilter && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle>Filtros de búsqueda</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Búsqueda</Label>
                <Input
                  placeholder={search.placeholder ?? 'Buscar…'}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                {hasActiveFilter && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      search.onChange('');
                      setSheetOpen(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Actions: always visible (e.g. "Nuevo X" button) */}
      {actions && (
        <div className="flex items-center gap-2 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
