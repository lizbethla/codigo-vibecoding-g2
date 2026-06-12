'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { UserSheet } from '@/components/admin/users/user-sheet';
import { UserDeleteDialog } from '@/components/admin/users/user-delete-dialog';
import { createUserColumns } from '@/components/admin/users/user-columns';
import { useUsers } from '@/hooks/use-users';
import type { AppUser } from '@/docs/schemas';

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useUsers();

  const handleEdit = useCallback((user: AppUser) => {
    setSelectedUser(user);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((user: AppUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedUser(undefined);
  }, []);

  const columns = useMemo(
    () => createUserColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const allUsers = data?.results ?? [];
  const filtered = search
    ? allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allUsers;

  const pageCount = Math.ceil(filtered.length / pageSize);
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestiona los usuarios y sus roles del sistema
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
              placeholder: 'Buscar por usuario o email…',
            }}
            actions={
              <Button
                size="sm"
                onClick={() => { setSelectedUser(undefined); setSheetOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo usuario</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            }
          />
        )}
      />

      <UserSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        user={selectedUser}
      />

      <UserDeleteDialog
        user={userToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setUserToDelete(null);
        }}
      />
    </div>
  );
}
