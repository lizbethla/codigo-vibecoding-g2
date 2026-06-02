'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
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
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/use-suppliers';
import type { Supplier } from '@/docs/schemas';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  contact_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  is_active: z.boolean().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  defaultValues?: Supplier;
  onSuccess: () => void;
}

export function SupplierForm({ defaultValues, onSuccess }: SupplierFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      contact_name: defaultValues?.contact_name ?? '',
      tax_id: defaultValues?.tax_id ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const createMutation = useCreateSupplier(onSuccess);
  const updateMutation = useUpdateSupplier(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: SupplierFormValues) {
    // Clean up empty strings to null for optional fields; default country to Perú
    const cleanedValues = {
      ...values,
      contact_name: values.contact_name || null,
      tax_id: values.tax_id || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      country: values.country || 'Perú',
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: cleanedValues },
        {
          onError: (err: AxiosError) => {
            const data = err.response?.data as Record<string, string[]> | undefined;
            if (data?.tax_id) {
              form.setError('tax_id', { message: data.tax_id[0] });
            }
          },
        },
      );
    } else {
      createMutation.mutate(
        cleanedValues as Parameters<typeof createMutation.mutate>[0],
        {
          onError: (err: AxiosError) => {
            const data = err.response?.data as Record<string, string[]> | undefined;
            if (data?.tax_id) {
              form.setError('tax_id', { message: data.tax_id[0] });
            }
          },
        },
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del proveedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact name */}
        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de contacto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax ID */}
        <FormField
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIT</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Country */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input
                  placeholder="Perú"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* is_active — only shown in edit mode */}
        {isEdit && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Activo</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando…' : isEdit ? 'Actualizar proveedor' : 'Crear proveedor'}
        </Button>
      </form>
    </Form>
  );
}
