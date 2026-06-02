# Spec: Shipments (Envíos)

## Overview

The Shipments module is the core business entity of the logistics system. It creates two pages: a list page at `/shipments` and a detail page at `/shipments/[id]`. The list page shows a server-paginated TanStack Table with tracking code, customer name, status badge (color-coded per status flow), priority badge, destination city, scheduled date, and total cost. Create uses a Sheet form requiring customer, warehouse, address, and recipient fields. Edit (PATCH) is a separate Sheet focused on status, route/vehicle assignment, and cost fields. The detail page shows all shipment fields and manages the nested `shipment_products` collection — add, edit, and remove products via `/shipments/{id}/products/` endpoints. This is the most complex module: it depends on all other modules (Customers, Warehouses, Routes, Vehicles, Products), has a rich status/priority enum system with badge colors, and uses the nested resource pattern from Routes.

**Pages:** `/shipments` (list + create/edit sheet), `/shipments/[id]` (detail + products management)
**Complexity:** High — all FK dependencies, nested products, status flow, two distinct form modes (create vs edit), two separate hooks files.

---

## Pages

### Page: `/shipments`

- **Route:** `/shipments`
- **Component:** `app/(dashboard)/shipments/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `ShipmentsPage` | new — `app/(dashboard)/shipments/page.tsx` | Page entry; owns `searchInput`, `search`, `page`, `pageSize`, `ordering`, create sheet state, edit sheet state, delete dialog state |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo envío" `Button` |
| `ShipmentCreateSheet` | new — `components/shipments/shipment-create-sheet.tsx` | shadcn `Sheet` wrapping `ShipmentCreateForm`; used only for create; no pre-population needed |
| `ShipmentCreateForm` | new — `components/shipments/shipment-create-form.tsx` | `react-hook-form` + `zod` for create fields: customer, origin_warehouse, addresses, recipient, scheduled_date, priority, notes, optional route/vehicle; calls `useCreateShipment` |
| `ShipmentEditSheet` | new — `components/shipments/shipment-edit-sheet.tsx` | shadcn `Sheet` wrapping `ShipmentEditForm`; triggers detail fetch when `shipmentId` is provided |
| `ShipmentEditForm` | new — `components/shipments/shipment-edit-form.tsx` | `react-hook-form` + `zod` for edit-only fields: status, route, vehicle, base_cost, tax_amount, total_cost, actual_delivery; calls `useUpdateShipment` with PATCH |
| `ShipmentDeleteDialog` | new — `components/shipments/shipment-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete with cascade warning |
| `Badge` | shadcn/ui | Renders `status` and `priority` badges with color overrides |
| `Button` | shadcn/ui | Toolbar "Nuevo envío" action, form submit, detail page actions |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Ver detalle, Editar, Eliminar) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panels for create and edit forms |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | shadcn/ui | customer, origin_warehouse, route, vehicle, status, priority selects |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All shipment data-fetching and mutation hooks live in `hooks/use-shipments.ts`. Nested shipment product hooks live in `hooks/use-shipment-products.ts`.

**List query:**

