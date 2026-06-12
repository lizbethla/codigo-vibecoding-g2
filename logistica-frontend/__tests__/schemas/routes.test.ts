import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─── routeSchema — mirrored from components/routes/route-form.tsx ─────────────

const routeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(30, 'Máximo 30 caracteres'),
  origin_city: z.string().min(1, 'La ciudad de origen es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  distance_km: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  estimated_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

// ─── stopSchema — mirrored from components/routes/stop-form.tsx ──────────────

const stopSchema = z.object({
  stop_name: z.string().min(1, 'El nombre de la parada es requerido'),
  order: z
    .number({ error: 'Debe ser un número entero' })
    .int()
    .positive('El orden debe ser mayor que 0'),
  estimated_arrival_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

function fieldErrors(schema: z.ZodTypeAny, input: Record<string, unknown>) {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

// ─── routeSchema tests ────────────────────────────────────────────────────────

const validRoute = {
  name: 'Lima - Arequipa',
  code: 'LIM-AQP-01',
  origin_city: 'Lima',
  destination_city: 'Arequipa',
};

describe('routeSchema', () => {
  it('passes with minimal required fields', () => {
    expect(routeSchema.safeParse(validRoute).success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = routeSchema.safeParse({
      ...validRoute,
      distance_km: '1008.00',
      estimated_hours: '14.00',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('passes with empty string optionals', () => {
    expect(routeSchema.safeParse({ ...validRoute, distance_km: '', estimated_hours: '' }).success).toBe(true);
  });

  it('fails when name is empty', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, name: '' }).name).toContain('El nombre es requerido');
  });

  it('fails when code is empty', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, code: '' }).code).toContain('El código es requerido');
  });

  it('fails when code exceeds 30 characters', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, code: 'X'.repeat(31) }).code).toContain('Máximo 30 caracteres');
  });

  it('fails when origin_city is empty', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, origin_city: '' }).origin_city).toContain('La ciudad de origen es requerida');
  });

  it('fails when destination_city is empty', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, destination_city: '' }).destination_city).toContain('La ciudad de destino es requerida');
  });

  it('fails when distance_km is non-numeric', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, distance_km: 'far' }).distance_km).toBeDefined();
  });

  it('fails when estimated_hours is non-numeric', () => {
    expect(fieldErrors(routeSchema, { ...validRoute, estimated_hours: 'many' }).estimated_hours).toBeDefined();
  });
});

// ─── stopSchema tests ─────────────────────────────────────────────────────────

const validStop = { stop_name: 'Terminal Norte', order: 1 };

describe('stopSchema', () => {
  it('passes with minimal required fields', () => {
    expect(stopSchema.safeParse(validStop).success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = stopSchema.safeParse({ ...validStop, estimated_arrival_hours: '2.50', notes: 'Near highway' });
    expect(result.success).toBe(true);
  });

  it('passes with empty string for estimated_arrival_hours', () => {
    expect(stopSchema.safeParse({ ...validStop, estimated_arrival_hours: '' }).success).toBe(true);
  });

  it('fails when stop_name is empty', () => {
    expect(fieldErrors(stopSchema, { ...validStop, stop_name: '' }).stop_name).toContain('El nombre de la parada es requerido');
  });

  it('fails when order is 0', () => {
    expect(fieldErrors(stopSchema, { ...validStop, order: 0 }).order).toContain('El orden debe ser mayor que 0');
  });

  it('fails when order is negative', () => {
    expect(fieldErrors(stopSchema, { ...validStop, order: -1 }).order).toContain('El orden debe ser mayor que 0');
  });

  it('fails when order is a string', () => {
    expect(fieldErrors(stopSchema, { ...validStop, order: 'first' }).order).toBeDefined();
  });

  it('fails when estimated_arrival_hours is non-numeric', () => {
    expect(fieldErrors(stopSchema, { ...validStop, estimated_arrival_hours: 'soon' }).estimated_arrival_hours).toBeDefined();
  });
});
