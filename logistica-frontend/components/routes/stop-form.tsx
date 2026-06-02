'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateStop, useUpdateStop } from '@/hooks/use-route-stops';
import type { RouteStop, RouteStopCreate, RouteStopUpdate } from '@/docs/schemas';

const stopSchema = z.object({
  stop_name: z.string().min(1, 'El nombre de la parada es requerido'),
  order: z
    .number({ error: 'Debe ser un número entero' })
    .int()
    .positive('El orden debe ser mayor que 0'),
  estimated_arrival_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

type StopFormValues = z.infer<typeof stopSchema>;

interface StopFormProps {
  defaultValues?: RouteStop;
  routeId: number;
  onSuccess: () => void;
}

export function StopForm({ defaultValues, routeId, onSuccess }: StopFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      stop_name: defaultValues?.stop_name ?? '',
      order: defaultValues?.order ?? 1,
      estimated_arrival_hours: defaultValues?.estimated_arrival_hours ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const createMutation = useCreateStop(onSuccess);
  const updateMutation = useUpdateStop(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: StopFormValues) {
    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.order) {
        form.setError('order', { message: data.order[0] });
      }
    };

    // Build the body, omitting empty optional fields
    const body: RouteStopCreate | RouteStopUpdate = {
      stop_name: values.stop_name,
      order: values.order,
      ...(values.estimated_arrival_hours && values.estimated_arrival_hours !== ''
        ? { estimated_arrival_hours: values.estimated_arrival_hours }
        : {}),
      ...(values.notes && values.notes !== ''
        ? { notes: values.notes }
        : {}),
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { routeId, stopId: defaultValues.id, data: body as RouteStopUpdate },
        { onError: handleError },
      );
    } else {
      createMutation.mutate(
        { routeId, data: body as RouteStopCreate },
        { onError: handleError },
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Stop name */}
        <FormField
          control={form.control}
          name="stop_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la parada</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Terminal Norte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order */}
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej. 1"
                  {...field}
                  value={field.value === ('' as unknown as number) ? '' : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? ('' as unknown as number) : parseInt(val, 10));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimated arrival hours (optional) */}
        <FormField
          control={form.control}
          name="estimated_arrival_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas desde salida — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 2.5" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes (optional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas — opcional</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Notas adicionales..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar parada' : 'Agregar parada'}
        </Button>
      </form>
    </Form>
  );
}
