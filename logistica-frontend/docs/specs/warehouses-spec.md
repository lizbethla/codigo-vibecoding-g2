# Spec: Warehouses (Almacenes)

## Overview

The Warehouses module provides a single list page at `/warehouses` where staff can view, search, create, edit, soft-delete (toggle `is_active`), and hard-delete warehouse records. The list is a server-paginated TanStack Table showing code, name, city, country, capacity_m3, and active status badge, plus a per-row actions menu. Create and edit share one form rendered inside a shadcn `Sheet`. A separate `AlertDialog` confirms hard delete. Search is wired to the `?search=` query param (name or code); ordering can be toggled on the name or code columns.

**Key structural difference from Suppliers:** the list endpoint (`GET /warehouses/`) returns `PaginatedResponse<WarehouseSummary>`, which only contains `{ id, code, name, city }` — not the full object. Editing therefore requires a separate `GET /warehouses/{id}/` fetch to populate the form with all fields (address, country, latitude, longitude, capacity_m3, is_active, manager). The `useWarehouse(id)` hook handles this detail fetch; it fires only when a warehouse is selected for editing.

---

## Pages

### Page: `/warehouses`

- **Route:** `/warehouses`
- **Component:** `app/(dashboard)/warehouses/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `WarehousesPage` | new — `app/(dashboard)/warehouses/page.tsx` | Page entry; owns `search`, `page`, `pageSize`, `ordering` state via `useState` |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo almacén" `Button` |
| `WarehouseSheet` | new — `components/warehouses/warehouse-sheet.tsx` | shadcn `Sheet` wrapping `WarehouseForm`; used for both create and edit |
| `WarehouseForm` | new — `components/warehouses/warehouse-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateWarehouse` or `useUpdateWarehouse` |
| `WarehouseDeleteDialog` | new — `components/warehouses/warehouse-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete confirmation; calls `useDeleteWarehouse` |
| `Badge` | shadcn/ui | Renders `is_active` value |
| `Button` | shadcn/ui | Toolbar "Nuevo almacén" action, form submit |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Toggle active, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All data-fetching and mutation hooks live in `hooks/use-warehouses.ts`.

**List query:**

```ts
// useWarehouses(params)
useQuery<PaginatedResponse<WarehouseSummary>, AxiosError>({
  queryKey: ['warehouses', params],  // params: { page, page_size, search, ordering }
  queryFn: () =>
    api.get('/warehouses/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

`params` is built from the page's local state (`search`, `page`, `pageSize`, `ordering`). The list response returns `WarehouseSummary` objects — sufficient for all table columns.

**Detail query (for edit form pre-population):**

```ts
// useWarehouse(id)
useQuery<Warehouse, AxiosError>({
  queryKey: ['warehouse', id],
  queryFn: () => api.get(`/warehouses/${id}/`).then((r) => r.data),
  enabled: !!id,  // only fetches when an id is provided
})
```

Called inside `WarehouseSheet` when `warehouseId` is set (edit mode). The sheet shows a loading state (disabled form or spinner) while this fetch is in flight.

**Create mutation:**

```ts
useMutation<Warehouse, AxiosError, WarehouseCreate>({
  mutationFn: (body) => api.post('/warehouses/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Warehouse, AxiosError, { id: number; data: WarehouseUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/warehouses/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
    // close sheet, show toast
  },
})
```

Used for both full edit (all fields) and soft-delete toggle (`{ is_active: false/true }`). The toggle can be called directly from the page with just the summary id — no detail fetch required for toggle-only.

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/warehouses/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/warehouses/warehouses-columns.tsx`. Row type is `WarehouseSummary` (from the list response).

| Accessor key | Header | Cell renderer |
|---|---|---|
| `code` | Código | `<span className="font-mono text-sm">{row.original.code}</span>`; column header is sortable — clicking calls `setOrdering('code')` / `setOrdering('-code')` using `ArrowUpDown` icon button |
| `name` | Nombre | Plain text with `font-medium`; column header is sortable — clicking calls `setOrdering('name')` / `setOrdering('-name')` using `ArrowUpDown` icon button |
| `city` | Ciudad | Plain text |
| `country` | País | Plain text — note: `WarehouseSummary` does not include `country`; **omit this column** since it is not in the summary type. See note below. |
| `is_active` | Estado | Not available in `WarehouseSummary` — **omit this column**. See note below. |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (sets `selectedWarehouseId` and opens `WarehouseSheet`), "Desactivar" / "Activar" (not available without full object — use a simple "Editar" to change status via the form), "Eliminar" (opens `WarehouseDeleteDialog`) |

> **Note on WarehouseSummary columns:** `WarehouseSummary` only exposes `{ id, code, name, city }`. Fields `country`, `is_active`, and `capacity_m3` are NOT present in the summary. The table columns must be limited to what `WarehouseSummary` actually provides: `code`, `name`, `city`, and the `actions` menu. The `is_active` toggle action available in Suppliers is **not available** directly from the list row — users toggle active state through the Edit sheet instead. This is the main structural difference from the Suppliers module.

