'use client';

import { useMemo } from 'react';
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
import { useCreateGroup, useUpdateGroup, usePermissions } from '@/hooks/use-users';
import type { Group, Permission } from '@/docs/schemas';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  permissions: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

interface GroupFormProps {
  defaultValues?: Group;
  onSuccess: () => void;
}

function groupByApp(permissions: Permission[]) {
  const map: Record<string, Permission[]> = {};
  for (const p of permissions) {
    if (!map[p.content_type_label]) map[p.content_type_label] = [];
    map[p.content_type_label].push(p);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

export function GroupForm({ defaultValues, onSuccess }: GroupFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: allPermissions = [] } = usePermissions();
  const grouped = useMemo(() => groupByApp(allPermissions), [allPermissions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      permissions: (defaultValues?.permissions ?? []).map((p) => p.id),
    },
  });

  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup(defaultValues?.id ?? 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    if (isEdit) {
      updateMutation.mutate(values, { onSuccess });
    } else {
      createMutation.mutate(values, { onSuccess });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del grupo *</FormLabel>
              <FormControl>
                <Input placeholder="ej. Operadores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {grouped.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Permisos</FormLabel>
            <Controller
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <div className="space-y-2 rounded-md border p-3 max-h-[420px] overflow-y-auto">
                  {grouped.map(([label, perms]) => {
                    const permIds = perms.map((p) => p.id);
                    const allChecked = permIds.every((id) => field.value.includes(id));
                    const someChecked = permIds.some((id) => field.value.includes(id));

                    function toggleGroup() {
                      if (allChecked) {
                        field.onChange(field.value.filter((id) => !permIds.includes(id)));
                      } else {
                        const merged = Array.from(new Set([...field.value, ...permIds]));
                        field.onChange(merged);
                      }
                    }

                    return (
                      <div key={label} className="space-y-1.5">
                        {/* App header */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={allChecked}
                            data-state={someChecked && !allChecked ? 'indeterminate' : undefined}
                            onCheckedChange={toggleGroup}
                          />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {label}
                          </span>
                        </label>
                        {/* Individual permissions */}
                        <div className="ml-5 grid grid-cols-2 gap-x-4 gap-y-1">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                            >
                              <Checkbox
                                checked={field.value.includes(perm.id)}
                                onCheckedChange={(checked) => {
                                  field.onChange(
                                    checked
                                      ? [...field.value, perm.id]
                                      : field.value.filter((id) => id !== perm.id),
                                  );
                                }}
                              />
                              <span className="truncate">{perm.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando…' : isEdit ? 'Actualizar grupo' : 'Crear grupo'}
        </Button>
      </form>
    </Form>
  );
}
