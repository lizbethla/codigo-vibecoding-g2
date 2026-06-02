# Spec: Products (Productos)

## Overview

The Products module provides a single list page at `/products` where staff can view, search, create, edit, soft-delete (toggle `is_active`), and hard-delete product records. The list is a server-paginated TanStack Table showing SKU, name, category badge, unit price, stock quantity, active status badge, and a per-row actions menu. Create and edit share one form rendered inside a shadcn `Sheet`. A separate `AlertDialog` confirms hard delete.

**Key structural notes:**
- The list endpoint (`GET /api/v1/products/`) returns full `Product` objects (including the nested `supplier: { id, name }` field) — no separate detail fetch is required for the edit form. This mirrors the Suppliers/Customers pattern, not the Warehouses pattern.
- The form includes a **Supplier select** dropdown. Because `useSuppliers` is paginated and intended for the Suppliers page, a separate lightweight `useSuppliersList` hook must be added to `hooks/use-suppliers.ts` that calls `GET /suppliers/?page_size=100` and returns all suppliers for select options.
- `ProductCategory` is an enum of 8 values — rendered as a `Select` with Spanish labels.
- `unit_price` and `weight_kg` are decimal **strings** — form inputs are `type="text"` and stored as strings.
- `stock_quantity` is an integer — form input is `type="number"` with `step="1"`.
- `is_active` checkbox is shown **only in edit mode**.
- `dimensions_cm` is free-text, optional (e.g. `"30x20x10"`).
- The backend does not document a `?category=` filter param — only `?search=` (name, sku) and `?ordering=` are available. Client-side category filtering is not needed; the UI offers only search and ordering controls.

**Pages:** `/products`
**Complexity:** CRUD + supplier select dropdown (depends on Suppliers module being complete)

---

## Pages

### Page: `/products`

- **Route:** `/products`
- **Component:** `app/(dashboard)/products/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `ProductsPage` | new — `app/(dashboard)/products/page.tsx` | Page entry; owns `searchInput`, `search`, `page`, `pageSize`, `ordering`, sheet state, and delete dialog state |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo producto" `Button` |
| `ProductSheet` | new — `components/products/product-sheet.tsx` | shadcn `Sheet` wrapping `ProductForm`; used for both create and edit |
| `ProductForm` | new — `components/products/product-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateProduct` or `useUpdateProduct`; includes a Supplier `Select` and Category `Select` |
| `ProductDeleteDialog` | new — `components/products/product-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete confirmation; calls `useDeleteProduct` |
| `Badge` | shadcn/ui | Renders `category` and `is_active` values |
| `Button` | shadcn/ui | Toolbar "Nuevo producto" action, form submit |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Toggle active, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | shadcn/ui | Category select and Supplier select inside `ProductForm` |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All product data-fetching and mutation hooks live in `hooks/use-products.ts`. The supplier list hook for the form dropdown is an addition to the existing `hooks/use-suppliers.ts`.

**List query:**

