import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema mirrored from components/warehouses/warehouse-form.tsx
const warehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  country: z.string().optional(),
  capacity_m3: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .nullable(),
  latitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Latitud inválida')
    .optional()
    .nullable(),
  longitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Longitud inválida')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

function fieldErrors(input: Record<string, unknown>) {
  const result = warehouseSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

const valid = {
  name: 'Almacén Central',
  code: 'BOG-01',
  address: 'Calle 1 # 2-3',
  city: 'Bogotá',
};

describe('warehouseSchema', () => {
  it('passes with minimal required fields', () => {
    expect(warehouseSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with all optional fields filled', () => {
    const result = warehouseSchema.safeParse({
      ...valid,
      country: 'Perú',
      capacity_m3: '500.00',
      latitude: '4.7110',
      longitude: '-74.0721',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('passes with null optional fields', () => {
    const result = warehouseSchema.safeParse({
      ...valid,
      capacity_m3: null,
      latitude: null,
      longitude: null,
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is empty', () => {
    const errors = fieldErrors({ ...valid, name: '' });
    expect(errors.name).toContain('El nombre es requerido');
  });

  it('fails when code is empty', () => {
    const errors = fieldErrors({ ...valid, code: '' });
    expect(errors.code).toContain('El código es requerido');
  });

  it('fails when code exceeds 20 characters', () => {
    const errors = fieldErrors({ ...valid, code: 'X'.repeat(21) });
    expect(errors.code).toContain('Máximo 20 caracteres');
  });

  it('fails when address is empty', () => {
    const errors = fieldErrors({ ...valid, address: '' });
    expect(errors.address).toContain('La dirección es requerida');
  });

  it('fails when city is empty', () => {
    const errors = fieldErrors({ ...valid, city: '' });
    expect(errors.city).toContain('La ciudad es requerida');
  });

  it('fails with invalid capacity_m3 (negative)', () => {
    const errors = fieldErrors({ ...valid, capacity_m3: '-100' });
    expect(errors.capacity_m3).toContain('Debe ser un número positivo');
  });

  it('fails with invalid latitude (non-numeric)', () => {
    const errors = fieldErrors({ ...valid, latitude: 'abc' });
    expect(errors.latitude).toContain('Latitud inválida');
  });

  it('fails with invalid longitude (non-numeric)', () => {
    const errors = fieldErrors({ ...valid, longitude: 'abc' });
    expect(errors.longitude).toContain('Longitud inválida');
  });

  it('accepts negative latitude/longitude', () => {
    const result = warehouseSchema.safeParse({ ...valid, latitude: '-4.711', longitude: '-74.07' });
    expect(result.success).toBe(true);
  });
});
