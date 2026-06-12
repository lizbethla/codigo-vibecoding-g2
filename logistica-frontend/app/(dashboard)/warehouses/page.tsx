'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { WarehouseSheet } from '@/components/warehouses/warehouse-sheet';
import { WarehouseDeleteDialog } from '@/components/warehouses/warehouse-delete-dialog';
import { createWarehouseColumns } from '@/components/warehouses/warehouses-columns';
import { useWarehouses } from '@/hooks/use-warehouses';
import { usePermission } from '@/hooks/use-permission';
import type { WarehouseSummary } from '@/docs/schemas';

export default function WarehousesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering, setOrdering] = useState('name');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { canAdd, canChange, canDelete } = usePermission('warehouse');

  const { data, isLoading } = useWarehouses({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const handleOrdering = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setPage(0);
  }, []);

  const handleEdit = useCallback((warehouse: WarehouseSummary) => {
    setSelectedWarehouseId(warehouse.id);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((warehouse: WarehouseSummary) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedWarehouseId(undefined);
  }, []);

  const columns = useMemo(
    () =>
      createWarehouseColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        setOrdering: handleOrdering,
        ordering,
        canChange,
        canDelete,
      }),
    [handleEdit, handleDelete, handleOrdering, ordering, canChange, canDelete],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Almacenes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los almacenes de la empresa
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        pageCount={pageCount}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        isLoading={isLoading}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: searchInput,
              onChange: setSearchInput,
              placeholder: 'Buscar por código o nombre…',
            }}
            actions={
              canAdd ? (
                <Button
                  size="sm"
                  onClick={() => { setSelectedWarehouseId(undefined); setSheetOpen(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo almacén</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              ) : undefined
            }
          />
        )}
      />

      <WarehouseSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        warehouseId={selectedWarehouseId}
      />

      <WarehouseDeleteDialog
        warehouse={warehouseToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setWarehouseToDelete(null);
        }}
      />
    </div>
  );
}
