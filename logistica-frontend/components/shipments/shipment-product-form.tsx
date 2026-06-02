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
import { useAddShipmentProduct, useUpdateShipmentProduct } from '@/hooks/use-shipment-products';
import { useProductsList } from '@/hooks/use-products';
import type { ShipmentProduct } from '@/docs/schemas';

const shipmentProductSchema = z.object({
  product: z.string().min(1, 'El producto es requerido'),
  quantity: z
    .number({ error: 'Debe ser un número entero' })
    .int()
    .positive('La cantidad debe ser mayor que 0'),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  notes: z.string().optional(),
});

type ShipmentProductValues = z.infer<typeof shipmentProductSchema>;

interface ShipmentProductFormProps {
  defaultValues?: ShipmentProduct;
  shipmentId: number;
  onSuccess: () => void;
}

export function ShipmentProductForm({
  defaultValues,
  shipmentId,
  onSuccess,
}: ShipmentProductFormProps) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<ShipmentProductValues>({
    resolver: zodResolver(shipmentProductSchema),
    defaultValues: {
      product: defaultValues ? String(defaultValues.product.id) : '',
      quantity: defaultValues?.quantity ?? 1,
      unit_price: defaultValues?.unit_price ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const addMutation = useAddShipmentProduct(onSuccess);
  const updateMutation = useUpdateShipmentProduct(onSuccess);
  const productsQuery = useProductsList();

  const isPending = addMutation.isPending || updateMutation.isPending;
  const products = productsQuery.data?.results ?? [];

  function onSubmit(values: ShipmentProductValues) {
    const handleError = (err: AxiosError) => {
      const data = err.response?.data as Record<string, string[]> | undefined;
      if (data?.product) {
        form.setError('product', { message: data.product[0] });
      }
    };

    if (isEdit && defaultValues) {
      const editBody = {
        quantity: values.quantity,
        unit_price: values.unit_price,
        ...(values.notes && values.notes !== '' ? { notes: values.notes } : {}),
      };
      updateMutation.mutate(
        { shipmentId, productId: defaultValues.id, data: editBody },
        { onError: handleError },
      );
    } else {
      const addBody = {
        product: parseInt(values.product, 10),
        quantity: values.quantity,
        unit_price: values.unit_price,
        ...(values.notes && values.notes !== '' ? { notes: values.notes } : {}),
      };
      addMutation.mutate(
        { shipmentId, data: addBody },
        { onError: handleError },
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* Product Select */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  // Auto-fill unit_price from selected product
                  const selected = products.find((p) => String(p.id) === val);
                  if (selected) {
                    form.setValue('unit_price', selected.unit_price);
                  }
                }}
                value={field.value}
                disabled={isEdit || productsQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        productsQuery.isLoading ? 'Cargando...' : 'Seleccionar producto'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.sku} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej. 5"
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

        {/* Unit Price */}
        <FormField
          control={form.control}
          name="unit_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio unitario</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 2500000.00" {...field} />
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
          {isPending
            ? 'Guardando...'
            : isEdit
              ? 'Actualizar producto'
              : 'Agregar producto'}
        </Button>
      </form>
    </Form>
  );
}
