import { test, expect } from '@playwright/test';

// Este spec prueba la UI de login — corre sin storageState (project "auth-tests")
test.use({ storageState: { cookies: [], origins: [] } });

const VALID_USER = process.env.E2E_USERNAME ?? 'e2e_admin';
const VALID_PASS = process.env.E2E_PASSWORD ?? 'e2ePass123!';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('credenciales válidas redirigen a /dashboard', async ({ page }) => {
    await page.getByLabel('Usuario').fill(VALID_USER);
    await page.getByPlaceholder('Ingresa tu contraseña').fill(VALID_PASS);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('credenciales inválidas muestran mensaje de error', async ({ page }) => {
    await page.getByLabel('Usuario').fill('usuario_inexistente');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('contraseña_incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    // Wait for request to complete (button reverts from "Iniciando sesión…" back)
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled({ timeout: 20_000 });

    // El frontend muestra detail del backend o el fallback de la UI
    const errorEl = page.locator('[class*="destructive"] span').first();
    await expect(errorEl).toBeVisible({ timeout: 5_000 });
    await expect(errorEl).not.toBeEmpty();
  });
});
