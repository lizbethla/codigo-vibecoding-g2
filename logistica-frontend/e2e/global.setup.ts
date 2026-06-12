/**
 * Global setup: warm up Next.js routes before any test project starts.
 * Next.js dev server lazy-compiles on first visit; without warmup, first-run
 * tests timeout while waiting for compilation.
 */
import { chromium } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const routes = ['/login', '/dashboard', '/warehouses', '/products', '/drivers', '/shipments'];

  for (const route of routes) {
    await page
      .goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 120_000 })
      .catch(() => {});
  }

  await browser.close();
}
