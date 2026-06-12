import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema mirrored from components/vehicles/vehicle-form.tsx
const vehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').max(20, 'Máximo 20 caracteres'),
  vehicle_type: z.enum([
    'MOTORCYCLE', 'VAN', 'TRUCK', 'HEAVY_TRUCK', 'REFRIGERATED_TRUCK', 'CONTAINER',
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
  driver: z.string().optional(),
  last_maintenance: z.string().optional().or(z.literal('')),
});

function fieldErrors(input: Record<string, unknown>) {
  const result = vehicleSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

const valid = {
  plate: 'ABC-123',
  vehicle_type: 'VAN',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2022,
  capacity_kg: '1500.00',
};

describe('vehicleSchema', () => {
  it('passes with minimal required fields', () => {
    expect(vehicleSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with all optional fields filled', () => {
    const result = vehicleSchema.safeParse({
      ...valid,
      capacity_m3: '4.50',
      fuel_type: 'DIESEL',
      status: 'AVAILABLE',
      driver: '3',
      last_maintenance: '2024-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('passes with empty optional string fields', () => {
    const result = vehicleSchema.safeParse({
      ...valid,
      capacity_m3: '',
      last_maintenance: '',
    });
    expect(result.success).toBe(true);
  });

  it('fails when plate is empty', () => {
    const errors = fieldErrors({ ...valid, plate: '' });
    expect(errors.plate).toContain('La placa es requerida');
  });

  it('fails when plate exceeds 20 characters', () => {
    const errors = fieldErrors({ ...valid, plate: 'X'.repeat(21) });
    expect(errors.plate).toContain('Máximo 20 caracteres');
  });

  it('fails when brand is empty', () => {
    const errors = fieldErrors({ ...valid, brand: '' });
    expect(errors.brand).toContain('La marca es requerida');
  });

  it('fails when model is empty', () => {
    const errors = fieldErrors({ ...valid, model: '' });
    expect(errors.model).toContain('El modelo es requerido');
  });

  it('fails when year is below 1900', () => {
    const errors = fieldErrors({ ...valid, year: 1899 });
    expect(errors.year).toContain('Año mínimo 1900');
  });

  it('fails when year is above 2100', () => {
    const errors = fieldErrors({ ...valid, year: 2101 });
    expect(errors.year).toContain('Año máximo 2100');
  });

  it('fails when year is a string', () => {
    const errors = fieldErrors({ ...valid, year: 'abc' });
    expect(errors.year).toBeDefined();
  });

  it('fails when capacity_kg is empty', () => {
    const errors = fieldErrors({ ...valid, capacity_kg: '' });
    expect(errors.capacity_kg).toContain('Debe ser un número positivo');
  });

  it('fails when capacity_kg is non-numeric', () => {
    const errors = fieldErrors({ ...valid, capacity_kg: 'heavy' });
    expect(errors.capacity_kg).toContain('Debe ser un número positivo');
  });

  it('fails with invalid vehicle_type', () => {
    const errors = fieldErrors({ ...valid, vehicle_type: 'BIKE' });
    expect(errors.vehicle_type).toBeDefined();
  });

  it('fails with invalid status', () => {
    const errors = fieldErrors({ ...valid, status: 'BROKEN' });
    expect(errors.status).toBeDefined();
  });

  it('accepts all vehicle types', () => {
    for (const vehicle_type of ['MOTORCYCLE', 'VAN', 'TRUCK', 'HEAVY_TRUCK', 'REFRIGERATED_TRUCK', 'CONTAINER']) {
      expect(vehicleSchema.safeParse({ ...valid, vehicle_type }).success).toBe(true);
    }
  });

  it('accepts all fuel types', () => {
    for (const fuel_type of ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS']) {
      expect(vehicleSchema.safeParse({ ...valid, fuel_type }).success).toBe(true);
    }
  });
});
