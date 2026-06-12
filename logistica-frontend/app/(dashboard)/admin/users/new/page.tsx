'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '@/components/admin/user-form';
import { useCreateUser } from '@/hooks/use-users';
import type { AppUserCreate, AppUserUpdate } from '@/docs/schemas';

export default function NewUserPage() {
  const router = useRouter();
  const createMutation = useCreateUser();

  function handleSubmit(data: AppUserCreate | AppUserUpdate) {
    createMutation.mutate(data as AppUserCreate, {
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
          <h1 className="text-xl font-semibold tracking-tight">Nuevo usuario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crear una nueva cuenta de usuario</p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-400">
          Error al crear el usuario. Verifica los datos e intenta de nuevo.
        </div>
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
        <UserForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
