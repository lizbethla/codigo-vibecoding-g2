import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// ── helpers ───────────────────────────────────────────────────────────────────

const suffix = () => Date.now().toString().slice(-8);

async function gotoWarehouses(page: Page) {
  await page.goto('/warehouses');
  await expect(page.getByRole('heading', { name: 'Almacenes' })).toBeVisible({ timeout: 15_000 });
}

async function openNewSheet(page: Page) {
  await page.getByRole('button', { name: /Nuevo/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

async function fillWarehouseForm(
  page: Page,
  data: { nombre: string; codigo: string; direccion?: string; ciudad?: string },
) {
  await page.getByLabel('Nombre').fill(data.nombre);
  await page.getByLabel('Código').fill(data.codigo);
  if (data.direccion !== undefined) await page.getByLabel('Dirección').fill(data.direccion);
  if (data.ciudad !== undefined) await page.getByLabel('Ciudad').fill(data.ciudad);
}

async function openRowActions(page: Page, cellText: string) {
  const row = page.getByRole('row').filter({ hasText: cellText });
  await row.getByRole('button', { name: 'Abrir menú' }).click();
}

async function expectRowVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
}

async function expectRowNotVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).not.toBeVisible({ timeout: 10_000 });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Warehouses CRUD', () => {
  test('lista carga y renderiza tabla con datos sembrados', async ({ page, api }) => {
    const code = `LST${suffix()}`;
    const id = await api.seed('warehouses', {
      name: 'Almacén Lista Test',
      code,
      address: 'Calle Lista 1',
      city: 'Bogotá',
    });

    try {
      await gotoWarehouses(page);
      // Search for this specific code so it's visible regardless of pagination
      await page.getByPlaceholder('Buscar por código o nombre…').fill(code);
      await page.waitForTimeout(500);

      await expectRowVisible(page, code);
      await expectRowVisible(page, 'Almacén Lista Test');
    } finally {
      await api.remove('warehouses', id);
    }
  });

  test('crear: formulario válido → aparece en lista', async ({ page, api }) => {
    const code = `CRT${suffix()}`;
    let createdId: number | undefined;

    try {
      await gotoWarehouses(page);
      await openNewSheet(page);
      await fillWarehouseForm(page, {
        nombre: 'Almacén Crear Test',
        codigo: code,
        direccion: 'Av. Crear 123',
        ciudad: 'Medellín',
      });
      await page.getByRole('button', { name: 'Crear almacén' }).click();

      // Sheet closes on success
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Search to find it regardless of pagination
      await page.getByPlaceholder('Buscar por código o nombre…').fill(code);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code);

      // Fetch ID from API for cleanup
      const res = await api.get(`warehouses/`, { params: { search: code } });
      const body = await res.json();
      createdId = (body.results as Array<{ id: number }>)?.[0]?.id;
    } finally {
      if (createdId) await api.remove('warehouses', createdId);
    }
  });

  test('validación: formulario vacío muestra errores Zod, no crea', async ({ page }) => {
    await gotoWarehouses(page);
    await openNewSheet(page);
    await page.getByRole('button', { name: 'Crear almacén' }).click();

    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    await expect(page.getByText('El código es requerido')).toBeVisible();
    await expect(page.getByText('La dirección es requerida')).toBeVisible();
    await expect(page.getByText('La ciudad es requerida')).toBeVisible();

    // Sheet stays open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('editar: cambiar nombre → cambio visible en lista', async ({ page, api }) => {
    const code = `EDT${suffix()}`;
    const id = await api.seed('warehouses', {
      name: 'Almacén Antes',
      code,
      address: 'Calle Editar 1',
      city: 'Cali',
    });

    try {
      await gotoWarehouses(page);
      await page.getByPlaceholder('Buscar por código o nombre…').fill(code);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code);

      await openRowActions(page, code);
      await page.getByRole('menuitem', { name: 'Editar' }).click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      const nombreInput = page.getByLabel('Nombre');
      await nombreInput.clear();
      await nombreInput.fill('Almacén Después');
      await page.getByRole('button', { name: 'Actualizar almacén' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowVisible(page, 'Almacén Después');
    } finally {
      await api.remove('warehouses', id);
    }
  });

  test('eliminar: sembrar → eliminar con confirmación → desaparece de lista', async ({ page, api }) => {
    const code = `DEL${suffix()}`;
    const id = await api.seed('warehouses', {
      name: 'Almacén Eliminar',
      code,
      address: 'Calle Borrar 1',
      city: 'Barranquilla',
    });

    try {
      await gotoWarehouses(page);
      await page.getByPlaceholder('Buscar por código o nombre…').fill(code);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code);

      await openRowActions(page, code);
      await page.getByRole('menuitem', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowNotVisible(page, code);
    } finally {
      // 404 is tolerated by fixture.remove — warehouse may already be gone
      await api.remove('warehouses', id);
    }
  });

  test('búsqueda filtra por texto y se limpia', async ({ page, api }) => {
    const sfx = suffix();
    const code1 = `SA${sfx}`;
    const code2 = `SB${sfx}`;
    const id1 = await api.seed('warehouses', {
      name: `Almacén Alpha ${sfx}`,
      code: code1,
      address: 'Calle Alpha 1',
      city: 'Bogotá',
    });
    const id2 = await api.seed('warehouses', {
      name: `Almacén Beta ${sfx}`,
      code: code2,
      address: 'Calle Beta 1',
      city: 'Bogotá',
    });

    try {
      await gotoWarehouses(page);

      // Both visible with shared suffix search
      const searchInput = page.getByPlaceholder('Buscar por código o nombre…');
      await searchInput.fill(sfx);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code1);
      await expectRowVisible(page, code2);

      // Filter for Alpha only
      await searchInput.fill(`Alpha ${sfx}`);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code1);
      await expectRowNotVisible(page, code2);

      // Clear — both return
      await searchInput.clear();
      await page.waitForTimeout(500);
      await searchInput.fill(sfx);
      await page.waitForTimeout(500);
      await expectRowVisible(page, code1);
      await expectRowVisible(page, code2);
    } finally {
      await api.remove('warehouses', id1);
      await api.remove('warehouses', id2);
    }
  });
});
