import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// ── helpers ───────────────────────────────────────────────────────────────────

const suffix = () => Date.now().toString().slice(-8);

async function gotoProducts(page: Page) {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible({ timeout: 15_000 });
}

async function openNewSheet(page: Page) {
  // force:true bypasses Playwright's post-click hit-test — necessary because the
  // Sheet backdrop appears immediately and would otherwise be seen as "interception"
  await page.getByRole('button', { name: /Nuevo/ }).first().click({ force: true });
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

async function fillProductForm(
  page: Page,
  data: { sku: string; nombre: string; precio: string; supplierName?: string },
) {
  await page.getByLabel('SKU').fill(data.sku);
  await page.getByLabel('Nombre').fill(data.nombre);
  await page.getByLabel('Precio unitario').fill(data.precio);

  if (data.supplierName) {
    // Supplier select is disabled while loading — wait for it
    const supplierTrigger = page.getByLabel('Proveedor');
    await expect(supplierTrigger).not.toBeDisabled({ timeout: 10_000 });
    await supplierTrigger.click();
    await page.getByRole('option', { name: data.supplierName }).click();
  }
}

async function searchProducts(page: Page, term: string) {
  await page.getByPlaceholder('Buscar por nombre o SKU…').fill(term);
  await page.waitForTimeout(500); // debounce 300ms
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

test.describe('Products CRUD', () => {
  test('lista carga y renderiza tabla con datos sembrados', async ({ page, api }) => {
    const sfx = suffix();
    const supplierId = await api.seed('suppliers', {
      name: `Proveedor Lista ${sfx}`,
      email: `lista${sfx}@test.com`,
    });
    const productId = await api.seed('products', {
      sku: `LST${sfx}`,
      name: `Producto Lista ${sfx}`,
      category: 'LAPTOP',
      unit_price: '100.00',
      supplier: supplierId,
    });

    try {
      await gotoProducts(page);
      await searchProducts(page, `LST${sfx}`);
      await expectRowVisible(page, `LST${sfx}`);
      await expectRowVisible(page, `Producto Lista ${sfx}`);
    } finally {
      await api.remove('products', productId);
      await api.remove('suppliers', supplierId);
    }
  });

  test('crear: formulario con proveedor → aparece en lista', async ({ page, api }) => {
    const sfx = suffix();
    const supplierId = await api.seed('suppliers', {
      name: `Proveedor Crear ${sfx}`,
      email: `crear${sfx}@test.com`,
    });
    let createdId: number | undefined;

    try {
      await gotoProducts(page);
      await openNewSheet(page);
      await fillProductForm(page, {
        sku: `CRT${sfx}`,
        nombre: `Producto Crear ${sfx}`,
        precio: '250.00',
        supplierName: `Proveedor Crear ${sfx}`,
      });
      await page.getByRole('button', { name: 'Crear producto' }).click();

      // Sheet closes on success
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Verify in list
      await searchProducts(page, `CRT${sfx}`);
      await expectRowVisible(page, `CRT${sfx}`);

      // Fetch ID for cleanup
      const res = await api.get(`products/`, { params: { search: `CRT${sfx}` } });
      const body = await res.json();
      createdId = (body.results as Array<{ id: number }>)?.[0]?.id;
    } finally {
      if (createdId) await api.remove('products', createdId);
      await api.remove('suppliers', supplierId);
    }
  });

  test('validación: formulario vacío muestra errores Zod', async ({ page }) => {
    await gotoProducts(page);
    await openNewSheet(page);
    // Clear the price field (it defaults to empty, but clear to ensure)
    await page.getByRole('button', { name: 'Crear producto' }).click();

    await expect(page.getByText('El SKU es requerido')).toBeVisible();
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    await expect(page.getByText('Debe ser un número positivo')).toBeVisible();

    // Sheet stays open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('editar: cambiar nombre → cambio visible en lista', async ({ page, api }) => {
    const sfx = suffix();
    const productId = await api.seed('products', {
      sku: `EDT${sfx}`,
      name: `Producto Antes ${sfx}`,
      category: 'MOBILE',
      unit_price: '300.00',
    });

    try {
      await gotoProducts(page);
      await searchProducts(page, `EDT${sfx}`);
      await expectRowVisible(page, `EDT${sfx}`);

      await openRowActions(page, `EDT${sfx}`);
      await page.getByRole('menuitem', { name: 'Editar' }).click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      const nombreInput = page.getByLabel('Nombre');
      await nombreInput.clear();
      await nombreInput.fill(`Producto Después ${sfx}`);
      await page.getByRole('button', { name: 'Actualizar producto' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowVisible(page, `Producto Después ${sfx}`);
    } finally {
      await api.remove('products', productId);
    }
  });

  test('eliminar: confirmación → desaparece de lista', async ({ page, api }) => {
    const sfx = suffix();
    const productId = await api.seed('products', {
      sku: `DEL${sfx}`,
      name: `Producto Eliminar ${sfx}`,
      category: 'STORAGE',
      unit_price: '50.00',
    });

    try {
      await gotoProducts(page);
      await searchProducts(page, `DEL${sfx}`);
      await expectRowVisible(page, `DEL${sfx}`);

      await openRowActions(page, `DEL${sfx}`);
      await page.getByRole('menuitem', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowNotVisible(page, `DEL${sfx}`);
    } finally {
      await api.remove('products', productId);
    }
  });

  test('búsqueda filtra por SKU y nombre', async ({ page, api }) => {
    const sfx = suffix();
    const id1 = await api.seed('products', {
      sku: `SA${sfx}`,
      name: `Producto Alpha ${sfx}`,
      category: 'LAPTOP',
      unit_price: '100.00',
    });
    const id2 = await api.seed('products', {
      sku: `SB${sfx}`,
      name: `Producto Beta ${sfx}`,
      category: 'DESKTOP',
      unit_price: '200.00',
    });

    try {
      await gotoProducts(page);

      // Both visible with shared suffix
      await searchProducts(page, sfx);
      await expectRowVisible(page, `SA${sfx}`);
      await expectRowVisible(page, `SB${sfx}`);

      // Filter for Alpha only
      await searchProducts(page, `Alpha ${sfx}`);
      await expectRowVisible(page, `SA${sfx}`);
      await expectRowNotVisible(page, `SB${sfx}`);

      // SKU search
      await searchProducts(page, `SB${sfx}`);
      await expectRowVisible(page, `SB${sfx}`);
      await expectRowNotVisible(page, `SA${sfx}`);
    } finally {
      await api.remove('products', id1);
      await api.remove('products', id2);
    }
  });

  test('SKU duplicado muestra error del backend en el formulario', async ({ page, api }) => {
    const sfx = suffix();
    const dupSku = `DUP${sfx}`;
    const existingId = await api.seed('products', {
      sku: dupSku,
      name: `Producto Original ${sfx}`,
      category: 'OTHER',
      unit_price: '10.00',
    });

    try {
      await gotoProducts(page);
      await openNewSheet(page);

      // Fill form with the same SKU that already exists
      await fillProductForm(page, {
        sku: dupSku,
        nombre: `Producto Duplicado ${sfx}`,
        precio: '20.00',
      });
      await page.getByRole('button', { name: 'Crear producto' }).click();

      // Mutation settles — button re-enables (creation failed)
      await expect(page.getByRole('button', { name: 'Crear producto' })).toBeEnabled({
        timeout: 15_000,
      });

      // Sheet stays open (not closed on error)
      await expect(page.getByRole('dialog')).toBeVisible();

      // Backend error set via form.setError('sku', ...) — FormMessage renders as p.text-destructive
      await expect(
        page.getByRole('dialog').locator('p.text-destructive').first(),
      ).toBeVisible({ timeout: 3_000 });
      await expect(
        page.getByRole('dialog').locator('p.text-destructive').first(),
      ).not.toBeEmpty();
    } finally {
      await api.remove('products', existingId);
    }
  });
});
