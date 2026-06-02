'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info } from 'lucide-react';
import { useUpdateShipment } from '@/hooks/use-shipments';
import { useRoutesList } from '@/hooks/use-routes';
import { useVehiclesList } from '@/hooks/use-vehicles';
import { VEHICLE_TYPE_LABELS } from '@/components/vehicles/vehicles-columns';
import { STATUS_LABELS, PRIORITY_LABELS } from './shipments-columns';
import type { Shipment, ShipmentStatus } from '@/docs/schemas';

const shipmentEditSchema = z.object({
  status: z
    .enum([
      'PENDING', 'CONFIRMED', 'IN_WAREHOUSE', 'IN_TRANSIT',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED', 'RETURNED',
    ])
    .optional(),
  route: z.string().optional(),
  vehicle: z.string().optional(),
  base_cost: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  tax_amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  total_cost: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  actual_delivery: z.string().optional().or(z.literal('')),
  estimated_delivery: z.string().optional().or(z.literal('')),
});

type ShipmentEditValues = z.infer<typeof shipmentEditSchema>;

// Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return '';
  // ISO format: "2024-01-15T10:30:00Z" or "2024-01-15T10:30:00.000Z"
  return isoString.slice(0, 16);
}

interface ShipmentEditFormProps {
  defaultValues: Shipment;
  onSuccess: () => void;
}

export function ShipmentEditForm({ defaultValues, onSuccess }: ShipmentEditFormProps) {
  const form = useForm<ShipmentEditValues>({
    resolver: zodResolver(shipmentEditSchema),
    defaultValues: {
      status: defaultValues.status,
      route: defaultValues.route ? String(defaultValues.route.id) : 'none',
      vehicle: defaultValues.vehicle ? String(defaultValues.vehicle.id) : 'none',
      base_cost: defaultValues.base_cost,
      tax_amount: defaultValues.tax_amount,
      total_cost: defaultValues.total_cost,
      actual_delivery: toDatetimeLocal(defaultValues.actual_delivery),
      estimated_delivery: defaultValues.estimated_delivery ?? '',
    },
  });

  const updateMutation = useUpdateShipment(onSuccess);
  const routesQuery = useRoutesList();
  const vehiclesQuery = useVehiclesList();

  const isPending = updateMutation.isPending;

  function onSubmit(values: ShipmentEditValues) {
    const body: Record<string, unknown> = {};

    if (values.status !== undefined) {
      body.status = values.status;
    }

    // route: "" → null (clear); non-empty → parseInt; undefined → omit
    if (values.route !== undefined) {
      body.route = values.route === 'none' ? null : parseInt(values.route, 10);
    }

    // vehicle: "" → null (clear); non-empty → parseInt; undefined → omit
    if (values.vehicle !== undefined) {
      body.vehicle = values.vehicle === 'none' ? null : parseInt(values.vehicle, 10);
    }

    if (values.base_cost && values.base_cost !== '') {
      body.base_cost = values.base_cost;
    }
    if (values.tax_amount && values.tax_amount !== '') {
      body.tax_amount = values.tax_amount;
    }
    if (values.total_cost && values.total_cost !== '') {
      body.total_cost = values.total_cost;
    }

    if (values.estimated_delivery && values.estimated_delivery !== '') {
      body.estimated_delivery = values.estimated_delivery;
    }

    if (values.actual_delivery && values.actual_delivery !== '') {
      // datetime-local gives "YYYY-MM-DDTHH:mm"; append seconds if needed
      const dt = values.actual_delivery;
      body.actual_delivery = dt.length === 16 ? dt + ':00' : dt;
    }

    updateMutation.mutate({ id: defaultValues.id, data: body as Parameters<typeof updateMutation.mutate>[0]['data'] });
  }

  const routes = routesQuery.data?.results ?? [];
  const vehicles = vehiclesQuery.data?.results ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as ShipmentStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Route */}
        <FormField
          control={form.control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruta</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? 'none'}
                disabled={routesQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={routesQuery.isLoading ? 'Cargando...' : 'Sin ruta'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin ruta</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.code} — {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vehicle */}
        <FormField
          control={form.control}
          name="vehicle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehículo</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? 'none'}
                disabled={vehiclesQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={vehiclesQuery.isLoading ? 'Cargando...' : 'Sin vehículo'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin vehículo</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.plate} — {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cost explanation callout */}
        <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-medium">Cálculo del costo</p>
            <p className="text-blue-700">
              <span className="font-mono">Costo total = Costo base + IGV/Impuestos</span>
            </p>
            <p className="text-xs text-blue-600">
              El IGV en Perú es 18%. El costo total debe ingresarse manualmente — el sistema no lo calcula automáticamente.
            </p>
          </div>
        </div>

        {/* Base Cost */}
        <FormField
          control={form.control}
          name="base_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo base</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 150000.00" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax Amount */}
        <FormField
          control={form.control}
          name="tax_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IVA / impuestos</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 28500.00" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Total Cost */}
        <FormField
          control={form.control}
          name="total_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo total</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 178500.00" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimated Delivery */}
        <FormField
          control={form.control}
          name="estimated_delivery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha estimada de entrega — opcional</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actual Delivery */}
        <FormField
          control={form.control}
          name="actual_delivery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha/hora de entrega — opcional</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Actualizar envío'}
        </Button>
      </form>
    </Form>
  );
}

// Re-export for use in other places
export { PRIORITY_LABELS };
