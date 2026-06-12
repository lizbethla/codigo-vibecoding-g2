'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateUser, useUpdateUser, useGroups } from '@/hooks/use-users';
import type { AppUser, AppUserCreate, AppUserUpdate } from '@/docs/schemas';

const schema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().optional(),
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  groups: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

interface UserFormProps {
  defaultValues?: AppUser;
  onSuccess: () => void;
}

export function UserForm({ defaultValues, onSuccess }: UserFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: groupsData } = useGroups();
  const allGroups = groupsData?.results ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: defaultValues?.username ?? '',
      password: '',
      email: defaultValues?.email ?? '',
      first_name: defaultValues?.first_name ?? '',
      last_name: defaultValues?.last_name ?? '',
      is_active: defaultValues?.is_active ?? true,
      is_staff: defaultValues?.is_staff ?? false,
      groups: (defaultValues?.groups ?? []).map((g) => g.id),
    },
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(defaultValues?.id ?? 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    if (isEdit) {
      const payload: AppUserUpdate = { ...values };
      if (!payload.password) delete payload.password;
      updateMutation.mutate(payload, { onSuccess });
    } else {
      if (!values.password || values.password.length < 8) {
        form.setError('password', { message: 'Mínimo 8 caracteres' });
        return;
      }
      createMutation.mutate(values as AppUserCreate, { onSuccess });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario *</FormLabel>
              <FormControl>
                <Input placeholder="nombre_usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contraseña {isEdit && <span className="text-muted-foreground font-normal">(dejar vacío para no cambiar)</span>}
                {!isEdit && '*'}
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Activo</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_staff"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Staff</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {allGroups.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Grupos</FormLabel>
            <Controller
              control={form.control}
              name="groups"
              render={({ field }) => (
                <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
                  {allGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Checkbox
                        checked={field.value.includes(g.id)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, g.id]
                              : field.value.filter((id) => id !== g.id),
                          );
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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando…' : isEdit ? 'Actualizar usuario' : 'Crear usuario'}
        </Button>
      </form>
    </Form>
  );
}
