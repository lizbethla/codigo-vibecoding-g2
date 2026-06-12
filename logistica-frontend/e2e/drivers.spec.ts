import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import type { AuthApiContext } from './fixtures';

// ── seed helpers ──────────────────────────────────────────────────────────────

const suffix = () => Date.now().toString().slice(-8);

async function seedUser(
  api: AuthApiContext,
  sfx: string,
): Promise<{ userId: number; username: string; displayName: string }> {
  const username = `drv${sfx}`;
  // UserCreateSerializer omits 'id' from response — create then search by username
  const createRes = await api.post('auth/users/', {
    data: {
      username,
      password: 'TestPass123!',
      first_name: 'Juan',
      last_name: `Test${sfx}`,
      email: `${username}@test.com`,
    },
  });
  if (!createRes.ok()) {
    throw new Error(`seedUser failed ${createRes.status()}: ${await createRes.text()}`);
  }
  const listRes = await api.get('auth/users/', { params: { search: username } });
  const body = await listRes.json();
  const userId = (body.results as Array<{ id: number }>)[0].id;
  return { userId, username, displayName: `Juan Test${sfx}` };
}

async function seedDriver(
  api: AuthApiContext,
  userId: number,
  sfx: string,
): Promise<number> {
  return api.seed('drivers', {
    user: userId,
    license_number: `LIC${sfx}`,
    license_type: 'B',
    license_expiry: '2027-12-31',
    phone: `+57300${sfx}`,
    national_id: `N${sfx}`,
    status: 'AVAILABLE',
  });
}

// ── UI helpers ────────────────────────────────────────────────────────────────

async function gotoDrivers(page: Page) {
  await page.goto('/drivers');
  await expect(page.getByRole('heading', { name: 'Conductores' })).toBeVisible({ timeout: 15_000 });
}

async function openNewSheet(page: Page) {
  // force:true: sheet backdrop appears instantly and would block Playwright's hit-test
  await page.getByRole('button', { name: /Nuevo/ }).first().click({ force: true });
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

async function fillDriverForm(
  page: Page,
  data: {
    userId: number;
    licenseNumber: string;
    licenseType?: string;
    licenseExpiry?: string;
    phone: string;
    nationalId: string;
    status?: string;
  },
) {
  await page.getByLabel('ID de usuario (Django User)').fill(String(data.userId));
  await page.getByLabel('Numero de licencia').fill(data.licenseNumber);

  if (data.licenseType) {
    await page.getByLabel('Tipo de licencia').click();
    await page.getByRole('option', { name: data.licenseType }).click();
  }

  await page.getByLabel('Vencimiento de licencia').fill(data.licenseExpiry ?? '2027-12-31');
  await page.getByLabel('Telefono').fill(data.phone);
  await page.getByLabel('Cedula').fill(data.nationalId);

  if (data.status) {
    await page.getByLabel('Estado').click();
    await page.getByRole('option', { name: data.status }).click();
  }
}

async function openEditSheet(page: Page, rowText: string) {
  const row = page.getByRole('row').filter({ hasText: rowText });
  await row.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  // Edit sheet fetches driver via API — wait for "Cargando…" to resolve
  await expect(page.getByText('Cargando...')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel('Cedula')).toBeVisible({ timeout: 5_000 });
}

async function openDeleteMenu(page: Page, rowText: string) {
  const row = page.getByRole('row').filter({ hasText: rowText });
  await row.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('menuitem', { name: 'Eliminar' }).click();
}

async function searchDrivers(page: Page, term: string) {
  await page.getByPlaceholder('Buscar por cédula o licencia…').fill(term);
  await page.waitForTimeout(500); // 300ms debounce
}

async function expectRowVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
}

