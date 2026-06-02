'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { VehicleSheet } from '@/components/vehicles/vehicle-sheet';
import { VehicleDeleteDialog } from '@/components/vehicles/vehicle-delete-dialog';
import { createVehicleColumns } from '@/components/vehicles/vehicles-columns';
import { useVehicles } from '@/hooks/use-vehicles';

export default function VehiclesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering] = useState('plate');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDeleteId, setVehicleToDeleteId] = useState<number | null>(null);
  const [vehicleToDeletePlate, setVehicleToDeletePlate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useVehicles({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const handleEdit = useCallback((id: number, plate: string) => {
    void plate;
    setSelectedVehicleId(id);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((id: number, plate: string) => {
    setVehicleToDeleteId(id);
    setVehicleToDeletePlate(plate);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedVehicleId(undefined);
  }, []);

  const columns = useMemo(
    () => createVehicleColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Vehículos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona la flota de vehículos
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
              placeholder: 'Buscar por placa…',
            }}
            actions={
              <Button
                size="sm"
                onClick={() => { setSelectedVehicleId(undefined); setSheetOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo vehículo</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <VehicleSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        vehicleId={selectedVehicleId}
      />

      <VehicleDeleteDialog
        vehiclePlate={vehicleToDeletePlate}
        vehicleId={vehicleToDeleteId}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setVehicleToDeleteId(null);
            setVehicleToDeletePlate('');
          }
        }}
      />
    </div>
  );
}
