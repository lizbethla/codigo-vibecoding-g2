import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreated inline — mirrors components/auth/login-form.tsx loginSchema (not exported)
const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FieldErrors = Record<string, string[] | undefined>;

function fieldErrors(input: Record<string, string>): FieldErrors {
  const result = loginSchema.safeParse(input);
  if (result.success) return {};
  return result.error.flatten().fieldErrors as FieldErrors;
}

describe('loginSchema', () => {
  it('fails with required message when username is empty', () => {
    const errors = fieldErrors({ username: '', password: 'secret' });
    expect(errors.username).toContain('El usuario es requerido');
  });

  it('fails with required message when password is empty', () => {
    const errors = fieldErrors({ username: 'admin', password: '' });
    expect(errors.password).toContain('La contraseña es requerida');
  });

  it('fails both fields when both are empty', () => {
    const errors = fieldErrors({ username: '', password: '' });
    expect(errors.username).toContain('El usuario es requerido');
    expect(errors.password).toContain('La contraseña es requerida');
  });

  it('passes with valid username and password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'secret123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ username: 'admin', password: 'secret123' });
    }
  });

  it('fails when username field is missing', () => {
    const result = loginSchema.safeParse({ password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('fails when password field is missing', () => {
    const result = loginSchema.safeParse({ username: 'admin' });
    expect(result.success).toBe(false);
  });
});
