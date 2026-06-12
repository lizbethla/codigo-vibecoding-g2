'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '@/components/admin/user-form';
import { useUser, useUpdateUser } from '@/hooks/use-users';
import type { AppUserUpdate, AppUserCreate } from '@/docs/schemas';

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const { data: user, isLoading } = useUser(userId);
  const updateMutation = useUpdateUser(userId);

  function handleSubmit(data: AppUserUpdate | AppUserCreate) {
    updateMutation.mutate(data as AppUserUpdate, {
      onSuccess: () => router.push('/admin/users'),
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-1.5 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isLoading ? 'Cargando...' : `Editar: ${user?.username}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modificar datos del usuario</p>
        </div>
      </div>

      {updateMutation.isError && (
        <div className="rounded-lg bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-400">
          Error al actualizar el usuario. Verifica los datos e intenta de nuevo.
        </div>
      )}

      {!isLoading && user && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
          <UserForm
            initial={user}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            isEdit
          />
        </div>
      )}
    </div>
  );
}
