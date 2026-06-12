import { test as base } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';
const USERNAME = process.env.E2E_USERNAME ?? 'e2e_admin';
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2ePass123!';

// Authenticated API context with seed/remove helpers for DRF
export interface AuthApiContext extends APIRequestContext {
  /** POST to DRF endpoint, returns created resource id */
  seed(endpoint: string, payload: Record<string, unknown>): Promise<number>;
  /** DELETE DRF resource by endpoint + id */
  remove(endpoint: string, id: number): Promise<void>;
}

export const test = base.extend<{ api: AuthApiContext }>({
  api: async ({ playwright }, use) => {
    // Obtain fresh JWT (avoids relying on storageState for API calls)
    const bootstrap = await playwright.request.newContext({ baseURL: `${API_URL}/` });
    const tokenRes = await bootstrap.post('auth/token/', {
      data: { username: USERNAME, password: PASSWORD },
    });
    if (!tokenRes.ok()) {
      throw new Error(`API auth failed: ${await tokenRes.text()}`);
    }
    const { access } = await tokenRes.json();
    await bootstrap.dispose();

    // Authenticated context for the duration of the test
    const ctx = await playwright.request.newContext({
      baseURL: `${API_URL}/`,
      extraHTTPHeaders: { Authorization: `Bearer ${access}` },
    });

    const api = Object.assign(ctx, {
      async seed(endpoint: string, payload: Record<string, unknown>): Promise<number> {
        const res = await ctx.post(`${endpoint}/`, { data: payload });
        if (!res.ok()) {
          throw new Error(`seed(${endpoint}) failed ${res.status()}: ${await res.text()}`);
        }
        const body = await res.json();
        return body.id as number;
      },

      async remove(endpoint: string, id: number): Promise<void> {
        const res = await ctx.delete(`${endpoint}/${id}/`);
        if (!res.ok() && res.status() !== 404) {
          throw new Error(`remove(${endpoint}/${id}) failed ${res.status()}`);
        }
      },
    }) as AuthApiContext;

    await use(api);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
