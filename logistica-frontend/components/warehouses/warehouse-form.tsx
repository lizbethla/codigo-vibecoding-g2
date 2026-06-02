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
import { useCreateWarehouse, useUpdateWarehouse } from '@/hooks/use-warehouses';
import type { Warehouse } from '@/docs/schemas';

const warehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  country: z.string().optional(),
  capacity_m3: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .nullable(),
  latitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Latitud inválida')
    .optional()
    .nullable(),
  longitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Longitud inválida')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  defaultValues?: Warehouse;
  onSuccess: () => void;
}

export function WarehouseForm({ defaultValues, onSuccess }: WarehouseFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      capacity_m3: defaultValues?.capacity_m3 ?? null,
      latitude: defaultValues?.latitude ?? null,
      longitude: defaultValues?.longitude ?? null,
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const createMutation = useCreateWarehouse(onSuccess);
  const updateMutation = useUpdateWarehouse(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: WarehouseFormValues) {
    // Convert empty/null optional fields to undefined (WarehouseCreate/Update uses optional, not nullable)
    const cleanedValues = {
      name: values.name,
      code: values.code,
      address: values.address,
      city: values.city,
      country: values.country || 'Perú',
      capacity_m3: values.capacity_m3 || undefined,
      latitude: values.latitude || undefined,
      longitude: values.longitude || undefined,
      is_active: values.is_active,
    };

    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.code) {
        form.setError('code', { message: data.code[0] });
      }
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: cleanedValues },
        { onError: handleError },
      );
    } else {
      createMutation.mutate(cleanedValues, { onError: handleError });
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
                <Input placeholder="Nombre del almacén" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="BOG-01" {...field} />
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
                <Input placeholder="Dirección del almacén" {...field} />
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
                <Input placeholder="Ciudad" {...field} />
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

        {/* Capacity */}
        <FormField
          control={form.control}
          name="capacity_m3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (m³)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional, ej: 500.00"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Latitude */}
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitud</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional, ej: 4.7110"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Longitude */}
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitud</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional, ej: -74.0721"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
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
          {isPending
            ? 'Guardando…'
            : isEdit
              ? 'Actualizar almacén'
              : 'Crear almacén'}
        </Button>
      </form>
    </Form>
  );
}