async function expectRowNotVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).not.toBeVisible({ timeout: 10_000 });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Drivers CRUD', () => {
  test('lista: tabla muestra campos derivados del user (Conductor)', async ({ page, api }) => {
    const sfx = suffix();
    const { userId, displayName } = await seedUser(api, sfx);
    const driverId = await seedDriver(api, userId, sfx);

    try {
      await gotoDrivers(page);
      await searchDrivers(page, `N${sfx}`); // search by national_id
      await expectRowVisible(page, `N${sfx}`);
      // Conductor column derives from user.first_name + last_name
      await expectRowVisible(page, displayName);
    } finally {
      await api.remove('drivers', driverId);
      await api.remove('auth/users', userId);
    }
  });

  test('crear: formulario con tipo licencia → conductor aparece en lista', async ({ page, api }) => {
    const sfx = suffix();
    const { userId } = await seedUser(api, sfx);
    let createdDriverId: number | undefined;

    try {
      await gotoDrivers(page);
      await openNewSheet(page);
      await fillDriverForm(page, {
        userId,
        licenseNumber: `LIC${sfx}`,
        licenseType: 'Vehículos articulados pesados', // CE
        licenseExpiry: '2028-06-30',
        phone: `+57300${sfx}`,
        nationalId: `N${sfx}`,
        status: 'Disponible',
      });
      await page.getByRole('button', { name: 'Crear conductor' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Verify by national_id and license type badge
      await searchDrivers(page, `N${sfx}`);
      await expectRowVisible(page, `N${sfx}`);
      await expectRowVisible(page, 'Vehículos articulados pesados');

      // Fetch ID for cleanup
      const res = await api.get('drivers/', { params: { search: `N${sfx}` } });
      const body = await res.json();
      createdDriverId = (body.results as Array<{ id: number }>)?.[0]?.id;
    } finally {
      if (createdDriverId) await api.remove('drivers', createdDriverId);
      await api.remove('auth/users', userId);
    }
  });

  test('validación: formulario vacío muestra errores Zod', async ({ page }) => {
    await gotoDrivers(page);
    await openNewSheet(page);
    await page.getByRole('button', { name: 'Crear conductor' }).click();

    await expect(page.getByText('El numero de licencia es requerido')).toBeVisible();
    await expect(page.getByText('La fecha de vencimiento es requerida')).toBeVisible();
    await expect(page.getByText('El telefono es requerido')).toBeVisible();
    await expect(page.getByText('La cedula es requerida')).toBeVisible();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('editar: cambiar estado → badge actualizado en lista', async ({ page, api }) => {
    const sfx = suffix();
    const { userId } = await seedUser(api, sfx);
    const driverId = await seedDriver(api, userId, sfx);

    try {
      await gotoDrivers(page);
      await searchDrivers(page, `N${sfx}`);
      await expectRowVisible(page, `N${sfx}`);

      await openEditSheet(page, `N${sfx}`);

      // Change status to OFF_DUTY
      await page.getByLabel('Estado').click();
      await page.getByRole('option', { name: 'Fuera de servicio' }).click();
      await page.getByRole('button', { name: 'Actualizar conductor' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Status badge updated
      await searchDrivers(page, `N${sfx}`);
      await expectRowVisible(page, 'Fuera de servicio');
    } finally {
      await api.remove('drivers', driverId);
      await api.remove('auth/users', userId);
    }
  });

  test('eliminar: confirmación → conductor desaparece de lista', async ({ page, api }) => {
    const sfx = suffix();
    const { userId } = await seedUser(api, sfx);
    const driverId = await seedDriver(api, userId, sfx);

    try {
      await gotoDrivers(page);
      await searchDrivers(page, `N${sfx}`);
      await expectRowVisible(page, `N${sfx}`);

      await openDeleteMenu(page, `N${sfx}`);

      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowNotVisible(page, `N${sfx}`);
    } finally {
      // 404 tolerated — driver may already be deleted by UI
      await api.remove('drivers', driverId);
      await api.remove('auth/users', userId);
    }
  });

  test('búsqueda filtra por cédula', async ({ page, api }) => {
    const sfx = suffix();
    const { userId: uid1 } = await seedUser(api, `A${sfx}`);
    const { userId: uid2 } = await seedUser(api, `B${sfx}`);
    const driverId1 = await seedDriver(api, uid1, `A${sfx}`);
    const driverId2 = await seedDriver(api, uid2, `B${sfx}`);

    try {
      await gotoDrivers(page);

      // Search for driver 1 by national_id
      await searchDrivers(page, `NA${sfx}`);
      await expectRowVisible(page, `NA${sfx}`);
      await expectRowNotVisible(page, `NB${sfx}`);

      // Search for driver 2
      await searchDrivers(page, `NB${sfx}`);
      await expectRowVisible(page, `NB${sfx}`);
      await expectRowNotVisible(page, `NA${sfx}`);
    } finally {
      await api.remove('drivers', driverId1);
      await api.remove('drivers', driverId2);
      await api.remove('auth/users', uid1);
      await api.remove('auth/users', uid2);
    }
  });
});
