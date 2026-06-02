'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ShipmentCreateSheet } from '@/components/shipments/shipment-create-sheet';
import { ShipmentEditSheet } from '@/components/shipments/shipment-edit-sheet';
import { ShipmentDeleteDialog } from '@/components/shipments/shipment-delete-dialog';
import { createShipmentColumns } from '@/components/shipments/shipments-columns';
import { useShipments } from '@/hooks/use-shipments';

export default function ShipmentsPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering] = useState('-created_at');

  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToDeleteId, setShipmentToDeleteId] = useState<number | null>(null);
  const [shipmentToDeleteCode, setShipmentToDeleteCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useShipments({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const onView = useCallback(
    (id: number) => { router.push(`/shipments/${id}`); },
    [router],
  );

  const handleEdit = useCallback((id: number) => {
    setSelectedShipmentId(id);
    setEditSheetOpen(true);
  }, []);

  const handleDelete = useCallback((id: number, trackingCode: string) => {
    setShipmentToDeleteId(id);
    setShipmentToDeleteCode(trackingCode);
    setDeleteDialogOpen(true);
  }, []);

  const handleEditSheetOpenChange = useCallback((open: boolean) => {
    setEditSheetOpen(open);
    if (!open) setSelectedShipmentId(undefined);
  }, []);

  const columns = useMemo(
    () => createShipmentColumns({ onEdit: handleEdit, onDelete: handleDelete, onView }),
    [handleEdit, handleDelete, onView],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Envíos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los envíos y órdenes de entrega
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
              placeholder: 'Buscar por código o destinatario…',
            }}
            actions={
              <Button size="sm" onClick={() => setCreateSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo envío</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <ShipmentCreateSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
      />

      <ShipmentEditSheet
        open={editSheetOpen}
        onOpenChange={handleEditSheetOpenChange}
        shipmentId={selectedShipmentId}
      />

      <ShipmentDeleteDialog
        trackingCode={shipmentToDeleteCode}
        shipmentId={shipmentToDeleteId}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setShipmentToDeleteId(null);
            setShipmentToDeleteCode('');
          }
        }}
      />
    </div>
  );
}
