'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { CustomerSheet } from '@/components/customers/customer-sheet';
import { CustomerDeleteDialog } from '@/components/customers/customer-delete-dialog';
import { createCustomerColumns } from '@/components/customers/customers-columns';
import { useCustomers, useUpdateCustomer } from '@/hooks/use-customers';
import { usePermission } from '@/hooks/use-permission';
import type { Customer } from '@/docs/schemas';

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering, setOrdering] = useState('name');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { canAdd, canChange, canDelete } = usePermission('customer');

  const { data, isLoading } = useCustomers({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const updateMutation = useUpdateCustomer();

  const handleOrdering = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setPage(0);
  }, []);

  const handleEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (customer: Customer) => {
      updateMutation.mutate({ id: customer.id, data: { is_active: !customer.is_active } });
    },
    [updateMutation],
  );

  const handleDelete = useCallback((customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedCustomer(undefined);
  }, []);

  const columns = useMemo(
    () =>
      createCustomerColumns({
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
        onDelete: handleDelete,
        setOrdering: handleOrdering,
        ordering,
        canChange,
        canDelete,
      }),
    [handleEdit, handleToggleActive, handleDelete, handleOrdering, ordering, canChange, canDelete],
  );

  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;
  const rows = data?.results ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona los clientes de la empresa
          </p>
        </div>
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
              canAdd ? (
                <Button
                  size="sm"
                  onClick={() => { setSelectedCustomer(undefined); setSheetOpen(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo cliente</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              ) : undefined
            }
          />
        )}
      />

      <CustomerSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        customer={selectedCustomer}
      />

      <CustomerDeleteDialog
        customer={customerToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCustomerToDelete(null);
        }}
      />
    </div>
  );
}
