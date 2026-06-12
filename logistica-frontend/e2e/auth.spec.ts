import { test, expect } from '@playwright/test';

const VALID_USER = process.env.E2E_USERNAME ?? 'e2e_admin';
const VALID_PASS = process.env.E2E_PASSWORD ?? 'e2ePass123!';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

// ── Sin sesión ────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('credenciales válidas → redirige a /dashboard y muestra Sidebar + TopBar', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario').fill(VALID_USER);
    await page.getByPlaceholder('Ingresa tu contraseña').fill(VALID_PASS);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard/);

    // Sidebar visible with brand name
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside').getByText('Logística')).toBeVisible();

    // TopBar (sticky header) visible
    await expect(page.locator('header')).toBeVisible();
  });

  test('credenciales inválidas → muestra mensaje de error, no redirige', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario').fill('usuario_invalido_xyz123');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('pass_incorrecta_xyz123');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    // Wait for request to complete (button reverts from "Iniciando sesión…" back)
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled({ timeout: 20_000 });

    // Error banner visible and non-empty
    const errorEl = page.locator('div.text-destructive span').first();
    await expect(errorEl).toBeVisible({ timeout: 5_000 });
    await expect(errorEl).not.toBeEmpty();

    // Must remain on /login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Auth guard', () => {
  test('sin token en localStorage → /warehouses redirige a /login', async ({ page }) => {
    // Clear auth so AuthGuard sees no token (works even if chromium project preloads storageState)
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('logistica-auth'));

    // /warehouses is behind the (dashboard) layout's AuthGuard
    await page.goto('/warehouses');
    await page.waitForURL('**/login', { timeout: 15_000 });
    await expect(page).toHaveURL(/login/);
  });
});

// ── Con sesión activa (storageState del proyecto chromium) ────────────────────

test.describe('Sesión activa', () => {
  test('Cerrar sesión → limpia tokens, redirige a /login; /dashboard también redirige a /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Open avatar dropdown in TopBar and click logout
    await page.locator('header button[class*="rounded-full"]').click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);

    // Attempt protected route — must redirect again to /login
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});

// ── (Avanzado) Refresco automático de token ───────────────────────────────────

test.describe('Refresco automático de token', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('access token inválido + refresh válido → request reintentada, usuario NO expulsado', async ({ page, request }) => {
    // Obtain a real refresh token via API
    const tokenRes = await request.post(`${API_URL}/auth/token/`, {
      data: { username: VALID_USER, password: VALID_PASS },
    });
    expect(tokenRes.ok(), `Token request failed: ${await tokenRes.text()}`).toBeTruthy();
    const { refresh } = await tokenRes.json();

    // Navigate to landing (public) so we can write to the origin's localStorage
    await page.goto('/');

    // Seed Zustand persisted state: bad access token + real refresh token
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      {
        key: 'logistica-auth',
        value: {
          state: {
            accessToken: 'invalid.access.token',
            refreshToken: refresh,
            user: { username: VALID_USER },
            permissions: [],
          },
          version: 0,
        },
      },
    );

    // Navigate to protected route — triggers 401 → refresh → retry cycle
    await page.goto('/dashboard/warehouses');

    // Wait for all network activity to settle (covers the refresh + retry)
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Must stay on warehouses — NOT expelled to /login
    await expect(page).toHaveURL(/warehouses/);
    await expect(page).not.toHaveURL(/login/);
  });
});
