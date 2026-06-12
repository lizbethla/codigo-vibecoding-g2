'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { AppUser, AppUserCreate, AppUserUpdate } from '@/docs/schemas';
import { useGroups } from '@/hooks/use-users';

type UserFormValues = {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  groups: number[];
};

interface UserFormProps {
  initial?: AppUser;
  onSubmit: (data: AppUserCreate | AppUserUpdate) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function UserForm({ initial, onSubmit, isSubmitting, isEdit = false }: UserFormProps) {
  const { data: groupsData } = useGroups();
  const groups = groupsData?.results ?? [];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<UserFormValues>({
    defaultValues: {
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: false,
      groups: [],
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        username: initial.username,
        password: '',
        email: initial.email,
        first_name: initial.first_name,
        last_name: initial.last_name,
        is_active: initial.is_active,
        is_staff: initial.is_staff,
        groups: initial.groups.map((g) => g.id),
      });
    }
  }, [initial, reset]);

  function handleFormSubmit(values: UserFormValues) {
    if (isEdit) {
      const update: AppUserUpdate = { ...values };
      if (!update.password) delete update.password;
      onSubmit(update);
    } else {
      onSubmit(values as AppUserCreate);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600';
  const labelClass = 'block text-sm font-medium text-neutral-300 mb-1';
  const errorClass = 'mt-1 text-xs text-red-400';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Usuario *</label>
          <input
            {...register('username', { required: 'Requerido' })}
            className={inputClass}
            placeholder="usuario"
          />
          {errors.username && <p className={errorClass}>{errors.username.message}</p>}
        </div>

        <div>
          <label className={labelClass}>
            Contraseña {isEdit ? '(dejar vacío para no cambiar)' : '*'}
          </label>
          <input
            type="password"
            {...register('password', { required: isEdit ? false : 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
            className={inputClass}
            placeholder="••••••••"
          />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Nombre</label>
          <input {...register('first_name')} className={inputClass} placeholder="Nombre" />
        </div>

        <div>
          <label className={labelClass}>Apellido</label>
          <input {...register('last_name')} className={inputClass} placeholder="Apellido" />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Email</label>
          <input
            type="email"
            {...register('email', { pattern: { value: /^\S+@\S+$/, message: 'Email inválido' } })}
            className={inputClass}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded" />
          Activo
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
          <input type="checkbox" {...register('is_staff')} className="rounded" />
          Staff
        </label>
      </div>

      {groups.length > 0 && (
        <div>
          <label className={labelClass}>Grupos</label>
          <Controller
            control={control}
            name="groups"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-1.5 text-sm text-neutral-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={field.value.includes(g.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, g.id]);
                        } else {
                          field.onChange(field.value.filter((id) => id !== g.id));
                        }
                      }}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
