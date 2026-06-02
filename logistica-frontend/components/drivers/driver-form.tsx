'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useCreateDriver, useUpdateDriver } from '@/hooks/use-drivers';
import { LICENSE_TYPE_LABELS, STATUS_LABELS } from './drivers-columns';
import type { Driver, LicenseType, DriverStatus } from '@/docs/schemas';

const LICENSE_TYPES = Object.keys(LICENSE_TYPE_LABELS) as LicenseType[];
const STATUSES = Object.keys(STATUS_LABELS) as DriverStatus[];

const driverSchema = z.object({
  user: z
    .number({ error: 'Debe ser un numero entero' })
    .int()
    .positive('Debe ser un ID de usuario valido'),
  license_number: z.string().min(1, 'El numero de licencia es requerido'),
  license_type: z.enum(['A', 'B', 'C', 'CE', 'BTP']),
  license_expiry: z.string().min(1, 'La fecha de vencimiento es requerida'),
  phone: z.string().min(1, 'El telefono es requerido'),
  national_id: z.string().min(1, 'La cedula es requerida'),
  status: z.enum(['AVAILABLE', 'ON_ROUTE', 'OFF_DUTY', 'SUSPENDED']).optional(),
  date_of_birth: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverFormProps {
  defaultValues?: Driver;
  onSuccess: () => void;
}

function isExpiryWithin30Days(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

export function DriverForm({ defaultValues, onSuccess }: DriverFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      user: defaultValues?.user?.id ?? ('' as unknown as number),
      license_number: defaultValues?.license_number ?? '',
      license_type: defaultValues?.license_type ?? 'B',
      license_expiry: defaultValues?.license_expiry ?? '',
      phone: defaultValues?.phone ?? '',
      national_id: defaultValues?.national_id ?? '',
      status: defaultValues?.status ?? 'AVAILABLE',
      date_of_birth: defaultValues?.date_of_birth ?? '',
    },
  });

  const createMutation = useCreateDriver(onSuccess);
  const updateMutation = useUpdateDriver(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const licenseExpiry = form.watch('license_expiry');
  const showExpiryWarning = licenseExpiry ? isExpiryWithin30Days(licenseExpiry) : false;

  function onSubmit(values: DriverFormValues) {
    const body: {
      user: number;
      license_number: string;
      license_type: LicenseType;
      license_expiry: string;
      phone: string;
      national_id: string;
      status?: DriverStatus;
      date_of_birth?: string;
    } = {
      user: values.user,
      license_number: values.license_number,
      license_type: values.license_type,
      license_expiry: values.license_expiry,
      phone: values.phone,
      national_id: values.national_id,
    };

    if (values.status !== undefined) {
      body.status = values.status;
    }

    if (values.date_of_birth && values.date_of_birth !== '') {
      body.date_of_birth = values.date_of_birth;
    }

    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.user) {
        form.setError('user', { message: data.user[0] });
      }
      if (data?.license_number) {
        form.setError('license_number', { message: data.license_number[0] });
      }
      if (data?.national_id) {
        form.setError('national_id', { message: data.national_id[0] });
      }
    };

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: body },
        { onError: handleError },
      );
    } else {
      createMutation.mutate(body, { onError: handleError });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* User ID */}
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de usuario (Django User)</FormLabel>
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

        {/* License Number */}
        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero de licencia</FormLabel>
              <FormControl>
                <Input placeholder="Ej. LIC-12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* License Type */}
        <FormField
          control={form.control}
          name="license_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de licencia</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LICENSE_TYPES.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {LICENSE_TYPE_LABELS[lt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* License Expiry */}
        <FormField
          control={form.control}
          name="license_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimiento de licencia</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              {showExpiryWarning && (
                <Badge variant="destructive" className="mt-1">
                  Vence pronto
                </Badge>
              )}
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
              <FormLabel>Telefono</FormLabel>
              <FormControl>
                <Input placeholder="Ej. +57 300 000 0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* National ID */}
        <FormField
          control={form.control}
          name="national_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cedula</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 1000000000" {...field} />
              </FormControl>
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

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de nacimiento (opcional)</FormLabel>
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
              ? 'Actualizar conductor'
              : 'Crear conductor'}
        </Button>
      </form>
    </Form>
  );
}
