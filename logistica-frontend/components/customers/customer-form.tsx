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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import type { Customer } from '@/docs/schemas';

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  customer_type: z.enum(['COMPANY', 'INDIVIDUAL']),
  tax_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  is_active: z.boolean().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  defaultValues?: Customer;
  onSuccess: () => void;
}

export function CustomerForm({ defaultValues, onSuccess }: CustomerFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      customer_type: defaultValues?.customer_type ?? 'COMPANY',
      tax_id: defaultValues?.tax_id ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const createMutation = useCreateCustomer(onSuccess);
  const updateMutation = useUpdateCustomer(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: CustomerFormValues) {
    // Clean up empty strings to null for optional fields
    const cleanedValues = {
      ...values,
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
      createMutation.mutate(cleanedValues as Parameters<typeof createMutation.mutate>[0], {
        onError: (err: AxiosError) => {
          const data = err.response?.data as Record<string, string[]> | undefined;
          if (data?.tax_id) {
            form.setError('tax_id', { message: data.tax_id[0] });
          }
        },
      });
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
                <Input placeholder="Nombre del cliente" {...field} />
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

        {/* Customer type */}
        <FormField
          control={form.control}
          name="customer_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COMPANY">Empresa</SelectItem>
                  <SelectItem value="INDIVIDUAL">Particular</SelectItem>
                </SelectContent>
              </Select>
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
              <FormLabel>NIT / Cédula</FormLabel>
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
          {isPending ? 'Guardando…' : isEdit ? 'Actualizar cliente' : 'Crear cliente'}
        </Button>
      </form>
    </Form>
  );
}
