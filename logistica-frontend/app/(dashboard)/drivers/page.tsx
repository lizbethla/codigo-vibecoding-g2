'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DriverSheet } from '@/components/drivers/driver-sheet';
import { DriverDeleteDialog } from '@/components/drivers/driver-delete-dialog';
import { createDriverColumns } from '@/components/drivers/drivers-columns';
import { useDrivers } from '@/hooks/use-drivers';
import { usePermission } from '@/hooks/use-permission';

export default function DriversPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering] = useState('status');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDeleteId, setDriverToDeleteId] = useState<number | null>(null);
  const [driverToDeleteName, setDriverToDeleteName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { canAdd, canChange, canDelete } = usePermission('driver');

  const { data, isLoading } = useDrivers({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const handleEdit = useCallback((id: number, name: string) => {
    void name;
    setSelectedDriverId(id);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((id: number, name: string) => {
    setDriverToDeleteId(id);
    setDriverToDeleteName(name);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedDriverId(undefined);
  }, []);

  const columns = useMemo(
    () => createDriverColumns({ onEdit: handleEdit, onDelete: handleDelete, canChange, canDelete }),
    [handleEdit, handleDelete, canChange, canDelete],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Conductores</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los conductores de la flota
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
              placeholder: 'Buscar por cédula o licencia…',
            }}
            actions={
              canAdd ? (
                <Button
                  size="sm"
                  onClick={() => { setSelectedDriverId(undefined); setSheetOpen(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo conductor</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              ) : undefined
            }
          />
        )}
      />

      <DriverSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        driverId={selectedDriverId}
      />

      <DriverDeleteDialog
        driverName={driverToDeleteName}
        driverId={driverToDeleteId}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDriverToDeleteId(null);
            setDriverToDeleteName('');
          }
        }}
      />
    </div>
  );
}