#### Form fields

Defined in `WarehouseForm`, validated with `zod`. Used for both create and edit. In edit mode the form is pre-populated from the `Warehouse` detail response (fetched via `useWarehouse(id)`).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `name` | Nombre | text input | required, min 1 char | — |
| `code` | Código | text input | required, min 1 char, max 20 chars | Short unique identifier, e.g. `"BOG-01"`; surface backend uniqueness error on field |
| `address` | Dirección | text input | required, min 1 char | Required by backend |
| `city` | Ciudad | text input | required, min 1 char | Required by backend |
| `country` | País | text input | optional | Defaults to `"Colombia"` when blank (backend default) |
| `capacity_m3` | Capacidad (m³) | text input | optional, numeric string | Decimal string; blank → `null`; validate with `z.string().regex(/^\d+(\.\d+)?$/).optional().nullable()` |
| `latitude` | Latitud | text input | optional, numeric string | Decimal string; blank → `null`; validate with `z.string().regex(/^-?\d+(\.\d+)?$/).optional().nullable()` |
| `longitude` | Longitud | text input | optional, numeric string | Decimal string; blank → `null`; same regex as latitude |
| `is_active` | Activo | `Checkbox` | optional | Shown only in edit mode; defaults `true` on create |

No `manager` field in the form — `manager` is a FK to Django User that requires a user-search dropdown (out of scope for this MVP). The field is optional on the backend and is skipped entirely.

Zod schema:

```ts
const warehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  country: z.string().optional(),
  capacity_m3: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .nullable(),
  latitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Latitud inválida')
    .optional()
    .nullable(),
  longitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Longitud inválida')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});
```

#### Zustand usage

