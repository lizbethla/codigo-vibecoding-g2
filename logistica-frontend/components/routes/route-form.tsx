'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateRoute, useUpdateRoute } from '@/hooks/use-routes';
import type { Route, RouteCreate, RouteUpdate } from '@/docs/schemas';

const routeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(30, 'Máximo 30 caracteres'),
  origin_city: z.string().min(1, 'La ciudad de origen es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  distance_km: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  estimated_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

type RouteFormValues = z.infer<typeof routeSchema>;

interface RouteFormProps {
  defaultValues?: Route;
  onSuccess: () => void;
}

export function RouteForm({ defaultValues, onSuccess }: RouteFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      origin_city: defaultValues?.origin_city ?? '',
      destination_city: defaultValues?.destination_city ?? '',
      distance_km: defaultValues?.distance_km ?? '',
      estimated_hours: defaultValues?.estimated_hours ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const createMutation = useCreateRoute(onSuccess);
  const updateMutation = useUpdateRoute(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: RouteFormValues) {
    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.code) {
        form.setError('code', { message: data.code[0] });
      }
    };

    // Build the body, omitting empty optional decimal strings
    const body: RouteCreate | RouteUpdate = {
      name: values.name,
      code: values.code,
      origin_city: values.origin_city,
      destination_city: values.destination_city,
      ...(values.distance_km && values.distance_km !== ''
        ? { distance_km: values.distance_km }
        : {}),
      ...(values.estimated_hours && values.estimated_hours !== ''
        ? { estimated_hours: values.estimated_hours }
        : {}),
      ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: body as RouteUpdate },
        { onError: handleError },
      );
    } else {
      createMutation.mutate(body as RouteCreate, { onError: handleError });
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
                <Input placeholder="Ej. Lima - Arequipa" {...field} />
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
                <Input placeholder="Ej. LIM-AQP-01" maxLength={30} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin City */}
        <FormField
          control={form.control}
          name="origin_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad de origen</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Lima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination City */}
        <FormField
          control={form.control}
          name="destination_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad de destino</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Arequipa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Distance km (optional) */}
        <FormField
          control={form.control}
          name="distance_km"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distancia (km) — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 450.5" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimated hours (optional) */}
        <FormField
          control={form.control}
          name="estimated_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiempo estimado (horas) — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 8.5" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* is_active */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Activa</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar ruta' : 'Crear ruta'}
        </Button>
      </form>
    </Form>
  );
}
