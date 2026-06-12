'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { RouteSheet } from '@/components/routes/route-sheet';
import { RouteDeleteDialog } from '@/components/routes/route-delete-dialog';
import { createRouteColumns } from '@/components/routes/routes-columns';
import { useRoutes } from '@/hooks/use-routes';
import { usePermission } from '@/hooks/use-permission';

export default function RoutesPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering] = useState('name');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [routeToDeleteName, setRouteToDeleteName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { canAdd, canChange, canDelete } = usePermission('route');

  const { data, isLoading } = useRoutes({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const onView = useCallback(
    (id: number) => { router.push(`/routes/${id}`); },
    [router],
  );

  const handleEdit = useCallback((id: number, _name: string) => {
    setSelectedRouteId(id);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((id: number, name: string) => {
    setRouteToDeleteId(id);
    setRouteToDeleteName(name);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedRouteId(undefined);
  }, []);

  const columns = useMemo(
    () => createRouteColumns({ onEdit: handleEdit, onDelete: handleDelete, onView, canChange, canDelete }),
    [handleEdit, handleDelete, onView, canChange, canDelete],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Rutas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona las rutas de entrega
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
              placeholder: 'Buscar por nombre o código…',
            }}
            actions={
              canAdd ? (
                <Button
                  size="sm"
                  onClick={() => { setSelectedRouteId(undefined); setSheetOpen(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nueva ruta</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              ) : undefined
            }
          />
        )}
      />

      <RouteSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        routeId={selectedRouteId}
      />

      <RouteDeleteDialog
        routeName={routeToDeleteName}
        routeId={routeToDeleteId}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setRouteToDeleteId(null);
            setRouteToDeleteName('');
          }
        }}
      />
    </div>
  );
}
