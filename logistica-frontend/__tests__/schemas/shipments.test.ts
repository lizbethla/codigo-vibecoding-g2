import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─── shipmentCreateSchema — mirrored from components/shipments/shipment-create-form.tsx ─

const shipmentCreateSchema = z.object({
  customer: z.string().min(1, 'El cliente es requerido'),
  origin_warehouse: z.string().min(1, 'El almacén de origen es requerido'),
  origin_address: z.string().min(1, 'La dirección de origen es requerida'),
  destination_address: z.string().min(1, 'La dirección de destino es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  destination_country: z.string().optional(),
  recipient_name: z.string().min(1, 'El nombre del destinatario es requerido'),
  recipient_phone: z.string().optional(),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  route: z.string().optional(),
  vehicle: z.string().optional(),
  notes: z.string().optional(),
});

// ─── shipmentProductSchema — mirrored from components/shipments/shipment-product-form.tsx ─

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

function fieldErrors(schema: z.ZodTypeAny, input: Record<string, unknown>) {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

// ─── shipmentCreateSchema tests ───────────────────────────────────────────────

const validCreate = {
  customer: '1',
  origin_warehouse: '2',
  origin_address: 'Calle 123, Bogotá',
  destination_address: 'Av. 456, Medellín',
  destination_city: 'Medellín',
  recipient_name: 'Juan García',
  scheduled_date: '2024-06-15',
};

describe('shipmentCreateSchema', () => {
  it('passes with minimal required fields', () => {
    expect(shipmentCreateSchema.safeParse(validCreate).success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = shipmentCreateSchema.safeParse({
      ...validCreate,
      destination_country: 'Colombia',
      recipient_phone: '3001234567',
      priority: 'HIGH',
      route: '3',
      vehicle: '4',
      notes: 'Fragile items',
    });
    expect(result.success).toBe(true);
  });

  it('fails when customer is empty', () => {
    expect(fieldErrors(shipmentCreateSchema, { ...validCreate, customer: '' }).customer).toContain(
      'El cliente es requerido',
    );
  });

  it('fails when origin_warehouse is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, origin_warehouse: '' }).origin_warehouse,
    ).toContain('El almacén de origen es requerido');
  });

  it('fails when origin_address is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, origin_address: '' }).origin_address,
    ).toContain('La dirección de origen es requerida');
  });

  it('fails when destination_address is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, destination_address: '' })
        .destination_address,
    ).toContain('La dirección de destino es requerida');
  });

  it('fails when destination_city is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, destination_city: '' }).destination_city,
    ).toContain('La ciudad de destino es requerida');
  });

  it('fails when recipient_name is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, recipient_name: '' }).recipient_name,
    ).toContain('El nombre del destinatario es requerido');
  });

  it('fails when scheduled_date is empty', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, scheduled_date: '' }).scheduled_date,
    ).toContain('La fecha programada es requerida');
  });

  it('fails when priority is invalid enum value', () => {
    expect(
      fieldErrors(shipmentCreateSchema, { ...validCreate, priority: 'CRITICAL' }).priority,
    ).toBeDefined();
  });
});

// ─── shipmentProductSchema tests ──────────────────────────────────────────────

const validProduct = { product: '3', quantity: 5, unit_price: '2500000.00' };

describe('shipmentProductSchema', () => {
  it('passes with minimal required fields', () => {
    expect(shipmentProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it('passes with optional notes', () => {
    expect(
      shipmentProductSchema.safeParse({ ...validProduct, notes: 'Fragile' }).success,
    ).toBe(true);
  });

  it('fails when product is empty', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, product: '' }).product,
    ).toContain('El producto es requerido');
  });

  it('fails when quantity is 0', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, quantity: 0 }).quantity,
    ).toContain('La cantidad debe ser mayor que 0');
  });

  it('fails when quantity is negative', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, quantity: -1 }).quantity,
    ).toContain('La cantidad debe ser mayor que 0');
  });

  it('fails when quantity is a string', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, quantity: 'cinco' }).quantity,
    ).toBeDefined();
  });

  it('fails when unit_price is non-numeric', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, unit_price: 'caro' }).unit_price,
    ).toBeDefined();
  });

  it('fails when unit_price is empty', () => {
    expect(
      fieldErrors(shipmentProductSchema, { ...validProduct, unit_price: '' }).unit_price,
    ).toBeDefined();
  });
});
