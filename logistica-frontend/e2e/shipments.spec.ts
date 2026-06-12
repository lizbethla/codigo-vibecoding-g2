import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import type { AuthApiContext } from './fixtures';

// ── seed helpers ──────────────────────────────────────────────────────────────

const suffix = () => Date.now().toString().slice(-8);

interface CoreBundle {
  warehouseId: number;
  warehouseName: string;
  customerId: number;
  customerName: string;
  supplierId: number;
  productId: number;
  productSku: string;
  productName: string;
}

async function seedCore(api: AuthApiContext, sfx: string): Promise<CoreBundle> {
  const warehouseName = `Alm${sfx}`;
  const customerName = `Cli${sfx}`;
  const productSku = `SP${sfx}`;
  const productName = `Prod${sfx}`;

  const [warehouseId, supplierId, customerId] = await Promise.all([
    api.seed('warehouses', {
      name: warehouseName,
      code: `WH${sfx.slice(0, 6)}`,
      address: `Av. Test ${sfx}`,
      city: 'Lima',
    }),
    api.seed('suppliers', { name: `Prov${sfx}`, email: `prov${sfx}@test.com` }),
    api.seed('customers', { name: customerName, email: `cli${sfx}@test.com` }),
  ]);

  const productId = await api.seed('products', {
    sku: productSku,
    name: productName,
    category: 'LAPTOP',
    unit_price: '1000.00',
    supplier: supplierId,
  });

  return {
    warehouseId, warehouseName,
    customerId, customerName,
    supplierId,
    productId, productSku, productName,
  };
}

async function seedShipment(
  api: AuthApiContext,
  sfx: string,
  customerId: number,
  warehouseId: number,
): Promise<{ shipmentId: number; trackingCode: string }> {
  const shipmentId = await api.seed('shipments', {
    customer: customerId,
    origin_warehouse: warehouseId,
    origin_address: `Origen ${sfx}`,
    destination_address: `Destino ${sfx}`,
    destination_city: `Ciudad${sfx}`,
    recipient_name: `Dest${sfx}`,
    scheduled_date: '2027-06-30',
  });
  const res = await api.get(`shipments/${shipmentId}/`);
  const body = await res.json();
  return { shipmentId, trackingCode: body.tracking_code as string };
}

async function cleanCore(api: AuthApiContext, b: CoreBundle) {
  await api.remove('products', b.productId);
  await Promise.all([
    api.remove('warehouses', b.warehouseId),
    api.remove('customers', b.customerId),
    api.remove('suppliers', b.supplierId),
  ]);
}

// ── UI helpers ────────────────────────────────────────────────────────────────

async function gotoShipments(page: Page) {
  await page.goto('/shipments');
  await expect(page.getByRole('heading', { name: 'Envíos' })).toBeVisible({ timeout: 15_000 });
}

async function openNewSheet(page: Page) {
  // force:true: sheet backdrop appears instantly and would block Playwright's hit-test
  await page.getByRole('button', { name: /Nuevo/ }).first().click({ force: true });
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

async function searchShipments(page: Page, term: string) {
  await page.getByPlaceholder('Buscar por código o destinatario…').fill(term);
  await page.waitForTimeout(500); // 300ms debounce
}

async function expectRowVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
}

async function expectRowNotVisible(page: Page, text: string) {
  await expect(page.getByRole('row').filter({ hasText: text })).not.toBeVisible({ timeout: 10_000 });
}

async function openRowMenu(page: Page, rowText: string) {
  const row = page.getByRole('row').filter({ hasText: rowText });
  await row.getByRole('button', { name: 'Abrir menu' }).click();
}

