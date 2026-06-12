/**
 * Playwright E2E — Prerequisitos (levantar manualmente antes de correr e2e)
 *
 * 1. Backend Django en http://localhost:8000
 *      cd ../logistica-api-claudecode
 *      python manage.py runserver
 *
 * 2. Frontend Next.js en http://localhost:3000
 *      npm run dev
 *
 * 3. Usuario de test existente en la base de datos:
 *      python manage.py shell -c "
 *        from django.contrib.auth import get_user_model
 *        User = get_user_model()
 *        User.objects.filter(username='e2e_admin').exists() or
 *        User.objects.create_superuser('e2e_admin', 'e2e@logistica.dev', 'e2ePass123!')
 *      "
 *
 * Variables de entorno opcionales (se pueden poner en .env.local):
 *      E2E_BASE_URL   — default: http://localhost:3000
 *      E2E_API_URL    — default: http://localhost:8000/api/v1
 *      E2E_USERNAME   — default: e2e_admin
 *      E2E_PASSWORD   — default: e2ePass123!
 *
 * El server NO se levanta automáticamente (regla del proyecto: Claude nunca corre npm run dev).
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global.setup.ts',

  // 1 worker prevents Next.js dev-server contention across spec files
  workers: 1,

  // Higher timeouts to handle Next.js dev-server lazy compilation on first run
  timeout: 120_000,

  reporter: [['html'], ['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    navigationTimeout: 90_000,
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. Setup: obtiene tokens y guarda storageState
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Chromium: todos los tests autenticados
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testIgnore: /login\.spec\.ts/,
    },

    // 3. Auth tests: login.spec.ts corre sin storageState ni dependency de setup
    {
      name: 'auth-tests',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
