import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema mirrored from components/suppliers/supplier-form.tsx
const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  contact_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  is_active: z.boolean().optional(),
});

function fieldErrors(input: Record<string, unknown>) {
  const result = supplierSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

const valid = {
  name: 'Tech Supplies S.A.',
  email: 'ventas@techsupplies.com',
};

describe('supplierSchema', () => {
  it('passes with minimal required fields', () => {
    expect(supplierSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with all optional fields filled', () => {
    const result = supplierSchema.safeParse({
      ...valid,
      contact_name: 'Ana Gómez',
      tax_id: '900-111-222',
      phone: '+57 300 111 2222',
      address: 'Av. Tecnología 100',
      city: 'Medellín',
      country: 'Perú',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('passes with null optional fields', () => {
    const result = supplierSchema.safeParse({
      ...valid,
      contact_name: null,
      tax_id: null,
      phone: null,
      address: null,
      city: null,
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is empty', () => {
    const errors = fieldErrors({ ...valid, name: '' });
    expect(errors.name).toContain('El nombre es requerido');
  });

  it('fails when name is missing', () => {
    const { name: _n, ...rest } = valid;
    const errors = fieldErrors(rest);
    expect(errors.name).toBeDefined();
  });

  it('fails when email is empty', () => {
    const errors = fieldErrors({ ...valid, email: '' });
    expect(errors.email).toContain('Correo inválido');
  });

  it('fails when email is invalid format', () => {
    const errors = fieldErrors({ ...valid, email: 'not-an-email' });
    expect(errors.email).toContain('Correo inválido');
  });

  it('fails when email is missing', () => {
    const { email: _e, ...rest } = valid;
    const errors = fieldErrors(rest);
    expect(errors.email).toBeDefined();
  });

  it('passes with is_active false', () => {
    expect(supplierSchema.safeParse({ ...valid, is_active: false }).success).toBe(true);
  });
});