async function fillCreateForm(
  page: Page,
  data: {
    customerName: string;
    warehouseName: string;
    originAddress: string;
    destAddress: string;
    destCity: string;
    recipientName: string;
    scheduledDate: string;
  },
) {
  const customerTrigger = page.getByLabel('Cliente');
  await expect(customerTrigger).not.toBeDisabled({ timeout: 10_000 });
  await customerTrigger.click();
  await page.getByRole('option', { name: data.customerName }).click();

  const warehouseTrigger = page.getByLabel('Almacén de origen');
  await expect(warehouseTrigger).not.toBeDisabled({ timeout: 10_000 });
  await warehouseTrigger.click();
  // Warehouse options render as "{name} ({city})"
  await page.getByRole('option', { name: new RegExp(data.warehouseName) }).click();

  await page.getByLabel('Dirección de origen').fill(data.originAddress);
  await page.getByLabel('Dirección de destino').fill(data.destAddress);
  await page.getByLabel('Ciudad de destino').fill(data.destCity);
  await page.getByLabel('Nombre del destinatario').fill(data.recipientName);
  await page.getByLabel('Fecha programada').fill(data.scheduledDate);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Shipments CRUD', () => {
  test('lista: tabla muestra envío sembrado con tracking_code y cliente', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    const { shipmentId, trackingCode } = await seedShipment(api, sfx, core.customerId, core.warehouseId);

    try {
      await gotoShipments(page);
      await searchShipments(page, trackingCode);
      await expectRowVisible(page, trackingCode);
      await expectRowVisible(page, core.customerName);
    } finally {
      await api.remove('shipments', shipmentId);
      await cleanCore(api, core);
    }
  });

  test('crear: formulario → tracking_code auto-generado (formato LOG-) aparece en lista', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    // customer name (Cli${sfx}) is shown in the "Cliente" column — use for post-create search
    let createdTrackingCode: string | undefined;

    try {
      await gotoShipments(page);
      await openNewSheet(page);
      await fillCreateForm(page, {
        customerName: core.customerName,
        warehouseName: core.warehouseName,
        originAddress: `Origen ${sfx}`,
        destAddress: `Destino ${sfx}`,
        destCity: `Ciudad${sfx}`,
        recipientName: `Dest${sfx}`,
        scheduledDate: '2027-06-30',
      });
      await page.getByRole('button', { name: 'Crear envío' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Search by recipient_name (backend filter); row shows customerName in "Cliente" column
      await searchShipments(page, `Dest${sfx}`);
      const newRow = page.getByRole('row').filter({ hasText: core.customerName }).first();
      await expect(newRow).toBeVisible({ timeout: 10_000 });
      // tracking_code column shows LOG-YYYY-XXXX format
      await expect(newRow.getByText(/^LOG-/)).toBeVisible();

      // Capture tracking_code for cleanup
      createdTrackingCode = (await newRow.getByText(/^LOG-/).textContent()) ?? undefined;
    } finally {
      // Find and delete the created shipment before FK-referenced entities
      if (createdTrackingCode) {
        const res = await api.get('shipments/', { params: { search: createdTrackingCode } });
        const body = await res.json();
        await Promise.all(
          (body.results as Array<{ id: number }>).map((s) => api.remove('shipments', s.id)),
        );
      }
      await cleanCore(api, core);
    }
  });

  test('validación: formulario vacío muestra errores Zod', async ({ page }) => {
    await gotoShipments(page);
    await openNewSheet(page);
    await page.getByRole('button', { name: 'Crear envío' }).click();

    await expect(page.getByText('El cliente es requerido')).toBeVisible();
    await expect(page.getByText('El almacén de origen es requerido')).toBeVisible();
    await expect(page.getByText('La dirección de origen es requerida')).toBeVisible();
    await expect(page.getByText('La dirección de destino es requerida')).toBeVisible();
    await expect(page.getByText('La ciudad de destino es requerida')).toBeVisible();
    await expect(page.getByText('El nombre del destinatario es requerido')).toBeVisible();
    await expect(page.getByText('La fecha programada es requerida')).toBeVisible();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('detalle: agregar producto → aparece en tabla de productos', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    const { shipmentId } = await seedShipment(api, sfx, core.customerId, core.warehouseId);

    try {
      await page.goto(`/shipments/${shipmentId}`);
      // Wait for detail page to fully load (products section renders after shipment fetch)
      await expect(page.getByRole('heading', { name: 'Productos del envío' })).toBeVisible({ timeout: 15_000 });

      // Open add-product sheet
      await page.getByRole('button', { name: 'Agregar producto' }).first().click({ force: true });
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      // Wait for products select to load then pick our seeded product
      // scope inside dialog: sheet title "Agregar producto" also contains "Producto" → strict violation without scope
      const productTrigger = page.getByRole('dialog').getByRole('combobox', { name: /Producto/ });
      await expect(productTrigger).not.toBeDisabled({ timeout: 10_000 });
      await productTrigger.click();
      // Options render as "{sku} — {name}"
      await page.getByRole('option', { name: new RegExp(core.productSku) }).click();

      // quantity defaults to 1, unit_price auto-filled from product
      await page.getByRole('dialog').getByRole('button', { name: 'Agregar producto' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Product row visible in the products table
      await expect(
        page.getByRole('row').filter({ hasText: core.productSku }),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('shipments', shipmentId);
      await cleanCore(api, core);
    }
  });

  test('detalle: eliminar producto → desaparece de tabla', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    const { shipmentId } = await seedShipment(api, sfx, core.customerId, core.warehouseId);

    // Seed shipment product directly via API
    await api.seed(`shipments/${shipmentId}/products`, {
      product: core.productId,
      quantity: 2,
      unit_price: '1000.00',
    });

    try {
      await page.goto(`/shipments/${shipmentId}`);
      await expect(page.getByRole('heading', { name: 'Productos del envío' })).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('row').filter({ hasText: core.productSku }),
      ).toBeVisible({ timeout: 10_000 });

      // Click trash icon (sr-only "Eliminar") on the product row
      // evaluate el.click(): TanStack Query DevTools icon sits at bottom-left; force:true fires
      // mouse at coordinates and would toggle the DevTools panel instead. el.click() bypasses
      // mouse simulation and dispatches the event directly on the element.
      const productRow = page.getByRole('row').filter({ hasText: core.productSku });
      await productRow.getByRole('button', { name: 'Eliminar' }).evaluate(
        (el) => (el as HTMLButtonElement).click(),
      );

      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10_000 });
      // Table shows empty state
      await expect(
        page.getByText('Sin productos. Agrega el primer producto al envío.'),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('shipments', shipmentId);
      await cleanCore(api, core);
    }
  });

  test('editar: cambiar estado PENDING → CONFIRMED → badge actualizado en lista', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    const { shipmentId, trackingCode } = await seedShipment(api, sfx, core.customerId, core.warehouseId);

    try {
      await gotoShipments(page);
      await searchShipments(page, trackingCode);
      await expectRowVisible(page, trackingCode);

      await openRowMenu(page, trackingCode);
      await page.getByRole('menuitem', { name: 'Editar' }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      // Edit sheet loads current status — wait for select to appear
      await expect(page.getByLabel('Estado')).toBeVisible({ timeout: 10_000 });

      await page.getByLabel('Estado').click();
      await page.getByRole('option', { name: 'Confirmado' }).click();
      await page.getByRole('button', { name: 'Actualizar envío' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Status badge updated in list
      await searchShipments(page, trackingCode);
      await expectRowVisible(page, 'Confirmado');
    } finally {
      await api.remove('shipments', shipmentId);
      await cleanCore(api, core);
    }
  });

  test('eliminar: confirmación → envío desaparece de lista', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    const { shipmentId, trackingCode } = await seedShipment(api, sfx, core.customerId, core.warehouseId);

    try {
      await gotoShipments(page);
      await searchShipments(page, trackingCode);
      await expectRowVisible(page, trackingCode);

      await openRowMenu(page, trackingCode);
      await page.getByRole('menuitem', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10_000 });
      await expectRowNotVisible(page, trackingCode);
    } finally {
      // 404 tolerated — shipment may already be deleted by UI
      await api.remove('shipments', shipmentId);
      await cleanCore(api, core);
    }
  });

  test('búsqueda filtra por destinatario', async ({ page, api }) => {
    const sfx = suffix();
    const core = await seedCore(api, sfx);
    // Two shipments with distinct recipient names, same customer + warehouse
    const { shipmentId: id1, trackingCode: tc1 } = await seedShipment(
      api, `A${sfx}`, core.customerId, core.warehouseId,
    );
    const { shipmentId: id2, trackingCode: tc2 } = await seedShipment(
      api, `B${sfx}`, core.customerId, core.warehouseId,
    );

    try {
      await gotoShipments(page);

      // Search for shipment 1 by recipient name
      await searchShipments(page, `DestA${sfx}`);
      await expectRowVisible(page, tc1);
      await expectRowNotVisible(page, tc2);

      // Search for shipment 2
      await searchShipments(page, `DestB${sfx}`);
      await expectRowVisible(page, tc2);
      await expectRowNotVisible(page, tc1);
    } finally {
      await api.remove('shipments', id1);
      await api.remove('shipments', id2);
      await cleanCore(api, core);
    }
  });
});
