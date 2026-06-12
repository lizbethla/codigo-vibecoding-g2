import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema mirrored from components/products/product-form.tsx
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

function fieldErrors(input: Record<string, unknown>) {
  const result = productSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

const valid = {
  sku: 'PROD-001',
  name: 'Laptop Pro 15',
  category: 'LAPTOP',
  unit_price: '1500.00',
};

describe('productSchema', () => {
  it('passes with minimal required fields', () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with all optional fields filled', () => {
    const result = productSchema.safeParse({
      ...valid,
      supplier: '2',
      description: 'A great laptop',
      weight_kg: '2.00',
      dimensions_cm: '35x24x2',
      stock_quantity: 10,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('passes with null optional fields', () => {
    const result = productSchema.safeParse({
      ...valid,
      description: null,
      dimensions_cm: null,
    });
    expect(result.success).toBe(true);
  });

  it('fails when sku is empty', () => {
    const errors = fieldErrors({ ...valid, sku: '' });
    expect(errors.sku).toContain('El SKU es requerido');
  });

  it('fails when sku exceeds 50 characters', () => {
    const errors = fieldErrors({ ...valid, sku: 'X'.repeat(51) });
    expect(errors.sku).toContain('Máximo 50 caracteres');
  });

  it('fails when name is empty', () => {
    const errors = fieldErrors({ ...valid, name: '' });
    expect(errors.name).toContain('El nombre es requerido');
  });

  it('fails when unit_price is not a number', () => {
    const errors = fieldErrors({ ...valid, unit_price: 'abc' });
    expect(errors.unit_price).toContain('Debe ser un número positivo');
  });

  it('fails when unit_price is empty', () => {
    const errors = fieldErrors({ ...valid, unit_price: '' });
    expect(errors.unit_price).toContain('Debe ser un número positivo');
  });

  it('fails with invalid category value', () => {
    const errors = fieldErrors({ ...valid, category: 'INVALID' });
    expect(errors.category).toBeDefined();
  });

  it('accepts empty string for weight_kg', () => {
    expect(productSchema.safeParse({ ...valid, weight_kg: '' }).success).toBe(true);
  });

  it('fails with invalid weight_kg (non-numeric)', () => {
    const errors = fieldErrors({ ...valid, weight_kg: 'heavy' });
    expect(errors.weight_kg).toBeDefined();
  });

  it('fails when stock_quantity is negative', () => {
    const errors = fieldErrors({ ...valid, stock_quantity: -1 });
    expect(errors.stock_quantity).toContain('No puede ser negativo');
  });

  it('fails when stock_quantity is non-integer', () => {
    const errors = fieldErrors({ ...valid, stock_quantity: 1.5 });
    expect(errors.stock_quantity).toContain('Debe ser un número entero');
  });

  it('accepts all category values', () => {
    const categories = ['LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'NETWORKING', 'STORAGE', 'OTHER'];
    for (const category of categories) {
      expect(productSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });
});
