'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { SupplierSheet } from '@/components/suppliers/supplier-sheet';
import { SupplierDeleteDialog } from '@/components/suppliers/supplier-delete-dialog';
import { createSupplierColumns } from '@/components/suppliers/suppliers-columns';
import { useSuppliers, useUpdateSupplier } from '@/hooks/use-suppliers';
import type { Supplier } from '@/docs/schemas';

export default function SuppliersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering, setOrdering] = useState('name');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useSuppliers({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const updateMutation = useUpdateSupplier();

  const handleOrdering = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setPage(0);
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSheetOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (supplier: Supplier) => {
      updateMutation.mutate({ id: supplier.id, data: { is_active: !supplier.is_active } });
    },
    [updateMutation],
  );

  const handleDelete = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedSupplier(undefined);
  }, []);

  const columns = useMemo(
    () =>
      createSupplierColumns({
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
        onDelete: handleDelete,
        setOrdering: handleOrdering,
        ordering,
      }),
    [handleEdit, handleToggleActive, handleDelete, handleOrdering, ordering],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Proveedores</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los proveedores de la empresa
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
              placeholder: 'Buscar por nombre o correo…',
            }}
            actions={
              <Button
                size="sm"
                onClick={() => { setSelectedSupplier(undefined); setSheetOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo proveedor</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <SupplierSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        supplier={selectedSupplier}
      />

      <SupplierDeleteDialog
        supplier={supplierToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSupplierToDelete(null);
        }}
      />
    </div>
  );
}