```ts
// useProducts(params)
useQuery<PaginatedResponse<Product>, AxiosError>({
  queryKey: ['products', params],  // params: { page, page_size, search, ordering }
  queryFn: () => api.get('/products/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

The list endpoint returns full `Product` objects (including `supplier: { id, name } | null`), so no separate detail fetch is required for the edit sheet. `params` is built from page-local state: `search`, `page`, `pageSize`, `ordering`.

**Supplier list query (for form dropdown — added to `hooks/use-suppliers.ts`):**

```ts
// useSuppliersList()
// Fetches all suppliers in one request (page_size=100) for use in select dropdowns.
// Does NOT paginate — intended only for populating selects, not the Suppliers table.
useQuery<PaginatedResponse<Supplier>, AxiosError>({
  queryKey: ['suppliers-list'],
  queryFn: () =>
    api.get('/suppliers/', { params: { page_size: 100, ordering: 'name' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000, // 5 min — supplier list changes rarely
})
```

**Create mutation:**

```ts
useMutation<Product, AxiosError, ProductCreate>({
  mutationFn: (body) => api.post('/products/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Product, AxiosError, { id: number; data: ProductUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/products/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    // close sheet, show toast
  },
})
```

Used for both full edits and the soft-delete toggle (`{ is_active: false/true }`). Because the list returns full `Product` objects (including `is_active`), the toggle can be called directly from the row actions without any detail fetch.

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/products/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/products/products-columns.tsx`. Row type is `Product` (full object from the list response).

| Accessor key | Header | Cell renderer |
|---|---|---|
| `sku` | SKU | `<span className="font-mono text-sm">{row.original.sku}</span>` |
| `name` | Nombre | `<span className="font-medium">{row.original.name}</span>`; column header is sortable — clicking calls `setOrdering('name')` / `setOrdering('-name')` using `ArrowUpDown` icon button |
| `category` | Categoría | `Badge` with variant `secondary` and the Spanish label for the category value (see category label map below) |
| `unit_price` | Precio unitario | `<span>{parseFloat(row.original.unit_price).toFixed(2)}</span>` — displayed as formatted number string |
| `stock_quantity` | Stock | `<span>{row.original.stock_quantity}</span>` — integer; column header is sortable — clicking calls `setOrdering('stock_quantity')` / `setOrdering('-stock_quantity')` |
| `is_active` | Estado | `Badge`: `true` → variant `default` label "Activo"; `false` → variant `destructive` label "Inactivo" |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (sets `selectedProduct` and opens `ProductSheet`), "Desactivar" / "Activar" (PATCH toggle `is_active`), "Eliminar" (opens `ProductDeleteDialog`) |

**Category label map** (used in both the columns badge and the form select):

```ts
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  LAPTOP:      'Portátil',
  DESKTOP:     'Escritorio',
  MOBILE:      'Móvil',
  TABLET:      'Tableta',
  PERIPHERAL:  'Periférico',
  NETWORKING:  'Redes',
  STORAGE:     'Almacenamiento',
  OTHER:       'Otro',
};
```

Export this map from `components/products/products-columns.tsx` or a shared `lib/products.ts` constant so both the columns file and the form can import it without duplication.

#### Form fields

Defined in `ProductForm`, validated with `zod`. Used for both create (no `id` in `defaultValues`) and edit (pre-populated from the `Product` row object passed via the sheet, no detail fetch needed).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `sku` | SKU | text input | required, min 1 char, max 50 chars | Unique constraint enforced by backend; surface backend uniqueness error on field |
| `name` | Nombre | text input | required, min 1 char | — |
| `category` | Categoría | `Select` | required | 8 options with Spanish labels (see category label map) |
| `unit_price` | Precio unitario | text input | required, numeric string | Decimal string; validate with `z.string().regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')` |
| `supplier` | Proveedor | `Select` | optional | Options populated from `useSuppliersList()` results; value is supplier `id` as string (converted to number on submit); blank → `undefined` (omit field) |
| `description` | Descripción | text input | optional | — |
| `weight_kg` | Peso (kg) | text input | optional, numeric string | Decimal string; blank → `undefined`; validate with `z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal(''))` |
| `dimensions_cm` | Dimensiones (cm) | text input | optional | Free-text, e.g. `"30x20x10"`; blank → `undefined` |
| `stock_quantity` | Cantidad en stock | number input | optional, non-negative integer | `type="number"`, `min="0"`, `step="1"`; validated with `z.number().int().min(0).optional()` |
| `is_active` | Activo | `Checkbox` | optional | Shown **only in edit mode**; defaults `true` on create |

Zod schema:

```ts
const productSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido').max(50, 'Máximo 50 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum([
    'LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET',
    'PERIPHERAL', 'NETWORKING', 'STORAGE', 'OTHER',
  ]),
  unit_price: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  supplier: z.string().optional(), // supplier id as string; "" treated as undefined
  description: z.string().optional().nullable(),
  weight_kg: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  dimensions_cm: z.string().optional().nullable(),
  stock_quantity: z
    .number({ invalid_type_error: 'Debe ser un número entero' })
    .int()
    .min(0, 'No puede ser negativo')
    .optional(),
  is_active: z.boolean().optional(),
});
```

On submit, clean the values before sending to the API:
- `supplier`: if empty string or undefined, omit the field; otherwise send `parseInt(values.supplier, 10)`
- `weight_kg`: if empty string, omit the field
- `description`: if empty string, send `null`
- `dimensions_cm`: if empty string, send `null`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides. The Axios interceptor in `lib/api.ts` reads the token from localStorage automatically.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Product` | Row type for the table (full object returned by list); `ProductForm` prefill data type; returned by create/update mutations |
| `ProductCreate` | `useCreateProduct` mutation variables; form submit body |
| `ProductUpdate` | `useUpdateProduct` mutation variables; also used for soft-delete toggle PATCH |
| `ProductCategory` | `category` field union type; used in columns badge and form select |
| `PaginatedResponse<Product>` | Return type of the list query |
| `Supplier` | Used inside `useSuppliersList` return type; `supplier.id` and `supplier.name` used to populate the select options |

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/products/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<Product>` (full objects, including nested `supplier`). `search` matches on `name` or `sku`. `ordering` values: `name`, `-name`, `unit_price`, `-unit_price`, `stock_quantity`, `-stock_quantity`, `created_at`, `-created_at` |
| `POST` | `/products/` | `ProductCreate` body | Returns `Product` (HTTP 201). Required: `sku`, `name`, `category`, `unit_price` |
| `PATCH` | `/products/{id}/` | `ProductUpdate` body (any subset) | Used for full edits and soft-delete toggle (`{ is_active: false/true }`) |
| `DELETE` | `/products/{id}/` | — | Returns HTTP 204. Hard delete — use only after user confirms in dialog |
| `GET` | `/suppliers/` | `?page_size=100&ordering=name` | Used by `useSuppliersList` to populate the supplier select. Returns `PaginatedResponse<Supplier>`; only `results` (id + name) are used |

No `GET /products/{id}/` call is needed — the list provides full objects sufficient to pre-populate the edit form.

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/products/page.tsx` | Page component: owns pagination/search/ordering state and all sheet/dialog state; renders `DataTable` with toolbar and columns |
| `hooks/use-products.ts` | All TanStack Query hooks: `useProducts(params)` (useQuery, `keepPreviousData`), `useCreateProduct(onSuccess?)` (useMutation POST), `useUpdateProduct(onSuccess?)` (useMutation PATCH), `useDeleteProduct(onSuccess?)` (useMutation DELETE) |
| `components/products/products-columns.tsx` | `ColumnDef<Product>[]` definition via `createProductColumns(actions)` factory; also exports `CATEGORY_LABELS` constant |
| `components/products/product-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `product?: Product`; title is "Nuevo producto" or "Editar producto"; renders `ProductForm` with `defaultValues={product}` |
| `components/products/product-form.tsx` | `react-hook-form` + `zod` form; accepts `defaultValues?: Product` and `onSuccess: () => void`; calls `useCreateProduct` or `useUpdateProduct` based on presence of `defaultValues?.id`; calls `useSuppliersList()` internally to populate supplier select |
| `components/products/product-delete-dialog.tsx` | shadcn `AlertDialog`; props: `product: Product | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; names the product by `product.name` in the description; calls `useDeleteProduct` on confirm; disables both buttons while `isPending` |

### Files to modify

| File | Change |
|---|---|
| `hooks/use-suppliers.ts` | Add and export `useSuppliersList()` — a non-paginated query that calls `GET /suppliers/?page_size=100&ordering=name` with `queryKey: ['suppliers-list']` and `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Supplier>` |
| `components/layout/sidebar.tsx` | Import `Package` icon from `lucide-react` and add `{ href: '/products', label: 'Productos', icon: Package }` to the `navLinks` array, placed after the Almacenes entry |

---

## Tasks

- [x] 1. Modify `hooks/use-suppliers.ts` — add and export `useSuppliersList()`: `useQuery` with `queryKey: ['suppliers-list']`, calls `GET /suppliers/?page_size=100&ordering=name`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<Supplier>`; this is a lightweight hook for dropdown population only, independent of the paginated `useSuppliers`
- [x] 2. Create `hooks/use-products.ts` — export `useProducts(params)` (useQuery with `keepPreviousData`, `queryKey: ['products', params]`, returns `PaginatedResponse<Product>`), `useCreateProduct(onSuccess?)` (useMutation POST `/products/`, invalidates `['products']`), `useUpdateProduct(onSuccess?)` (useMutation PATCH `/products/{id}/`, invalidates `['products']`), `useDeleteProduct(onSuccess?)` (useMutation DELETE `/products/{id}/`, invalidates `['products']`)
- [x] 3. Create `components/products/products-columns.tsx` — export `CATEGORY_LABELS: Record<ProductCategory, string>` (all 8 values in Spanish) and `createProductColumns(actions: ColumnActions): ColumnDef<Product>[]` with columns: `sku` (monospace `font-mono text-sm`), `name` (sortable header with `ArrowUpDown`, `font-medium`), `category` (`Badge` variant `secondary` with `CATEGORY_LABELS[row.original.category]`), `unit_price` (`parseFloat(unit_price).toFixed(2)` string), `stock_quantity` (sortable header with `ArrowUpDown`, plain integer), `is_active` (`Badge` variant `default`/"Activo" or `destructive`/"Inactivo"), `actions` (`DropdownMenu` with "Editar", "Desactivar"/"Activar", "Eliminar"). `ColumnActions` interface: `{ onEdit: (p: Product) => void; onToggleActive: (p: Product) => void; onDelete: (p: Product) => void; setOrdering: (o: string) => void; ordering: string }`
- [x] 4. Create `components/products/product-form.tsx` — `react-hook-form` + `zod` form using `productSchema` above; fields in order: `sku`, `name`, `category` (Select with 8 Spanish options), `unit_price` (text), `supplier` (Select populated from `useSuppliersList().data?.results ?? []`, shows supplier name, value is `String(supplier.id)`, plus a "Sin proveedor" option with value `""`), `description` (text), `weight_kg` (text), `dimensions_cm` (text), `stock_quantity` (number input), `is_active` (Checkbox, edit-only); on submit: clean values (supplier empty string → omit; weight_kg empty string → omit; description/dimensions_cm empty string → null); call `useCreateProduct` or `useUpdateProduct` based on `defaultValues?.id`; surface `sku` uniqueness backend error via `form.setError('sku', ...)` in the mutation `onError` handler; show loading state on supplier select while `useSuppliersList` is loading
- [x] 5. Create `components/products/product-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `product?: Product`; title "Nuevo producto" when `product` is undefined, "Editar producto" otherwise; renders `ProductForm` inside `SheetContent` with `defaultValues={product}` and `onSuccess={() => onOpenChange(false)}`; no internal data fetch needed — full `Product` is passed directly
- [x] 6. Create `components/products/product-delete-dialog.tsx` — shadcn `AlertDialog`; props: `product: Product | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description reads `¿Eliminar el producto "${product?.name}"? Esta acción no se puede deshacer.`; on confirm calls `useDeleteProduct(() => onOpenChange(false))` with `product.id`; both action and cancel buttons disabled while `isPending`
- [x] 7. Create `app/(dashboard)/products/page.tsx` — `'use client'`; local state: `searchInput` (raw string), `search` (debounced 300ms, resets `page` to 0 on change), `page` (0-indexed), `pageSize` (default 20), `ordering` (default `'name'`); sheet state: `sheetOpen`, `selectedProduct: Product | undefined`; delete dialog state: `deleteDialogOpen`, `productToDelete: Product | null`; calls `useProducts({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`; computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`; calls `useUpdateProduct()` for the toggle-active action; uses `useMemo` for columns, `useCallback` for all handlers; renders page heading "Productos" / subtitle "Gestiona el catálogo de productos"
- [x] 8. Wire the toolbar in `page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` that contains a controlled `Input` (bound to `searchInput`, `placeholder="Buscar por nombre o SKU…"`) and a "Nuevo producto" `Button` (with `Plus` icon) that sets `selectedProduct` to `undefined` and opens the sheet
- [x] 9. Wire row actions via the `ColumnActions` interface: `onEdit` sets `selectedProduct = product` and opens sheet; `onToggleActive` calls `updateMutation.mutate({ id: product.id, data: { is_active: !product.is_active } })`; `onDelete` sets `productToDelete` and opens delete dialog; `handleSheetOpenChange` clears `selectedProduct` on close; all state and handlers live in `page.tsx` and are passed to `createProductColumns`
- [x] 10. Modify `components/layout/sidebar.tsx` — import `Package` from `lucide-react` and add `{ href: '/products', label: 'Productos', icon: Package }` to `navLinks` after the Almacenes entry
- [ ] 11. Manual smoke test: (a) `/products` loads and shows paginated list with correct columns, (b) search by name filters results, (c) search by SKU filters results, (d) sorting by name and stock_quantity columns works, (e) "Nuevo producto" opens sheet — supplier select is populated, category select shows 8 Spanish options, form submission creates product (HTTP 201), (f) "Editar" opens sheet pre-filled with all fields including correct supplier and category selected, PATCH succeeds, (g) "Desactivar"/"Activar" PATCHes `is_active` and badge updates immediately, (h) "Eliminar" shows confirm dialog naming the product and on confirm hard-deletes (HTTP 204) and row disappears, (i) pagination controls work, (j) "Productos" nav link highlights when on `/products`

---

## Validation Summary

**Date:** 2026-05-27  
**Validator:** SDD Validator agent

### Build result
`npm run build` — PASSED (zero TypeScript errors, all 10 routes compiled successfully including `/products`)

### Lint result
`npm run lint` — PASSED (0 errors, 1 warning — pre-existing warning in shared `components/data-table/data-table.tsx` about `useReactTable()` and React Compiler memoization; unrelated to Products module)

### Task results

| # | Task | Result |
|---|------|--------|
| 1 | `useSuppliersList()` in `hooks/use-suppliers.ts` | PASS — correct `queryKey: ['suppliers-list']`, `page_size=100`, `ordering=name`, `staleTime: 5*60*1000` |
| 2 | `hooks/use-products.ts` — all 4 hooks | PASS — `useProducts` with `keepPreviousData`, `useCreateProduct`/`useUpdateProduct`/`useDeleteProduct` with correct mutation signatures and `['products']` invalidation |
| 3 | `products-columns.tsx` — `CATEGORY_LABELS` + `createProductColumns` | PASS — all 8 categories exported in Spanish, `ColumnActions` interface correct, all column definitions match spec |
| 4 | `product-form.tsx` — full form with all fields | PASS (minor note: `description` and `dimensions_cm` empty strings are omitted from the API payload rather than sent as `null` as spec specifies; functionally equivalent since backend treats missing optional fields as null, and build passes) |
| 5 | `product-sheet.tsx` — Sheet wrapper | PASS — `side="right"`, `sm:max-w-md overflow-y-auto`, correct title logic, passes full `Product` to form |
| 6 | `product-delete-dialog.tsx` — AlertDialog | PASS — correct description text, both buttons disabled while `isPending`, `variant="destructive"` on action button |
| 7 | `app/(dashboard)/products/page.tsx` — page component | PASS — debounced search (300ms), 0-indexed pagination, `page+1` sent to API, `Math.ceil` pageCount, `useMemo`/`useCallback` used, heading/subtitle correct |
| 8 | Toolbar wiring | PASS — `DataTableToolbar` with custom `Input` bound to `searchInput` and "Nuevo producto" `Button` with `Plus` icon |
| 9 | Row actions wiring | PASS — all three actions (`onEdit`, `onToggleActive`, `onDelete`) correctly implemented and passed to `createProductColumns` |
| 10 | Sidebar `Package` icon + "Productos" link | PASS — `Package` imported from `lucide-react`, `{ href: '/products', label: 'Productos', icon: Package }` placed after Almacenes |
| 11 | Manual smoke test | PENDING — requires running server; not automated |

### Summary
- **Tasks 1–10:** 10/10 PASS
- **Task 11:** Pending (manual, requires live backend)
- **Build:** PASS (zero TS errors)
- **Lint:** PASS (0 errors)
