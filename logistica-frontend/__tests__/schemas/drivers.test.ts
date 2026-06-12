import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema mirrored from components/drivers/driver-form.tsx
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

function fieldErrors(input: Record<string, unknown>) {
  const result = driverSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

const valid = {
  user: 1,
  license_number: 'LIC-12345',
  license_type: 'C',
  license_expiry: '2027-06-01',
  phone: '+57 300 000 0000',
  national_id: '1000000001',
};

describe('driverSchema', () => {
  it('passes with minimal required fields', () => {
    expect(driverSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = driverSchema.safeParse({
      ...valid,
      status: 'AVAILABLE',
      date_of_birth: '1990-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('fails when user is not a positive integer', () => {
    const errors = fieldErrors({ ...valid, user: 0 });
    expect(errors.user).toContain('Debe ser un ID de usuario valido');
  });

  it('fails when user is a string', () => {
    const errors = fieldErrors({ ...valid, user: 'abc' });
    expect(errors.user).toBeDefined();
  });

  it('fails when license_number is empty', () => {
    const errors = fieldErrors({ ...valid, license_number: '' });
    expect(errors.license_number).toContain('El numero de licencia es requerido');
  });

  it('fails when license_expiry is empty', () => {
    const errors = fieldErrors({ ...valid, license_expiry: '' });
    expect(errors.license_expiry).toContain('La fecha de vencimiento es requerida');
  });

  it('fails when phone is empty', () => {
    const errors = fieldErrors({ ...valid, phone: '' });
    expect(errors.phone).toContain('El telefono es requerido');
  });

  it('fails when national_id is empty', () => {
    const errors = fieldErrors({ ...valid, national_id: '' });
    expect(errors.national_id).toContain('La cedula es requerida');
  });

  it('fails with invalid license_type', () => {
    const errors = fieldErrors({ ...valid, license_type: 'D' });
    expect(errors.license_type).toBeDefined();
  });

  it('fails with invalid status', () => {
    const errors = fieldErrors({ ...valid, status: 'RETIRED' });
    expect(errors.status).toBeDefined();
  });

  it('accepts all valid license types', () => {
    for (const license_type of ['A', 'B', 'C', 'CE', 'BTP']) {
      expect(driverSchema.safeParse({ ...valid, license_type }).success).toBe(true);
    }
  });

  it('accepts all valid statuses', () => {
    for (const status of ['AVAILABLE', 'ON_ROUTE', 'OFF_DUTY', 'SUSPENDED']) {
      expect(driverSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });
});