No Zustand state is needed beyond what Auth already provides. The Axios interceptor in `lib/api.ts` reads the token from localStorage automatically.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Warehouse` | Full detail type; used as `WarehouseForm` prefill data type, returned by create/update mutations |
| `WarehouseSummary` | Row type for the table (list response); also used in `WarehouseDeleteDialog` (has `id`, `name`) |
| `WarehouseCreate` | `useCreateWarehouse` mutation variables; form submit body |
| `WarehouseUpdate` | `useUpdateWarehouse` mutation variables |
| `WarehouseManager` | Nested type on `Warehouse.manager`; referenced only by type — not rendered in form |
| `PaginatedResponse<WarehouseSummary>` | Return type of the list query |

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/warehouses/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<WarehouseSummary>`. `ordering` values: `name`, `-name`, `code`, `-code`, `city`, `-city`, `created_at`, `-created_at` |
| `GET` | `/warehouses/{id}/` | — | Returns full `Warehouse` object. Called only when opening the edit sheet. |
| `POST` | `/warehouses/` | `WarehouseCreate` body | Returns `Warehouse` (HTTP 201). Required: `name`, `code`, `address`, `city` |
| `PATCH` | `/warehouses/{id}/` | `WarehouseUpdate` body (any subset) | Used for full edits. No direct toggle from list row (no `is_active` in summary) |
| `DELETE` | `/warehouses/{id}/` | — | Returns HTTP 204. Hard delete — use only after user confirms in dialog |

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/warehouses/page.tsx` | Page component: owns pagination/search/ordering state, renders `DataTable` with toolbar and columns |
| `hooks/use-warehouses.ts` | All TanStack Query hooks: `useWarehouses`, `useWarehouse`, `useCreateWarehouse`, `useUpdateWarehouse`, `useDeleteWarehouse` |
| `components/warehouses/warehouses-columns.tsx` | `ColumnDef<WarehouseSummary>[]` array definition via `createWarehouseColumns(actions)` factory |
| `components/warehouses/warehouse-sheet.tsx` | Controlled `Sheet` component; props: `open`, `onOpenChange`, optional `warehouseId?: number` (undefined = create mode, number = edit mode); internally calls `useWarehouse(warehouseId)` to load full data before rendering the form |
| `components/warehouses/warehouse-form.tsx` | `react-hook-form` + `zod` form; accepts optional `defaultValues?: Warehouse` and `onSuccess: () => void`; calls create or update mutation based on presence of `defaultValues?.id` |
| `components/warehouses/warehouse-delete-dialog.tsx` | `AlertDialog` for hard delete confirmation; props: `warehouse: WarehouseSummary | null`, `open`, `onOpenChange`; calls `useDeleteWarehouse` on confirm |

### Files to modify

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Add "Almacenes" nav link pointing to `/warehouses` with `Warehouse` icon from Lucide (e.g. `Warehouse`) after the Proveedores entry |

---

## Tasks

- [x] 1. Create `hooks/use-warehouses.ts` — export `useWarehouses(params)` (useQuery, `keepPreviousData`, returns `PaginatedResponse<WarehouseSummary>`), `useWarehouse(id?: number)` (useQuery, `enabled: !!id`, returns full `Warehouse`), `useCreateWarehouse(onSuccess?)` (useMutation POST), `useUpdateWarehouse(onSuccess?)` (useMutation PATCH, invalidates both `['warehouses']` and `['warehouse', id]`), `useDeleteWarehouse(onSuccess?)` (useMutation DELETE); each mutation invalidates `['warehouses']` on success
- [x] 2. Create `components/warehouses/warehouses-columns.tsx` — export `createWarehouseColumns(actions: ColumnActions): ColumnDef<WarehouseSummary>[]` with columns: `code` (sortable header with `ArrowUpDown`, monospace `font-mono text-sm`), `name` (sortable header with `ArrowUpDown`, `font-medium`), `city` (plain text), `actions` (DropdownMenu with "Editar" and "Eliminar" — no toggle-active since `is_active` is absent from `WarehouseSummary`); `ColumnActions` interface: `{ onEdit: (w: WarehouseSummary) => void; onDelete: (w: WarehouseSummary) => void; setOrdering: (o: string) => void; ordering: string }`
- [x] 3. Create `components/warehouses/warehouse-form.tsx` — `react-hook-form` form with the zod schema above; fields: name, code, address, city, country, capacity_m3, latitude, longitude, is_active (Checkbox, edit-only); accepts `defaultValues?: Warehouse` and `onSuccess: () => void`; on submit: clean empty strings to `null` for optional nullable fields, default country to `"Colombia"` when blank; call `useCreateWarehouse` or `useUpdateWarehouse` based on `defaultValues?.id`; surface backend `code` uniqueness error via `form.setError('code', ...)`
- [x] 4. Create `components/warehouses/warehouse-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `warehouseId?: number`; internally calls `useWarehouse(warehouseId)` — show a disabled spinner/skeleton inside the sheet while `isLoading` is true; once data is ready render `WarehouseForm` with `defaultValues={warehouseData}`; title is "Nuevo almacén" when `warehouseId` is undefined, "Editar almacén" otherwise; on form `onSuccess` call `onOpenChange(false)`
- [x] 5. Create `components/warehouses/warehouse-delete-dialog.tsx` — shadcn `AlertDialog`; props: `warehouse: WarehouseSummary | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description names the warehouse being deleted by `warehouse.name`; on confirm calls `useDeleteWarehouse(() => onOpenChange(false))` with `warehouse.id`; disables both buttons while `isPending`
- [x] 6. Create `app/(dashboard)/warehouses/page.tsx` — `'use client'`; local state: `searchInput` (raw string), `search` (debounced 300ms, resets `page` to 0 on change), `page` (0-indexed), `pageSize` (default 20), `ordering` (default `'name'`); sheet state: `sheetOpen`, `selectedWarehouseId?: number`; delete dialog state: `deleteDialogOpen`, `warehouseToDelete: WarehouseSummary | null`; calls `useWarehouses({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`; computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`; renders `DataTable` with all props; uses `useMemo` for columns; uses `useCallback` for all handlers
- [x] 7. Wire the toolbar in `page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` that contains a controlled `Input` (bound to `searchInput`) with `placeholder="Buscar por código o nombre…"` and a "Nuevo almacén" `Button` (with `Plus` icon) that sets `selectedWarehouseId` to `undefined` and opens the sheet
- [x] 8. Wire row actions in `warehouses-columns.tsx` via the `ColumnActions` interface: `onEdit` sets `selectedWarehouseId = warehouse.id` and opens sheet; `onDelete` sets `warehouseToDelete` and opens delete dialog; `handleSheetOpenChange` clears `selectedWarehouseId` on close (set to `undefined`); `page.tsx` holds all state and passes handlers to `createWarehouseColumns`
- [x] 9. Modify `components/layout/sidebar.tsx` — import `Warehouse` icon from `lucide-react` and add `{ href: '/warehouses', label: 'Almacenes', icon: Warehouse }` to the `navLinks` array, placed after the Proveedores entry
- [x] 10. Manual smoke test: (a) `/warehouses` loads and shows paginated list, (b) search filters by code or name, (c) sorting by code and name columns works, (d) "Nuevo almacén" opens sheet and form submission creates a record (HTTP 201), (e) "Editar" opens sheet showing a loading state then the full pre-filled form and PATCH succeeds, (f) "Eliminar" shows confirm dialog and hard-deletes (HTTP 204) and row disappears, (g) pagination controls work correctly, (h) "Almacenes" nav link highlights when on `/warehouses`

## Validation Summary

**Date:** 2026-05-27
**Build:** ✅ Pass
**Lint:** ✅ Pass — 1 pre-existing warning in `data-table.tsx` (unrelated to Warehouses: `useReactTable` incompatible-library warning), 0 errors
**Tasks:** 10/10 passed

### Failures

None.
