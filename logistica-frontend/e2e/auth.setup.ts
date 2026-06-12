import { test as setup, expect } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = path.join('playwright', '.auth', 'user.json');

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';
const USERNAME = process.env.E2E_USERNAME ?? 'e2e_admin';
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2ePass123!';

setup('authenticate', async ({ page, request }) => {
  // 1. Obtener tokens via API (más rápido y confiable que la UI)
  const tokenRes = await request.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  expect(tokenRes.ok(), `Login falló: ${await tokenRes.text()}`).toBeTruthy();

  const { access, refresh, is_superuser, is_staff, user_id, username, email } =
    await tokenRes.json();

  // 2. Obtener perfil del usuario (grupos + permisos) para replicar lo que hace use-login.ts
  const profileRes = await request.get(`${API_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });

  let permissions: string[] = [];
  if (profileRes.ok()) {
    const profile = await profileRes.json();
    permissions = (profile.groups ?? []).flatMap(
      (g: { permissions?: { codename: string }[] }) =>
        (g.permissions ?? []).map((p) => p.codename),
    );
  }

  // 3. Navegar al frontend para poder escribir en su localStorage
  await page.goto('/');

  // 4. Sembrar localStorage con el formato que usa Zustand persist
  //    (clave: "logistica-auth", estructura: { state: {...}, version: 0 })
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key: 'logistica-auth',
      value: {
        state: {
          accessToken: access,
          refreshToken: refresh,
          user: { username, email, is_superuser, is_staff, user_id },
          permissions,
        },
        version: 0,
      },
    },
  );

  // 5. Navegar a /login — LoginPage detecta token rehydratado y redirige a /dashboard
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/dashboard/);

  // 6. Guardar storageState (cookies + localStorage del origin http://localhost:3000)
  await page.context().storageState({ path: STORAGE_STATE });
});
