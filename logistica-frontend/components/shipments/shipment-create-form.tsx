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
import { useCreateShipment } from '@/hooks/use-shipments';
import { useCustomersList } from '@/hooks/use-customers';
import { useWarehousesList } from '@/hooks/use-warehouses';
import { useRoutesList } from '@/hooks/use-routes';
import { useVehiclesList } from '@/hooks/use-vehicles';
import { VEHICLE_TYPE_LABELS } from '@/components/vehicles/vehicles-columns';
import { PRIORITY_LABELS } from './shipments-columns';

const shipmentCreateSchema = z.object({
  customer: z.string().min(1, 'El cliente es requerido'),
  origin_warehouse: z.string().min(1, 'El almacén de origen es requerido'),
  origin_address: z.string().min(1, 'La dirección de origen es requerida'),
  destination_address: z.string().min(1, 'La dirección de destino es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  destination_country: z.string().optional(),
  recipient_name: z.string().min(1, 'El nombre del destinatario es requerido'),
  recipient_phone: z.string().optional(),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  route: z.string().optional(),
  vehicle: z.string().optional(),
  notes: z.string().optional(),
});

type ShipmentCreateValues = z.infer<typeof shipmentCreateSchema>;

interface ShipmentCreateFormProps {
  onSuccess: () => void;
}

export function ShipmentCreateForm({ onSuccess }: ShipmentCreateFormProps) {
  const form = useForm<ShipmentCreateValues>({
    resolver: zodResolver(shipmentCreateSchema),
    defaultValues: {
      customer: '',
      origin_warehouse: '',
      origin_address: '',
      destination_address: '',
      destination_city: '',
      destination_country: '',
      recipient_name: '',
      recipient_phone: '',
      scheduled_date: '',
      priority: undefined,
      route: 'none',
      vehicle: 'none',
      notes: '',
    },
  });

  const createMutation = useCreateShipment(onSuccess);
  const customersQuery = useCustomersList();
  const warehousesQuery = useWarehousesList();
  const routesQuery = useRoutesList();
  const vehiclesQuery = useVehiclesList();

  const isPending = createMutation.isPending;

  function onSubmit(values: ShipmentCreateValues) {
    const body: Record<string, unknown> = {
      customer: parseInt(values.customer, 10),
      origin_warehouse: parseInt(values.origin_warehouse, 10),
      origin_address: values.origin_address,
      destination_address: values.destination_address,
      destination_city: values.destination_city,
      recipient_name: values.recipient_name,
      scheduled_date: values.scheduled_date,
    };

    if (values.destination_country && values.destination_country !== '') {
      body.destination_country = values.destination_country;
    }
    if (values.recipient_phone && values.recipient_phone !== '') {
      body.recipient_phone = values.recipient_phone;
    }
    if (values.priority) {
      body.priority = values.priority;
    }
    if (values.route && values.route !== 'none') {
      body.route = parseInt(values.route, 10);
    }
    if (values.vehicle && values.vehicle !== 'none') {
      body.vehicle = parseInt(values.vehicle, 10);
    }
    if (values.notes && values.notes !== '') {
      body.notes = values.notes;
    }

    createMutation.mutate(body as unknown as Parameters<typeof createMutation.mutate>[0]);
  }

  const customers = customersQuery.data?.results ?? [];
  const warehouses = warehousesQuery.data?.results ?? [];
  const routes = routesQuery.data?.results ?? [];
  const vehicles = vehiclesQuery.data?.results ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Customer */}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={customersQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={customersQuery.isLoading ? 'Cargando...' : 'Seleccionar cliente'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin Warehouse */}
        <FormField
          control={form.control}
          name="origin_warehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de origen</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={warehousesQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={warehousesQuery.isLoading ? 'Cargando...' : 'Seleccionar almacén'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} ({w.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin Address */}
        <FormField
          control={form.control}
          name="origin_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de origen</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Av. Javier Prado 123, Lima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination Address */}
        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de destino</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Carrera 15 # 30-40" {...field} />
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

        {/* Destination Country (optional) */}
        <FormField
          control={form.control}
          name="destination_country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País de destino — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Perú" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recipient Name */}
        <FormField
          control={form.control}
          name="recipient_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del destinatario</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Juan García" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recipient Phone (optional) */}
        <FormField
          control={form.control}
          name="recipient_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono del destinatario — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 3001234567" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scheduled Date */}
        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha programada</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridad — opcional</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Normal (por defecto)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PRIORITY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Route (optional) */}
        <FormField
          control={form.control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruta — opcional</FormLabel>
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

        {/* Vehicle (optional) */}
        <FormField
          control={form.control}
          name="vehicle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehículo — opcional</FormLabel>
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
          {isPending ? 'Creando...' : 'Crear envío'}
        </Button>
      </form>
    </Form>
  );
}
