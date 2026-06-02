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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { useDriversList } from '@/hooks/use-drivers';
import {
  VEHICLE_TYPE_LABELS,
  STATUS_LABELS,
  FUEL_TYPE_LABELS,
} from './vehicles-columns';
import type { Vehicle, VehicleCreate, VehicleUpdate, VehicleType, FuelType, VehicleStatus } from '@/docs/schemas';

const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[];
const FUEL_TYPES = Object.keys(FUEL_TYPE_LABELS) as FuelType[];
const STATUSES = Object.keys(STATUS_LABELS) as VehicleStatus[];

const vehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').max(20, 'Máximo 20 caracteres'),
  vehicle_type: z.enum([
    'MOTORCYCLE',
    'VAN',
    'TRUCK',
    'HEAVY_TRUCK',
    'REFRIGERATED_TRUCK',
    'CONTAINER',
  ]),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z
    .number({ error: 'Debe ser un número entero' })
    .int()
    .min(1900, 'Año mínimo 1900')
    .max(2100, 'Año máximo 2100'),
  capacity_kg: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  capacity_m3: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  fuel_type: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS']).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']).optional(),
  driver: z.string().optional(), // driver id as string; "" means clear assignment (send null)
  last_maintenance: z.string().optional().or(z.literal('')),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  defaultValues?: Vehicle;
  onSuccess: () => void;
}

export function VehicleForm({ defaultValues, onSuccess }: VehicleFormProps) {
  const isEdit = !!defaultValues?.id;

  const { data: driversData, isLoading: driversLoading } = useDriversList();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: defaultValues?.plate ?? '',
      vehicle_type: defaultValues?.vehicle_type ?? 'VAN',
      brand: defaultValues?.brand ?? '',
      model: defaultValues?.model ?? '',
      year: defaultValues?.year ?? new Date().getFullYear(),
      capacity_kg: defaultValues?.capacity_kg ?? '',
      capacity_m3: defaultValues?.capacity_m3 ?? '',
      fuel_type: defaultValues?.fuel_type ?? 'DIESEL',
      status: defaultValues?.status ?? 'AVAILABLE',
      driver: defaultValues?.driver ? String(defaultValues.driver.id) : 'none',
      last_maintenance: defaultValues?.last_maintenance ?? '',
    },
  });

  const createMutation = useCreateVehicle(onSuccess);
  const updateMutation = useUpdateVehicle(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: VehicleFormValues) {
    // Clean values before sending to API
    type ApiBody = {
      plate: string;
      vehicle_type: VehicleType;
      brand: string;
      model: string;
      year: number;
      capacity_kg: string;
      capacity_m3?: string;
      fuel_type?: FuelType;
      status?: VehicleStatus;
      driver?: number | null;
      last_maintenance?: string;
    };

    const body: ApiBody = {
      plate: values.plate,
      vehicle_type: values.vehicle_type,
      brand: values.brand,
      model: values.model,
      year: values.year,
      capacity_kg: values.capacity_kg,
    };

    // capacity_m3: if empty string, omit
    if (values.capacity_m3 && values.capacity_m3 !== '') {
      body.capacity_m3 = values.capacity_m3;
    }

    // fuel_type: if defined, include
    if (values.fuel_type !== undefined) {
      body.fuel_type = values.fuel_type;
    }

    // status: if defined, include
    if (values.status !== undefined) {
      body.status = values.status;
    }

    // driver: "" → send null to clear; non-empty string → send parseInt; undefined → omit
    if (values.driver === 'none') {
      body.driver = null;
    } else if (values.driver !== undefined && values.driver !== 'none') {
      body.driver = parseInt(values.driver, 10);
    }

    // last_maintenance: if empty or undefined, omit
    if (values.last_maintenance && values.last_maintenance !== '') {
      body.last_maintenance = values.last_maintenance;
    }

    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.plate) {
        form.setError('plate', { message: data.plate[0] });
      }
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: body as VehicleUpdate },
        { onError: handleError },
      );
    } else {
      createMutation.mutate(body as VehicleCreate, { onError: handleError });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Plate */}
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="Ej. ABC-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vehicle Type */}
        <FormField
          control={form.control}
          name="vehicle_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de vehículo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_TYPES.map((vt) => (
                    <SelectItem key={vt} value={vt}>
                      {VEHICLE_TYPE_LABELS[vt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Toyota" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Model */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Hilux" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  step="1"
                  placeholder="Ej. 2022"
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

        {/* Capacity kg */}
        <FormField
          control={form.control}
          name="capacity_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (kg)</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 1500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capacity m3 (optional) */}
        <FormField
          control={form.control}
          name="capacity_m3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (m³) — opcional</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 4.5" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fuel Type */}
        <FormField
          control={form.control}
          name="fuel_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Combustible</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'DIESEL'}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona combustible" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUEL_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {FUEL_TYPE_LABELS[ft]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'AVAILABLE'}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Driver */}
        <FormField
          control={form.control}
          name="driver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conductor</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? 'none'}
                disabled={driversLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={driversLoading ? 'Cargando...' : 'Sin conductor'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin conductor</SelectItem>
                  {(driversData?.results ?? []).map((driver) => {
                    const user = driver.user;
                    const fullName =
                      user.first_name.trim() || user.last_name.trim()
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : user.username;
                    return (
                      <SelectItem key={driver.id} value={String(driver.id)}>
                        {fullName} — {driver.national_id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Maintenance (optional) */}
        <FormField
          control={form.control}
          name="last_maintenance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Último mantenimiento — opcional</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? 'Guardando...'
            : isEdit
              ? 'Actualizar vehículo'
              : 'Crear vehículo'}
        </Button>
      </form>
    </Form>
  );
}