```ts
// useShipments(params)
useQuery<PaginatedResponse<ShipmentListItem>, AxiosError>({
  queryKey: ['shipments', params], // params: { page, page_size, search, ordering }
  queryFn: () => api.get('/shipments/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

Where `ShipmentListItem` is the shape returned by the list endpoint:

```ts
interface ShipmentListItem {
  id: number;
  tracking_code: string;
  customer: { id: number; name: string; customer_type: string };
  status: ShipmentStatus;
  priority: ShipmentPriority;
  destination_city: string;
  scheduled_date: string;
  total_cost: string;
}
```

**Detail query (used in ShipmentEditSheet and detail page):**

```ts
// useShipment(id)
useQuery<Shipment, AxiosError>({
  queryKey: ['shipments', id],
  queryFn: () => api.get(`/shipments/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

**Create mutation:**

```ts
useMutation<Shipment, AxiosError, ShipmentCreate>({
  mutationFn: (body) => api.post('/shipments/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Shipment, AxiosError, { id: number; data: ShipmentUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/shipments/${id}/`, data).then((r) => r.data),
  onSuccess: (_, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    queryClient.invalidateQueries({ queryKey: ['shipments', id] });
    // close sheet, show toast
  },
})
```

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/shipments/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    // close dialog, show toast
  },
})
```

**FK list queries for form dropdowns — all added to the existing hook files:**

```ts
// useCustomersList() — added to hooks/use-customers.ts
useQuery<PaginatedResponse<Customer>, AxiosError>({
  queryKey: ['customers-list'],
  queryFn: () =>
    api.get('/customers/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000,
})

// useWarehousesList() — added to hooks/use-warehouses.ts
useQuery<PaginatedResponse<WarehouseSummary>, AxiosError>({
  queryKey: ['warehouses-list'],
  queryFn: () =>
    api.get('/warehouses/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000,
})

// useRoutesList() — added to hooks/use-routes.ts
useQuery<PaginatedResponse<RouteListItem>, AxiosError>({
  queryKey: ['routes-list'],
  queryFn: () =>
    api.get('/routes/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000,
})

// useVehiclesList() — added to hooks/use-vehicles.ts
useQuery<PaginatedResponse<VehicleListItem>, AxiosError>({
  queryKey: ['vehicles-list'],
  queryFn: () =>
    api.get('/vehicles/', { params: { page_size: 100, ordering: 'plate' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000,
})

// useProductsList() — added to hooks/use-products.ts
useQuery<PaginatedResponse<Product>, AxiosError>({
  queryKey: ['products-list'],
  queryFn: () =>
    api.get('/products/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000,
})
```

#### TanStack Table columns

Defined in `components/shipments/shipments-columns.tsx`. Row type is `ShipmentListItem`.

| Accessor key | Header | Cell renderer |
|---|---|---|
| `tracking_code` | Código | `<span className="font-mono font-medium text-sm">{row.original.tracking_code}</span>` |
| `customer_name` | Cliente | `<span className="font-medium">{row.original.customer.name}</span>` — uses `accessorFn: (row) => row.customer.name` with id `'customer_name'` |
| `status` | Estado | `Badge` with `variant="outline"` plus Tailwind className from `STATUS_BADGE_CLASSES` and Spanish label from `STATUS_LABELS` |
| `priority` | Prioridad | `Badge` with `variant="outline"` plus Tailwind className from `PRIORITY_BADGE_CLASSES` and Spanish label from `PRIORITY_LABELS` |
| `destination_city` | Destino | plain text |
| `scheduled_date` | Fecha prog. | formatted as `new Date(row.original.scheduled_date + 'T00:00:00').toLocaleDateString('es-CO')` to avoid UTC offset shift |
| `total_cost` | Costo total | `<span>$ {parseFloat(row.original.total_cost).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>` |
| `actions` | (empty) | `DropdownMenu` with items: "Ver detalle" (navigates to `/shipments/{id}`), "Editar" (opens `ShipmentEditSheet`), "Eliminar" (opens `ShipmentDeleteDialog`) |

**Status label map:**

```ts
export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING:          'Pendiente',
  CONFIRMED:        'Confirmado',
  IN_WAREHOUSE:     'En almacén',
  IN_TRANSIT:       'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED:        'Entregado',
  FAILED:           'Fallido',
  CANCELLED:        'Cancelado',
  RETURNED:         'Devuelto',
};
```

**Status badge color map:**

```ts
export const STATUS_BADGE_CLASSES: Record<ShipmentStatus, string> = {
  PENDING:          'bg-gray-100 text-gray-800 border-gray-200',
  CONFIRMED:        'bg-blue-100 text-blue-800 border-blue-200',
  IN_WAREHOUSE:     'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_TRANSIT:       'bg-orange-100 text-orange-800 border-orange-200',
  OUT_FOR_DELIVERY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELIVERED:        'bg-green-100 text-green-800 border-green-200',
  FAILED:           'bg-red-100 text-red-800 border-red-200',
  CANCELLED:        'bg-red-100 text-red-800 border-red-200',
  RETURNED:         'bg-purple-100 text-purple-800 border-purple-200',
};
```

**Priority label map:**

```ts
export const PRIORITY_LABELS: Record<ShipmentPriority, string> = {
  LOW:    'Baja',
  NORMAL: 'Normal',
  HIGH:   'Alta',
  URGENT: 'Urgente',
};
```

**Priority badge color map:**

```ts
export const PRIORITY_BADGE_CLASSES: Record<ShipmentPriority, string> = {
  LOW:    'bg-gray-100 text-gray-800 border-gray-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH:   'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};
```

Export all four maps from `components/shipments/shipments-columns.tsx` so they can be reused on the detail page.

#### Form fields — Create (ShipmentCreateForm)

Validated with `zod`. Fields required by the API: `customer`, `origin_warehouse`, `origin_address`, `destination_address`, `destination_city`, `recipient_name`, `scheduled_date`. Do NOT send `tracking_code`, `created_at`, `updated_at` in any request body.

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `customer` | Cliente | `Select` | required | Options from `useCustomersList().data?.results ?? []`; each option labeled `{customer.name}`, value is `String(customer.id)` |
| `origin_warehouse` | Almacén de origen | `Select` | required | Options from `useWarehousesList().data?.results ?? []`; each option labeled `{warehouse.name} ({warehouse.city})`, value is `String(warehouse.id)` |
| `origin_address` | Dirección de origen | text input | required, min 1 char | — |
| `destination_address` | Dirección de destino | text input | required, min 1 char | — |
| `destination_city` | Ciudad de destino | text input | required, min 1 char | — |
| `destination_country` | País de destino | text input | optional | Defaults to `"Colombia"` if omitted |
| `recipient_name` | Nombre del destinatario | text input | required, min 1 char | — |
| `recipient_phone` | Teléfono del destinatario | text input | optional | Blank → omit field |
| `scheduled_date` | Fecha programada | date input | required | `type="date"`, value is `YYYY-MM-DD` string |
| `priority` | Prioridad | `Select` | optional, defaults to `NORMAL` | 4 options with Spanish labels from `PRIORITY_LABELS` |
| `route` | Ruta | `Select` | optional | Options from `useRoutesList().data?.results ?? []`; each option labeled `{route.code} — {route.name}`, value is `String(route.id)`; include "Sin ruta" option with value `""` |
| `vehicle` | Vehículo | `Select` | optional | Options from `useVehiclesList().data?.results ?? []`; each option labeled `{vehicle.plate} — {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}`, value is `String(vehicle.id)`; include "Sin vehículo" option with value `""` |
| `notes` | Notas | textarea | optional | Multi-line; blank → omit field |

Zod schema for create:

```ts
const shipmentCreateSchema = z.object({
  customer: z.string().min(1, 'El cliente es requerido'),
  origin_warehouse: z.string().min(1, 'El almacén de origen es requerido'),
  origin_address: z.string().min(1, 'La dirección de origen es requerida'),
  destination_address: z.string().min(1, 'La dirección de destino es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  destination_country: z.string().optional(),
  recipient_name: z.string().min(1, 'El nombre del destinatario es requerido'),
  recipient_phone: z.string().optional(),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  route: z.string().optional(),   // "" means no route
  vehicle: z.string().optional(), // "" means no vehicle
  notes: z.string().optional(),
});
```

On submit, clean values before sending to API:
- `customer` → `parseInt(values.customer, 10)`
- `origin_warehouse` → `parseInt(values.origin_warehouse, 10)`
- `route`: if `""` or undefined → omit; otherwise `parseInt(values.route, 10)`
- `vehicle`: if `""` or undefined → omit; otherwise `parseInt(values.vehicle, 10)`
- `destination_country`: if empty string → omit (backend defaults to `"Colombia"`)
- `recipient_phone`: if empty string → omit
- `notes`: if empty string → omit
- `priority`: if undefined → omit (backend defaults to `NORMAL`)
- NEVER include `tracking_code` in the body

#### Form fields — Edit (ShipmentEditForm)

The edit form is a separate, narrower form focused on fields that change after creation. It pre-populates from the detail fetch result. PATCH semantics — only send changed fields.

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `status` | Estado | `Select` | optional | 9 options with Spanish labels from `STATUS_LABELS` |
| `route` | Ruta | `Select` | optional | Same options as create form; "Sin ruta" option clears with `null` |
| `vehicle` | Vehículo | `Select` | optional | Same options as create form; "Sin vehículo" option clears with `null` |
| `base_cost` | Costo base | text input | optional, positive decimal string | Validate with regex `/^\d+(\.\d+)?$/`; blank → omit |
| `tax_amount` | IVA / impuestos | text input | optional, positive decimal string | Same regex; blank → omit |
| `total_cost` | Costo total | text input | optional, positive decimal string | Should equal `base_cost + tax_amount`; set manually by client; blank → omit |
| `actual_delivery` | Fecha/hora de entrega | datetime-local input | optional | `type="datetime-local"`; on submit convert to ISO 8601 string (append `:00` seconds if needed); blank → omit; only relevant when status = `DELIVERED` |
| `estimated_delivery` | Fecha estimada de entrega | date input | optional | `type="date"`, `YYYY-MM-DD` string; blank → omit |

Zod schema for edit:

```ts
const shipmentEditSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'IN_WAREHOUSE', 'IN_TRANSIT',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED', 'RETURNED',
  ]).optional(),
  route: z.string().optional(),   // "" clears (send null); non-empty → parseInt
  vehicle: z.string().optional(), // "" clears (send null); non-empty → parseInt
  base_cost: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  tax_amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  total_cost: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  actual_delivery: z.string().optional().or(z.literal('')),
  estimated_delivery: z.string().optional().or(z.literal('')),
});
```

On submit, clean values before sending to API:
- `route`: if `""` → send `null` (clears assignment); if non-empty → `parseInt(values.route, 10)`; if undefined → omit
- `vehicle`: same pattern as route
- `base_cost`, `tax_amount`, `total_cost`: if empty string → omit
- `actual_delivery`: if empty string → omit; if non-empty → ensure ISO format (e.g. `values.actual_delivery + ':00'` if `datetime-local` value has no seconds)
- `estimated_delivery`: if empty string → omit
- NEVER include `tracking_code`, `created_at`, `updated_at`, `line_total` in the body

Pre-populate `ShipmentEditForm` from `useShipment(id)` result:
- `status` → `shipment.status`
- `route` → `shipment.route ? String(shipment.route.id) : ""`
- `vehicle` → `shipment.vehicle ? String(shipment.vehicle.id) : ""`
- `base_cost` → `shipment.base_cost`
- `tax_amount` → `shipment.tax_amount`
- `total_cost` → `shipment.total_cost`
- `actual_delivery` → convert ISO datetime to `datetime-local` format (`YYYY-MM-DDTHH:mm`) or `""` if null
- `estimated_delivery` → `shipment.estimated_delivery ?? ""`

Display `tracking_code` as a read-only labeled field at the top of the edit sheet (not a form input — just a `<p>` or `<span>`).

#### Zustand usage

No Zustand state is needed beyond what Auth already provides.

---

### Page: `/shipments/[id]`

- **Route:** `/shipments/[id]`
- **Component:** `app/(dashboard)/shipments/[id]/page.tsx`
- **Type:** detail

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `ShipmentDetailPage` | new — `app/(dashboard)/shipments/[id]/page.tsx` | Page entry; receives `params: { id: string }`; owns add-product sheet state, edit-product sheet state, delete-product dialog state, and the shipment edit sheet state |
| `ShipmentInfoCard` | new — `components/shipments/shipment-info-card.tsx` | Displays all shipment fields in a shadcn `Card`; receives `shipment: Shipment`; shows tracking_code, status badge, priority badge, customer name, warehouse code/name, route (or "—"), vehicle (or "—"), addresses, recipient, dates, costs; includes "Editar envío" Button that opens edit sheet |
| `ShipmentProductsTable` | new — `components/shipments/shipment-products-table.tsx` | Renders `ShipmentProduct[]` in a shadcn `Table` (NOT the DataTable wrapper — no server pagination needed); columns: product SKU/name, quantity, unit_price, line_total (read-only), notes, actions |
| `ShipmentProductSheet` | new — `components/shipments/shipment-product-sheet.tsx` | shadcn `Sheet` wrapping `ShipmentProductForm`; used for both add (no `product` prop) and edit (with `product: ShipmentProduct` prop) |
| `ShipmentProductForm` | new — `components/shipments/shipment-product-form.tsx` | `react-hook-form` + `zod` form for product fields; calls `useAddShipmentProduct` or `useUpdateShipmentProduct`; includes product `Select` (from `useProductsList()`), quantity (number), unit_price (text, auto-filled on product select, editable), notes (textarea); surfaces backend uniqueness error |
| `ShipmentProductDeleteDialog` | new — `components/shipments/shipment-product-delete-dialog.tsx` | shadcn `AlertDialog` for removing a product from the shipment |
| `ShipmentEditSheet` | (reused from list page) | `components/shipments/shipment-edit-sheet.tsx`; same component used on detail page |
| `Button` | shadcn/ui | "Volver a envíos" back button, "Agregar producto" button, form submit buttons |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` | shadcn/ui | Shipment info section |
| `Badge` | shadcn/ui | Status and priority badges |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Product add/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Product remove confirm |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | shadcn/ui | Product select in `ShipmentProductForm` |

#### TanStack Query

Shipment product mutation hooks live in `hooks/use-shipment-products.ts`. The shipment detail (including initial `shipment_products[]`) is fetched by `useShipment(id)` from `hooks/use-shipments.ts` — the same hook used by `ShipmentEditSheet`, so data and cache entries are shared.

**Shipment detail query (reused from `hooks/use-shipments.ts`):**

```ts
// useShipment(id) — same hook as the edit sheet uses; returns Shipment with shipment_products[]
useQuery<Shipment, AxiosError>({
  queryKey: ['shipments', id],
  queryFn: () => api.get(`/shipments/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

The `shipment_products[]` array is embedded in the detail response. No separate products-list fetch is needed for initial render.

**Add product mutation:**

```ts
useMutation<ShipmentProduct, AxiosError, { shipmentId: number; data: ShipmentProductCreate }>({
  mutationFn: ({ shipmentId, data }) =>
    api.post(`/shipments/${shipmentId}/products/`, data).then((r) => r.data),
  onSuccess: (_, { shipmentId }) => {
    queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
    // close sheet, show toast
  },
})
```

**Update product mutation (PATCH):**

```ts
useMutation<ShipmentProduct, AxiosError, { shipmentId: number; productId: number; data: ShipmentProductUpdate }>({
  mutationFn: ({ shipmentId, productId, data }) =>
    api.patch(`/shipments/${shipmentId}/products/${productId}/`, data).then((r) => r.data),
  onSuccess: (_, { shipmentId }) => {
    queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
    // close sheet, show toast
  },
})
```

**Remove product mutation:**

```ts
useMutation<void, AxiosError, { shipmentId: number; productId: number }>({
  mutationFn: ({ shipmentId, productId }) =>
    api.delete(`/shipments/${shipmentId}/products/${productId}/`).then(() => undefined),
  onSuccess: (_, { shipmentId }) => {
    queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
    // close dialog, show toast
  },
})
```

After any product mutation succeeds, `queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] })` refetches the shipment detail (which includes the updated `shipment_products[]`).

#### ShipmentProductsTable columns

Row type is `ShipmentProduct`. Rendered as a plain shadcn `Table` — NOT the shared `DataTable` wrapper (no server pagination; products are embedded in the detail response).

| Column | Header | Cell renderer |
|---|---|---|
| `product_sku_name` | Producto | `<div><span className="font-mono text-sm">{product.product.sku}</span><br/><span className="font-medium">{product.product.name}</span></div>` |
| `quantity` | Cantidad | plain number |
| `unit_price` | Precio unitario | `$ {parseFloat(product.unit_price).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` |
| `line_total` | Total línea | `$ {parseFloat(product.line_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` — read-only, no input |
| `notes` | Notas | `product.notes ?? <span className="text-muted-foreground">—</span>` |
| actions | (empty) | `Button variant="ghost" size="sm"` with `Pencil` icon for "Editar"; `Button variant="ghost" size="sm" className="text-destructive"` with `Trash2` icon for "Eliminar" |

Show empty state row "Sin productos. Agrega el primer producto al envío." when `products.length === 0`.

#### ShipmentProductForm fields

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `product` | Producto | `Select` | required (create only; disabled in edit mode) | Options from `useProductsList().data?.results ?? []`; each option labeled `{product.sku} — {product.name}`, value is `String(product.id)`; on selection, auto-fill `unit_price` with `product.unit_price` using `setValue('unit_price', selectedProduct.unit_price)` |
| `quantity` | Cantidad | number input | required, positive integer, min 1 | `type="number"`, `min="1"`, `step="1"`, use `valueAsNumber: true` in register |
| `unit_price` | Precio unitario | text input | required, positive decimal string | Validate with regex `/^\d+(\.\d+)?$/`; auto-filled when product is selected but editable |
| `notes` | Notas | textarea | optional | Multi-line; blank → omit field |

Zod schema:

```ts
const shipmentProductSchema = z.object({
  product: z.string().min(1, 'El producto es requerido'),
  quantity: z
    .number({ invalid_type_error: 'Debe ser un número entero' })
    .int()
    .positive('La cantidad debe ser mayor que 0'),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  notes: z.string().optional(),
});
```

On submit, clean values before sending to API:
- `product` → `parseInt(values.product, 10)` (send only on create; omit in PATCH edit)
- `quantity` → integer (already a number via `valueAsNumber`)
- `unit_price` → string as-is (decimal string)
- `notes`: if empty string → omit; otherwise include
- NEVER send `line_total` (backend auto-calculates)

In edit mode, the `product` field is disabled (the product cannot be changed — only quantity, unit_price, notes). The PATCH body for edit does NOT include `product`.

Surface backend uniqueness error in `onError` handler:
- `{ "product": ["Este producto ya está registrado en este envío."] }` → `form.setError('product', { message: errors.product[0] })`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Shipment` | Full object returned by detail fetch; includes `shipment_products: ShipmentProduct[]`; returned by create/update mutations |
| `ShipmentCreate` | `useCreateShipment` mutation variables; create form submit body |
| `ShipmentUpdate` | `useUpdateShipment` mutation variables; edit form submit body |
| `ShipmentStatus` | `status` field union type; columns badge, edit form select |
| `ShipmentPriority` | `priority` field union type; columns badge, create form select |
| `ShipmentProduct` | Each product object in `Shipment.shipment_products[]`; row type for products table |
| `ShipmentProductCreate` | `useAddShipmentProduct` mutation variables; product add form body |
| `ShipmentProductUpdate` | `useUpdateShipmentProduct` mutation variables; product edit form body |
| `CustomerSummary` | Nested customer object on `Shipment`; `{ id, name, customer_type }` |
| `WarehouseSummary` | Nested origin_warehouse object on `Shipment`; `{ id, code, name, city }` |
| `RouteSummary` | Nested route object on `Shipment` (nullable); `{ id, code, name, origin_city, destination_city }` |
| `VehicleSummary` | Nested vehicle object on `Shipment` (nullable); `{ id, plate, vehicle_type }` |
| `PaginatedResponse<T>` | Return type of the list query and all FK dropdown queries |
| `Customer` | Used in `useCustomersList` return type |
| `WarehouseSummary` | Used in `useWarehousesList` return type |
| `RouteListItem` | Local interface already defined in `hooks/use-routes.ts`; reused for `useRoutesList` return type |
| `VehicleListItem` | Local interface already defined in `hooks/use-vehicles.ts`; reused for `useVehiclesList` return type |
| `Product` | Used in `useProductsList` return type; also used to auto-fill `unit_price` on product select |

Local interface (defined in `hooks/use-shipments.ts`):

```ts
export interface ShipmentListItem {
  id: number;
  tracking_code: string;
  customer: { id: number; name: string; customer_type: string };
  status: ShipmentStatus;
  priority: ShipmentPriority;
  destination_city: string;
  scheduled_date: string;
  total_cost: string;
}
```

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/shipments/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<ShipmentListItem>`. `search` matches `tracking_code` or `recipient_name`. `ordering` values: `scheduled_date`, `-scheduled_date`, `created_at`, `-created_at`, `total_cost`, `-total_cost`, `status`, `-status` |
| `GET` | `/shipments/{id}/` | — | Returns full `Shipment` with embedded `shipment_products[]`. Used by edit sheet and detail page |
| `POST` | `/shipments/` | `ShipmentCreate` body | Returns `Shipment` (HTTP 201). Required: `customer`, `origin_warehouse`, `origin_address`, `destination_address`, `destination_city`, `recipient_name`, `scheduled_date`. Do NOT send `tracking_code` |
| `PATCH` | `/shipments/{id}/` | `ShipmentUpdate` body (any subset) | Used for edit form (status, route, vehicle, costs, actual_delivery). Does NOT modify `shipment_products` |
| `DELETE` | `/shipments/{id}/` | — | Returns HTTP 204. Hard delete — cascade deletes all shipment products. Only after user confirms |
| `GET` | `/customers/` | `?page_size=100&ordering=name` | Used by `useCustomersList` in create/edit form dropdown |
| `GET` | `/warehouses/` | `?page_size=100&ordering=name` | Used by `useWarehousesList` in create form dropdown |
| `GET` | `/routes/` | `?page_size=100&ordering=name` | Used by `useRoutesList` in create/edit form dropdown |
| `GET` | `/vehicles/` | `?page_size=100&ordering=plate` | Used by `useVehiclesList` in create/edit form dropdown |
| `GET` | `/products/` | `?page_size=100&ordering=name` | Used by `useProductsList` in product add form dropdown |
| `POST` | `/shipments/{shipment_pk}/products/` | `ShipmentProductCreate` body | Returns `ShipmentProduct` (HTTP 201). Required: `product`, `quantity`, `unit_price`. Error on duplicate product: `{ "product": ["Este producto ya está registrado en este envío."] }`. `line_total` is auto-calculated — never send |
| `PATCH` | `/shipments/{shipment_pk}/products/{pk}/` | `ShipmentProductUpdate` body (quantity, unit_price, notes — no product field) | Returns updated `ShipmentProduct` |
| `DELETE` | `/shipments/{shipment_pk}/products/{pk}/` | — | Returns HTTP 204 |

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/shipments/page.tsx` | List page: owns pagination/search/ordering state and all sheet/dialog state; renders `DataTable` with toolbar and columns |
| `app/(dashboard)/shipments/[id]/page.tsx` | Detail page: fetches shipment by id (including `shipment_products[]`), renders `ShipmentInfoCard`, `ShipmentProductsTable`, product sheet, product delete dialog, shipment edit sheet |
| `hooks/use-shipments.ts` | TanStack Query hooks: `ShipmentListItem` interface, `useShipments(params)` (list, `keepPreviousData`), `useShipment(id)` (detail, `enabled: !!id`), `useCreateShipment(onSuccess?)` (POST), `useUpdateShipment(onSuccess?)` (PATCH — invalidates list + detail), `useDeleteShipment(onSuccess?)` (DELETE) |
| `hooks/use-shipment-products.ts` | TanStack Query mutation hooks: `useAddShipmentProduct(onSuccess?)` (POST nested), `useUpdateShipmentProduct(onSuccess?)` (PATCH nested), `useRemoveShipmentProduct(onSuccess?)` (DELETE nested) — all invalidate `['shipments', shipmentId]` on success |
| `components/shipments/shipments-columns.tsx` | `ColumnDef<ShipmentListItem>[]` via `createShipmentColumns(actions)` factory; exports `STATUS_LABELS`, `STATUS_BADGE_CLASSES`, `PRIORITY_LABELS`, `PRIORITY_BADGE_CLASSES` constants; `ColumnActions` interface |
| `components/shipments/shipment-create-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-2xl overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`; renders `ShipmentCreateForm` immediately (no pre-population needed); title: "Nuevo envío" |
| `components/shipments/shipment-create-form.tsx` | `react-hook-form` + `zod` form using `shipmentCreateSchema`; calls `useCreateShipment`; includes all FK selects (customer, origin_warehouse, route, vehicle) and text inputs; handles `onSuccess` callback |
| `components/shipments/shipment-edit-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `shipmentId?: number`; when `shipmentId` is provided, calls `useShipment(shipmentId)` inside the sheet; shows loading skeleton while fetching; renders `ShipmentEditForm` with `defaultValues` once resolved; displays `tracking_code` as read-only field; title: "Editar envío" |
| `components/shipments/shipment-edit-form.tsx` | `react-hook-form` + `zod` form using `shipmentEditSchema`; accepts `defaultValues: Shipment` and `onSuccess: () => void`; calls `useUpdateShipment`; includes status select, route select, vehicle select, cost text inputs, actual_delivery datetime-local input, estimated_delivery date input; pre-populates all fields from `defaultValues` |
| `components/shipments/shipment-delete-dialog.tsx` | shadcn `AlertDialog`; props: `trackingCode: string`, `shipmentId: number \| null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; warns about cascade deletion of products; calls `useDeleteShipment` on confirm |
| `components/shipments/shipment-info-card.tsx` | Displays all shipment fields in a shadcn `Card`; receives `shipment: Shipment` and `onEdit: () => void`; shows tracking_code (font-mono), status badge, priority badge, customer name, warehouse, route, vehicle, origin/destination addresses and cities, recipient name/phone, scheduled_date, estimated_delivery, actual_delivery, costs (base_cost, tax_amount, total_cost), notes; "Editar envío" Button calls `onEdit` |
| `components/shipments/shipment-products-table.tsx` | Receives `products: ShipmentProduct[]`, `onEdit: (product: ShipmentProduct) => void`, `onDelete: (product: ShipmentProduct) => void`; renders a shadcn `Table` (not DataTable wrapper); columns: product SKU/name, quantity, unit_price, line_total (read-only), notes, actions; empty state row when `products.length === 0` |
| `components/shipments/shipment-product-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `shipmentId: number`, `product?: ShipmentProduct`; when `product` is provided, renders `ShipmentProductForm` in edit mode with pre-populated values; when `product` is undefined, renders `ShipmentProductForm` in add mode; title: "Agregar producto" or "Editar producto" |
| `components/shipments/shipment-product-form.tsx` | `react-hook-form` + `zod` form using `shipmentProductSchema`; accepts `defaultValues?: ShipmentProduct`, `shipmentId: number`, `onSuccess: () => void`; calls `useAddShipmentProduct` or `useUpdateShipmentProduct` based on `defaultValues?.id`; includes product select (disabled in edit mode, auto-fills unit_price on selection), quantity number input, unit_price text input, notes textarea; surfaces backend uniqueness error on `product` field |
| `components/shipments/shipment-product-delete-dialog.tsx` | shadcn `AlertDialog`; props: `productName: string`, `shipmentId: number`, `productId: number \| null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar el producto "${productName}" de este envío? Esta acción no se puede deshacer.`; calls `useRemoveShipmentProduct` on confirm |

### Files to modify

| File | Change |
|---|---|
| `hooks/use-customers.ts` | Add and export `useCustomersList()` — `useQuery` with `queryKey: ['customers-list']`, calls `GET /customers/?page_size=100&ordering=name`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Customer>` |
| `hooks/use-warehouses.ts` | Add and export `useWarehousesList()` — `useQuery` with `queryKey: ['warehouses-list']`, calls `GET /warehouses/?page_size=100&ordering=name`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<WarehouseSummary>` |
| `hooks/use-routes.ts` | Add and export `useRoutesList()` — `useQuery` with `queryKey: ['routes-list']`, calls `GET /routes/?page_size=100&ordering=name`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<RouteListItem>` |
| `hooks/use-vehicles.ts` | Add and export `useVehiclesList()` — `useQuery` with `queryKey: ['vehicles-list']`, calls `GET /vehicles/?page_size=100&ordering=plate`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<VehicleListItem>` |
| `hooks/use-products.ts` | Add and export `useProductsList()` — `useQuery` with `queryKey: ['products-list']`, calls `GET /products/?page_size=100&ordering=name`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Product>` |
| `components/layout/sidebar.tsx` | Import `Package` (or `Truck`) icon from `lucide-react` — use `PackageSearch` or `PackageOpen` — and add `{ href: '/shipments', label: 'Envíos', icon: PackageOpen }` to the `navLinks` array, placed after the Rutas entry |

---

## Tasks

- [x] 1. Modify `hooks/use-customers.ts` — add and export `useCustomersList()`: `useQuery` with `queryKey: ['customers-list']`, calls `GET /customers/` with params `{ page_size: 100, ordering: 'name' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Customer>`

- [x] 2. Modify `hooks/use-warehouses.ts` — add and export `useWarehousesList()`: `useQuery` with `queryKey: ['warehouses-list']`, calls `GET /warehouses/` with params `{ page_size: 100, ordering: 'name' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<WarehouseSummary>`

- [x] 3. Modify `hooks/use-routes.ts` — add and export `useRoutesList()`: `useQuery` with `queryKey: ['routes-list']`, calls `GET /routes/` with params `{ page_size: 100, ordering: 'name' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<RouteListItem>`

- [x] 4. Modify `hooks/use-vehicles.ts` — add and export `useVehiclesList()`: `useQuery` with `queryKey: ['vehicles-list']`, calls `GET /vehicles/` with params `{ page_size: 100, ordering: 'plate' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<VehicleListItem>`

- [x] 5. Modify `hooks/use-products.ts` — add and export `useProductsList()`: `useQuery` with `queryKey: ['products-list']`, calls `GET /products/` with params `{ page_size: 100, ordering: 'name' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Product>`

- [x] 6. Create `hooks/use-shipments.ts` — export:
  - `ShipmentListItem` interface (id, tracking_code, customer `{ id, name, customer_type }`, status, priority, destination_city, scheduled_date, total_cost)
  - `useShipments(params: { page: number; page_size: number; search?: string; ordering?: string })` — `useQuery` with `queryKey: ['shipments', params]`, calls `GET /shipments/` with params, returns `PaginatedResponse<ShipmentListItem>`, uses `keepPreviousData`
  - `useShipment(id: number | undefined)` — `useQuery` with `queryKey: ['shipments', id]`, calls `GET /shipments/${id}/`, returns `Shipment`, `enabled: !!id`
  - `useCreateShipment(onSuccess?: () => void)` — `useMutation` POST `/shipments/`, body `ShipmentCreate`, invalidates `['shipments']` on success
  - `useUpdateShipment(onSuccess?: () => void)` — `useMutation` PATCH `/shipments/${id}/`, body `{ id: number; data: ShipmentUpdate }`, on success invalidates `['shipments']` and `['shipments', id]`
  - `useDeleteShipment(onSuccess?: () => void)` — `useMutation` DELETE `/shipments/${id}/`, invalidates `['shipments']` on success

- [x] 7. Create `hooks/use-shipment-products.ts` — export:
  - `useAddShipmentProduct(onSuccess?: () => void)` — `useMutation`, calls `POST /shipments/${shipmentId}/products/`, variables `{ shipmentId: number; data: ShipmentProductCreate }`, on success invalidates `['shipments', shipmentId]`
  - `useUpdateShipmentProduct(onSuccess?: () => void)` — `useMutation`, calls `PATCH /shipments/${shipmentId}/products/${productId}/`, variables `{ shipmentId: number; productId: number; data: ShipmentProductUpdate }`, on success invalidates `['shipments', shipmentId]`
  - `useRemoveShipmentProduct(onSuccess?: () => void)` — `useMutation`, calls `DELETE /shipments/${shipmentId}/products/${productId}/`, variables `{ shipmentId: number; productId: number }`, on success invalidates `['shipments', shipmentId]`

- [x] 8. Create `components/shipments/shipments-columns.tsx` — define and export:
  - `STATUS_LABELS: Record<ShipmentStatus, string>` — all 9 values in Spanish
  - `STATUS_BADGE_CLASSES: Record<ShipmentStatus, string>` — Tailwind className strings per the color map defined in the spec
  - `PRIORITY_LABELS: Record<ShipmentPriority, string>` — all 4 values in Spanish
  - `PRIORITY_BADGE_CLASSES: Record<ShipmentPriority, string>` — Tailwind className strings for gray/blue/orange/red
  - `ColumnActions` interface: `{ onEdit: (id: number) => void; onDelete: (id: number, trackingCode: string) => void; onView: (id: number) => void }`
  - `createShipmentColumns(actions: ColumnActions): ColumnDef<ShipmentListItem>[]` with columns: `tracking_code` (font-mono font-medium), `customer_name` (accessorFn returning customer.name, font-medium), `status` (Badge outline + color className + Spanish label), `priority` (Badge outline + color className + Spanish label), `destination_city` (plain text), `scheduled_date` (formatted with `toLocaleDateString('es-CO')` appending `T00:00:00` to avoid UTC shift), `total_cost` (formatted currency with `toLocaleString('es-CO', { minimumFractionDigits: 2 })`), `actions` (DropdownMenu with "Ver detalle", "Editar", "Eliminar")

- [x] 9. Create `components/shipments/shipment-create-form.tsx` — `react-hook-form` + `zod` form using `shipmentCreateSchema`; fields in order: `customer` (Select from `useCustomersList`), `origin_warehouse` (Select from `useWarehousesList`), `origin_address` (text), `destination_address` (text), `destination_city` (text), `destination_country` (text, optional), `recipient_name` (text), `recipient_phone` (text, optional), `scheduled_date` (date input), `priority` (Select with 4 options using `PRIORITY_LABELS`), `route` (Select from `useRoutesList`, optional, with "Sin ruta" empty option), `vehicle` (Select from `useVehiclesList`, optional, with "Sin vehículo" empty option), `notes` (textarea, optional); on submit: clean FK fields to integers, empty route/vehicle to omit, empty strings to omit; call `useCreateShipment`; show loading state on submit button while `isPending`; show loading state on FK selects while their respective list queries are loading; accept `onSuccess: () => void` prop

- [x] 10. Create `components/shipments/shipment-create-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-2xl overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`; renders `ShipmentCreateForm` immediately (no pre-population); `onSuccess={() => onOpenChange(false)}`; title: "Nuevo envío" with subtitle "Completa los datos para registrar un nuevo envío"

- [x] 11. Create `components/shipments/shipment-edit-form.tsx` — `react-hook-form` + `zod` form using `shipmentEditSchema`; accepts `defaultValues: Shipment` and `onSuccess: () => void`; pre-populates all fields from `defaultValues` as described in the spec (status, route as String(id) or `""`, vehicle as String(id) or `""`, base_cost, tax_amount, total_cost as strings, actual_delivery converted to `datetime-local` format, estimated_delivery); fields in order: `status` (Select with 9 options using `STATUS_LABELS`), `route` (Select from `useRoutesList`, with "Sin ruta" `""` option), `vehicle` (Select from `useVehiclesList`, with "Sin vehículo" `""` option), `base_cost` (text), `tax_amount` (text), `total_cost` (text), `estimated_delivery` (date input, optional), `actual_delivery` (datetime-local input, optional); on submit: clean route/vehicle (empty string → send `null`; non-empty → parseInt; undefined → omit), clean decimal strings (empty → omit), clean actual_delivery (empty → omit); call `useUpdateShipment` with the shipment id from `defaultValues.id`; show loading state on submit button while `isPending`

- [x] 12. Create `components/shipments/shipment-edit-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `shipmentId?: number`; when `shipmentId` is provided, call `useShipment(shipmentId)` inside the sheet; show centered spinner/skeleton while `isLoading`; once resolved, render a read-only tracking_code display (`<p className="font-mono text-sm text-muted-foreground">{shipment.tracking_code}</p>`) then `ShipmentEditForm` with `defaultValues={shipment}` and `onSuccess={() => onOpenChange(false)}`; title: "Editar envío"

- [x] 13. Create `components/shipments/shipment-delete-dialog.tsx` — shadcn `AlertDialog`; props: `trackingCode: string`, `shipmentId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar el envío "${trackingCode}"? Se eliminarán también todos los productos asociados. Esta acción no se puede deshacer.`; on confirm call `useDeleteShipment(() => onOpenChange(false)).mutate(shipmentId)`; both AlertDialogAction and AlertDialogCancel disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 14. Create `app/(dashboard)/shipments/page.tsx` — `'use client'`; local state:
  - `searchInput: string` (raw input value)
  - `search: string` (debounced 300ms, resets `page` to 0 on change)
  - `page: number` (0-indexed, default 0)
  - `pageSize: number` (default 20)
  - `ordering: string` (default `'-created_at'`)
  - `createSheetOpen: boolean`
  - `editSheetOpen: boolean`
  - `selectedShipmentId: number | undefined`
  - `deleteDialogOpen: boolean`
  - `shipmentToDeleteId: number | null`
  - `shipmentToDeleteCode: string`
  - Calls `useShipments({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`
  - Computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`
  - Uses `useMemo` for columns, `useCallback` for all handlers
  - `onView(id)` handler uses `router.push(`/shipments/${id}`)` (import `useRouter` from `next/navigation`)
  - Renders page heading "Envíos" and subtitle "Gestiona los envíos y órdenes de entrega"

- [x] 15. Wire the toolbar in `app/(dashboard)/shipments/page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` with a controlled `Input` (bound to `searchInput`, `placeholder="Buscar por código de rastreo o destinatario…"`) and a "Nuevo envío" `Button` (with `Plus` icon from `lucide-react`) that opens `createSheetOpen`

- [x] 16. Wire row actions via the `ColumnActions` interface in `app/(dashboard)/shipments/page.tsx`: `onEdit(id)` sets `selectedShipmentId = id` and opens `editSheetOpen`; `onDelete(id, trackingCode)` sets `shipmentToDeleteId = id`, `shipmentToDeleteCode = trackingCode`, and opens `deleteDialogOpen`; `onView(id)` calls `router.push(`/shipments/${id}`)`; `handleEditSheetOpenChange` clears `selectedShipmentId` when sheet closes

- [x] 17. Create `components/shipments/shipment-info-card.tsx` — receives `shipment: Shipment` and `onEdit: () => void`; renders a shadcn `Card` with header (tracking_code in font-mono + status badge + priority badge + "Editar envío" Button) and content grid showing: customer name, origin_warehouse code/name/city, route (code + name or "—"), vehicle (plate or "—"), origin_address, destination_address + destination_city + destination_country, recipient_name + recipient_phone, scheduled_date (formatted), estimated_delivery (formatted or "—"), actual_delivery (formatted or "—"), base_cost + tax_amount + total_cost (each formatted as currency), notes (or "—"); use `STATUS_LABELS`, `STATUS_BADGE_CLASSES`, `PRIORITY_LABELS`, `PRIORITY_BADGE_CLASSES` from `components/shipments/shipments-columns.tsx`

- [x] 18. Create `components/shipments/shipment-products-table.tsx` — receives `products: ShipmentProduct[]`, `onEdit: (product: ShipmentProduct) => void`, `onDelete: (product: ShipmentProduct) => void`; client-sort: `[...products].sort((a, b) => a.id - b.id)` (maintain stable order); renders a shadcn `Table`; columns: product SKU (font-mono) + name (font-medium) in one cell, quantity (integer), unit_price (formatted currency), line_total (formatted currency, visually distinct e.g. `font-medium`), notes (or `<span className="text-muted-foreground">—</span>`), actions (Pencil ghost button for edit, Trash2 destructive ghost button for remove); show empty state row "Sin productos. Agrega el primer producto al envío." when `products.length === 0`

- [x] 19. Create `components/shipments/shipment-product-form.tsx` — `react-hook-form` + `zod` form using `shipmentProductSchema`; accepts `defaultValues?: ShipmentProduct`, `shipmentId: number`, `onSuccess: () => void`; calls `useProductsList()` internally to populate product select; fields in order: `product` (Select populated from `useProductsList().data?.results ?? []`, each option labeled `{sku} — {name}`, value is `String(product.id)`, disabled and locked in edit mode when `defaultValues?.id` is set, on change call `setValue('unit_price', selectedProduct.unit_price)`), `quantity` (number input, `type="number"`, `min="1"`, `step="1"`, `valueAsNumber: true` in register), `unit_price` (text input), `notes` (textarea, optional); on submit: call `useAddShipmentProduct` or `useUpdateShipmentProduct` based on `defaultValues?.id`; in add mode body: `{ product: parseInt(values.product, 10), quantity, unit_price: values.unit_price, notes: values.notes || undefined }`; in edit mode body: `{ quantity, unit_price: values.unit_price, notes: values.notes || undefined }` (do NOT include `product` or `line_total`); surface backend uniqueness error `{ "product": [...] }` → `form.setError('product', { message: errors.product[0] })`; show loading state on submit button while `isPending`

- [x] 20. Create `components/shipments/shipment-product-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `shipmentId: number`, `product?: ShipmentProduct`; when `product` is provided render `ShipmentProductForm` with `defaultValues={product}` (edit mode); when `product` is undefined render `ShipmentProductForm` with no `defaultValues` (add mode); `onSuccess={() => onOpenChange(false)}`; title: "Agregar producto" (add) or "Editar producto" (edit)

- [x] 21. Create `components/shipments/shipment-product-delete-dialog.tsx` — shadcn `AlertDialog`; props: `productName: string`, `shipmentId: number`, `productId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar el producto "${productName}" de este envío? Esta acción no se puede deshacer.`; on confirm call `useRemoveShipmentProduct(() => onOpenChange(false)).mutate({ shipmentId, productId })`; both buttons disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 22. Create `app/(dashboard)/shipments/[id]/page.tsx` — `'use client'`; receives `params: { id: string }`; parses `shipmentId = parseInt(params.id, 10)`; calls `useShipment(shipmentId)`; local state:
  - `productSheetOpen: boolean`
  - `selectedProduct: ShipmentProduct | undefined` (undefined = add mode)
  - `productDeleteDialogOpen: boolean`
  - `productToDelete: ShipmentProduct | null`
  - `editSheetOpen: boolean` (for editing the shipment itself from the detail page)
  - Show loading state (spinner or skeleton) while `isLoading`; show error message if `isError`; when loaded, render: a "Volver a envíos" `Button` (with `ArrowLeft` icon, calls `router.push('/shipments')`), page heading (tracking_code, font-mono), `ShipmentInfoCard` with `shipment` data and `onEdit={() => setEditSheetOpen(true)}`, a section heading "Productos del envío" with "Agregar producto" `Button` (with `Plus` icon) that opens product sheet in add mode, `ShipmentProductsTable` receiving `shipment.shipment_products`, `onEdit`, and `onDelete` callbacks; `ShipmentEditSheet` (for editing the shipment), `ShipmentProductSheet`, `ShipmentProductDeleteDialog`
  - `onEdit(product)` sets `selectedProduct = product` and opens `productSheetOpen`
  - `onDelete(product)` sets `productToDelete = product` and opens `productDeleteDialogOpen`
  - `handleProductSheetOpenChange(v)` clears `selectedProduct` when sheet closes

- [x] 23. Modify `components/layout/sidebar.tsx` — import `PackageOpen` (or `Package`) icon from `lucide-react` and add `{ href: '/shipments', label: 'Envíos', icon: PackageOpen }` to `navLinks` after the Rutas entry

- [SKIPPED] 24. Manual smoke test (SKIPPED — requires live backend): (a) `/shipments` loads paginated list with correct columns (tracking_code font-mono, customer name, status badge colored, priority badge colored, destination_city, scheduled_date, total_cost currency, actions); (b) search by tracking_code or recipient_name filters results; (c) "Nuevo envío" opens create sheet — all FK selects populate (customer, warehouse, route, vehicle), form submission creates shipment (HTTP 201), tracking_code is NOT sent in body, response includes auto-generated tracking_code, row appears in table; (d) "Editar" opens edit sheet — detail fetch fires, tracking_code shows as read-only text, all edit fields pre-populate, PATCH succeeds; (e) route/vehicle "Sin ruta"/"Sin vehículo" sends `null` on PATCH; (f) "Eliminar" shows confirm dialog with tracking_code AND cascade warning, on confirm hard-deletes (HTTP 204); (g) "Ver detalle" navigates to `/shipments/{id}`; (h) detail page shows `ShipmentInfoCard` with all fields including tracking_code, status/priority badges, route/vehicle (or "—"), costs; (i) products table shows `shipment_products` from detail response; (j) "Agregar producto" opens product sheet — product select populates from products list, on selection unit_price auto-fills from product, form submission adds product (HTTP 201), product row appears without page reload; (k) duplicate product shows field-level error "Este producto ya está registrado en este envío."; (l) "Editar" on product opens product sheet in edit mode — product select disabled, quantity/unit_price/notes editable; (m) "Eliminar" on product shows confirm dialog, on confirm removes product, table updates; (n) line_total is NOT sent in any product request body; (o) status badge colors match spec (PENDING=gray, CONFIRMED=blue, IN_WAREHOUSE=indigo, IN_TRANSIT=orange, OUT_FOR_DELIVERY=yellow, DELIVERED=green, FAILED=red, CANCELLED=red, RETURNED=purple); (p) priority badge colors match spec; (q) "Volver a envíos" returns to list; (r) "Envíos" nav link highlights when on `/shipments` or `/shipments/[id]`; (s) pagination controls work on list page

---

## Validation criteria

All tasks 1–23 are independently verifiable by static analysis (file existence, exports, type correctness, hook signatures, component props, correct query keys). Task 24 requires a live backend.

Build must pass with `npm run build` (zero TypeScript errors). Lint must pass with `npm run lint` (zero errors).

---

## Validation Summary

**Date:** 2026-05-28
**Build:** Pass — zero TypeScript errors, all 14 routes generated successfully
**Lint:** Pass — 0 errors (3 pre-existing warnings from other modules, unrelated to Shipments)
**Tasks:** 23/23 passed (Task 24 skipped — requires live backend)

### Verified items

- Task 1: `useCustomersList()` added to `hooks/use-customers.ts` — correct queryKey, staleTime, endpoint
- Task 2: `useWarehousesList()` added to `hooks/use-warehouses.ts` — correct queryKey, staleTime, endpoint
- Task 3: `useRoutesList()` added to `hooks/use-routes.ts` — correct queryKey, staleTime, endpoint
- Task 4: `useVehiclesList()` added to `hooks/use-vehicles.ts` — correct queryKey, staleTime, ordering by plate
- Task 5: `useProductsList()` added to `hooks/use-products.ts` — correct queryKey, staleTime, endpoint
- Task 6: `hooks/use-shipments.ts` — all 6 exports present; `ShipmentListItem` interface correct; `useUpdateShipment` invalidates both `['shipments']` AND `['shipments', id]`; `tracking_code` never sent in POST body
- Task 7: `hooks/use-shipment-products.ts` — all 3 mutation hooks present; all invalidate `['shipments', shipmentId]` on success
- Task 8: `components/shipments/shipments-columns.tsx` — all 4 maps exported; STATUS_LABELS has all 9 values; PRIORITY_LABELS has all 4 values; STATUS_BADGE_CLASSES and PRIORITY_BADGE_CLASSES match spec colors; `ColumnActions` interface correct; `createShipmentColumns` factory correct with all 8 columns
- Task 9: `shipment-create-form.tsx` — all required fields present; tracking_code NOT in body; route/vehicle empty string omitted (not sent as null); FK selects populated from list hooks
- Task 10: `shipment-create-sheet.tsx` — correct Sheet side/className, title, subtitle, renders create form
- Task 11: `shipment-edit-form.tsx` — all edit fields present; route/vehicle empty string → null; actual_delivery appends `:00` if length 16; tracking_code NOT in body; line_total NOT in body; pre-populates from defaultValues
- Task 12: `shipment-edit-sheet.tsx` — calls `useShipment(shipmentId)`, shows loading state, renders tracking_code as read-only `<p>` with font-mono, renders ShipmentEditForm
- Task 13: `shipment-delete-dialog.tsx` — cascade warning in description, both buttons disabled while isPending
- Task 14: `app/(dashboard)/shipments/page.tsx` — all 9 state variables present; `useShipments` called with page+1; `useMemo` for columns; `useCallback` for handlers; `useRouter` for navigation
- Task 15: toolbar renders DataTableToolbar with search Input and "Nuevo envío" Button with Plus icon
- Task 16: row actions wired — `onEdit` sets selectedShipmentId and opens editSheet; `onDelete` sets ids/code; `handleEditSheetOpenChange` clears selectedShipmentId on close
- Task 17: `shipment-info-card.tsx` — all fields displayed; uses STATUS_LABELS/BADGE_CLASSES and PRIORITY_LABELS/BADGE_CLASSES; "Editar envío" Button calls onEdit
- Task 18: `shipment-products-table.tsx` — shadcn Table (not DataTable wrapper); all 6 columns; empty state row with correct text; client-sort by id; Pencil/Trash2 action buttons
- Task 19: `shipment-product-form.tsx` — product Select disabled in edit mode; `setValue('unit_price', selected.unit_price)` on product selection; backend uniqueness error surfaced; line_total NOT sent in any body; product NOT sent in PATCH body
- Task 20: `shipment-product-sheet.tsx` — correct Sheet props; title changes between add/edit; passes product as defaultValues
- Task 21: `shipment-product-delete-dialog.tsx` — correct description template; both buttons disabled while isPending; calls `useRemoveShipmentProduct`
- Task 22: `app/(dashboard)/shipments/[id]/page.tsx` — `useShipment(shipmentId)` called; all state variables present; loading/error states; ShipmentInfoCard, ShipmentProductsTable, all sheets and dialogs rendered; handlers clear state on close
- Task 23: `components/layout/sidebar.tsx` — `PackageOpen` icon imported from lucide-react; `{ href: '/shipments', label: 'Envíos', icon: PackageOpen }` added after Rutas entry

### Failures

None — all 23 verifiable tasks pass.
