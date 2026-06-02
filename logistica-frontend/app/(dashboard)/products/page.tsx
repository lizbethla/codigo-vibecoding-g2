'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ProductSheet } from '@/components/products/product-sheet';
import { ProductDeleteDialog } from '@/components/products/product-delete-dialog';
import { createProductColumns } from '@/components/products/products-columns';
import { useProducts, useUpdateProduct } from '@/hooks/use-products';
import type { Product } from '@/docs/schemas';

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [ordering, setOrdering] = useState('name');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useProducts({
    page: page + 1,
    page_size: pageSize,
    search: search || undefined,
    ordering,
  });

  const updateMutation = useUpdateProduct();

  const handleOrdering = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setPage(0);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    setSheetOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (product: Product) => {
      updateMutation.mutate({ id: product.id, data: { is_active: !product.is_active } });
    },
    [updateMutation],
  );

  const handleDelete = useCallback((product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedProduct(undefined);
  }, []);

  const columns = useMemo(
    () =>
      createProductColumns({
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
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona el catálogo de productos
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
              placeholder: 'Buscar por nombre o SKU…',
            }}
            actions={
              <Button
                size="sm"
                onClick={() => { setSelectedProduct(undefined); setSheetOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo producto</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <ProductSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        product={selectedProduct}
      />

      <ProductDeleteDialog
        product={productToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setProductToDelete(null);
        }}
      />
    </div>
  );
}
