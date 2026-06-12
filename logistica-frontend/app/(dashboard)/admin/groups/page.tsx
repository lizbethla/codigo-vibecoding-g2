'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { GroupSheet } from '@/components/admin/groups/group-sheet';
import { GroupDeleteDialog } from '@/components/admin/groups/group-delete-dialog';
import { createGroupColumns } from '@/components/admin/groups/group-columns';
import { useGroups } from '@/hooks/use-users';
import type { Group } from '@/docs/schemas';

export default function AdminGroupsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGroups();

  const handleEdit = useCallback((group: Group) => {
    setSelectedGroup(group);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedGroup(undefined);
  }, []);

  const columns = useMemo(
    () => createGroupColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const allGroups = data?.results ?? [];
  const filtered = search
    ? allGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : allGroups;

  const pageCount = Math.ceil(filtered.length / pageSize);
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Grupos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los grupos y sus permisos
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
              placeholder: 'Buscar grupo…',
            }}
            actions={
              <Button
                size="sm"
                onClick={() => { setSelectedGroup(undefined); setSheetOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo grupo</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <GroupSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        group={selectedGroup}
      />

      <GroupDeleteDialog
        group={groupToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setGroupToDelete(null);
        }}
      />
    </div>
  );
}
