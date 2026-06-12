import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirrored from components/customers/customer-form.tsx (not exported)
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

type FieldErrors = Record<string, string[] | undefined>;

function fieldErrors(input: Record<string, unknown>): FieldErrors {
  const r = customerSchema.safeParse(input);
  if (r.success) return {};
  return r.error.flatten().fieldErrors as FieldErrors;
}

const validBase = {
  name: 'ACME Corp',
  email: 'acme@corp.com',
  customer_type: 'COMPANY' as const,
};

// ─── valid cases ─────────────────────────────────────────────────────────────

describe('customerSchema — valid', () => {
  it('passes with minimal required fields', () => {
    expect(customerSchema.safeParse(validBase).success).toBe(true);
  });

  it('passes with all optional fields present', () => {
    const r = customerSchema.safeParse({
      ...validBase,
      customer_type: 'INDIVIDUAL',
      tax_id: '123456',
      phone: '+57 300 000 0000',
      address: 'Calle 1',
      city: 'Bogotá',
      country: 'Colombia',
      is_active: false,
    });
    expect(r.success).toBe(true);
  });

  it('accepts null for optional nullable fields', () => {
    const r = customerSchema.safeParse({ ...validBase, tax_id: null, phone: null });
    expect(r.success).toBe(true);
  });

  it('accepts INDIVIDUAL as customer_type', () => {
    expect(customerSchema.safeParse({ ...validBase, customer_type: 'INDIVIDUAL' }).success).toBe(true);
  });
});

// ─── required field errors ────────────────────────────────────────────────────

describe('customerSchema — required fields', () => {
  it('fails with message when name is empty', () => {
    const errs = fieldErrors({ ...validBase, name: '' });
    expect(errs.name).toContain('El nombre es requerido');
  });

  it('fails when name is missing', () => {
    const { name: _, ...rest } = validBase;
    expect(customerSchema.safeParse(rest).success).toBe(false);
  });

  it('fails with message when email is invalid', () => {
    const errs = fieldErrors({ ...validBase, email: 'not-an-email' });
    expect(errs.email).toContain('Correo inválido');
  });

  it('fails when email is missing', () => {
    const { email: _, ...rest } = validBase;
    expect(customerSchema.safeParse(rest).success).toBe(false);
  });

  it('fails when customer_type is invalid enum value', () => {
    const r = customerSchema.safeParse({ ...validBase, customer_type: 'PARTNER' });
    expect(r.success).toBe(false);
  });

  it('fails when customer_type is missing', () => {
    const { customer_type: _, ...rest } = validBase;
    expect(customerSchema.safeParse(rest).success).toBe(false);
  });
});
