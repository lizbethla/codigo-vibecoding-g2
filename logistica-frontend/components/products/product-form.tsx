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
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import { useSuppliersList } from '@/hooks/use-suppliers';
import { CATEGORY_LABELS } from './products-columns';
import type { Product, ProductCategory } from '@/docs/schemas';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];

const productSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido').max(50, 'Máximo 50 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum([
    'LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET',
    'PERIPHERAL', 'NETWORKING', 'STORAGE', 'OTHER',
  ]),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  supplier: z.string().optional(),
  description: z.string().optional().nullable(),
  weight_kg: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  dimensions_cm: z.string().optional().nullable(),
  stock_quantity: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .optional(),
  is_active: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: Product;
  onSuccess: () => void;
}

export function ProductForm({ defaultValues, onSuccess }: ProductFormProps) {
  const isEdit = !!defaultValues?.id;

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliersList();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: defaultValues?.sku ?? '',
      name: defaultValues?.name ?? '',
      category: defaultValues?.category ?? 'LAPTOP',
      unit_price: defaultValues?.unit_price ?? '',
      supplier: defaultValues?.supplier ? String(defaultValues.supplier.id) : 'none',
      description: defaultValues?.description ?? '',
      weight_kg: defaultValues?.weight_kg ?? '',
      dimensions_cm: defaultValues?.dimensions_cm ?? '',
      stock_quantity: defaultValues?.stock_quantity ?? undefined,
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const createMutation = useCreateProduct(onSuccess);
  const updateMutation = useUpdateProduct(onSuccess);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: ProductFormValues) {
    // Clean values before sending to API
    const supplier =
      values.supplier && values.supplier !== 'none'
        ? parseInt(values.supplier, 10)
        : undefined;

    const cleanedValues: {
      sku: string;
      name: string;
      category: ProductCategory;
      unit_price: string;
      supplier?: number;
      description?: string;
      weight_kg?: string;
      dimensions_cm?: string;
      stock_quantity?: number;
      is_active?: boolean;
    } = {
      sku: values.sku,
      name: values.name,
      category: values.category,
      unit_price: values.unit_price,
    };

    if (supplier !== undefined) cleanedValues.supplier = supplier;
    if (values.description) cleanedValues.description = values.description;
    if (values.weight_kg && values.weight_kg !== '') cleanedValues.weight_kg = values.weight_kg;
    if (values.dimensions_cm) cleanedValues.dimensions_cm = values.dimensions_cm;
    if (values.stock_quantity !== undefined) cleanedValues.stock_quantity = values.stock_quantity;
    if (isEdit) cleanedValues.is_active = values.is_active;

    if (isEdit && defaultValues) {
      updateMutation.mutate(
        { id: defaultValues.id, data: cleanedValues },
        {
          onError: (err: AxiosError) => {
            const data = err.response?.data as Record<string, string[]> | undefined;
            if (data?.sku) {
              form.setError('sku', { message: data.sku[0] });
            }
          },
        },
      );
    } else {
      createMutation.mutate(cleanedValues as Parameters<typeof createMutation.mutate>[0], {
        onError: (err: AxiosError) => {
          const data = err.response?.data as Record<string, string[]> | undefined;
          if (data?.sku) {
            form.setError('sku', { message: data.sku[0] });
          }
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
        {/* SKU */}
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="Ej. PROD-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del producto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit price */}
        <FormField
          control={form.control}
          name="unit_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio unitario</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 1500.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? 'none'}
                disabled={suppliersLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={suppliersLoading ? 'Cargando…' : 'Sin proveedor'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {(suppliersData?.results ?? []).map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
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

        {/* Weight */}
        <FormField
          control={form.control}
          name="weight_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej. 1.5"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dimensions */}
        <FormField
          control={form.control}
          name="dimensions_cm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dimensiones (cm)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej. 30x20x10"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stock quantity */}
        <FormField
          control={form.control}
          name="stock_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad en stock</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
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
          {isPending ? 'Guardando…' : isEdit ? 'Actualizar producto' : 'Crear producto'}
        </Button>
      </form>
    </Form>
  );
}
