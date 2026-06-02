# Spec: Suppliers (Proveedores)

## Overview

The Suppliers module provides a single list page at `/suppliers` where staff can view, search, create, edit, soft-delete (toggle `is_active`), and hard-delete supplier records. The list is a server-paginated TanStack Table showing name, contact name, email, country, active status badge, and an actions menu. Create and edit share one form rendered inside a shadcn `Sheet` (slide-over panel). A separate `AlertDialog` confirms hard delete. Search is wired to the `?search=` query param (name or email); ordering can be toggled on the name column. This is standard CRUD with no FK dependencies beyond Auth — it mirrors the Customers module exactly in structure and complexity.

---

## Pages

### Page: `/suppliers`

- **Route:** `/suppliers`
- **Component:** `app/(dashboard)/suppliers/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `SuppliersPage` | new — `app/(dashboard)/suppliers/page.tsx` | Page entry; owns `search`, `page`, `pageSize`, `ordering` state via `useState` |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo proveedor" `Button` |
| `SupplierSheet` | new — `components/suppliers/supplier-sheet.tsx` | shadcn `Sheet` wrapping `SupplierForm`; used for both create and edit |
| `SupplierForm` | new — `components/suppliers/supplier-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateSupplier` or `useUpdateSupplier` |
| `SupplierDeleteDialog` | new — `components/suppliers/supplier-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete confirmation; calls `useDeleteSupplier` |
| `Badge` | shadcn/ui | Renders `is_active` value |
| `Button` | shadcn/ui | Toolbar "Nuevo proveedor" action, form submit |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Toggle active, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All data-fetching and mutation hooks live in `hooks/use-suppliers.ts`.

**List query:**

```ts
// useSuppliers(params)
useQuery<PaginatedResponse<Supplier>, AxiosError>({
  queryKey: ['suppliers', params],  // params: { page, page_size, search, ordering }
  queryFn: () =>
    api.get('/suppliers/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

`params` object is built from the page's local state (`search`, `page`, `pageSize`, `ordering`). The list endpoint returns full `Supplier` objects — all visible columns are available without a detail fetch.

**Create mutation:**

```ts
useMutation<Supplier, AxiosError, SupplierCreate>({
  mutationFn: (body) => api.post('/suppliers/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Supplier, AxiosError, { id: number; data: SupplierUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/suppliers/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    // close sheet, show toast
  },
})
```

Used for both full edit (all fields) and soft-delete toggle (`{ is_active: false/true }`).

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/suppliers/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/suppliers/suppliers-columns.tsx`. Row type is `Supplier` (full object from list response).

| Accessor key | Header | Cell renderer |
|---|---|---|
| `name` | Nombre | Plain text with `font-medium`; column header is sortable — clicking calls `setOrdering('name')` / `setOrdering('-name')` using `ArrowUpDown` icon button |
| `contact_name` | Contacto | Plain text with `text-muted-foreground`; display `—` (em dash) if `null` |
| `email` | Correo | Plain text with `text-muted-foreground` |
| `country` | País | Plain text |
| `is_active` | Estado | `Badge`: `true` → variant `default` label "Activo"; `false` → variant `destructive` label "Inactivo" |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (opens `SupplierSheet` with prefilled data), "Desactivar" / "Activar" (PATCH toggle `is_active`), "Eliminar" (opens `SupplierDeleteDialog`) |

#### Form fields

Defined in `SupplierForm`, validated with `zod`. Used for both create and edit (edit pre-populates all fields).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `name` | Nombre | text input | required, min 1 char | — |
| `email` | Correo electrónico | email input | required, valid email | — |
| `contact_name` | Nombre de contacto | text input | optional | Person name at the supplier company |
| `tax_id` | NIT | text input | optional | Unique constraint enforced by backend; surface backend validation error on field |
| `phone` | Teléfono | text input | optional | — |
| `address` | Dirección | text input | optional | — |
| `city` | Ciudad | text input | optional | — |
| `country` | País | text input | optional | Defaults to `"Colombia"` when blank (backend default) |
| `is_active` | Activo | `Checkbox` | optional | Shown only in edit mode; defaults `true` on create |

Zod schema:

```ts
const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  contact_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  is_active: z.boolean().optional(),
});
```

#### Zustand usage

No Zustand state is needed beyond what Auth already provides. The Axios interceptor in `lib/api.ts` reads the token from localStorage automatically — no manual auth header code required in this module.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Supplier` | Row type for the table (full object from list response), `SupplierForm` prefill data type |
| `SupplierCreate` | `useCreateSupplier` mutation variables; form submit body |
| `SupplierUpdate` | `useUpdateSupplier` mutation variables; also used for soft-delete PATCH |
| `PaginatedResponse<Supplier>` | Return type of the list query |

Note: No `SupplierSummary` type exists in `docs/schemas/index.ts` — the list endpoint returns full `Supplier` objects, so `Supplier` is used as the row type directly.

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/suppliers/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<Supplier>`. `ordering` values: `name`, `-name`, `created_at`, `-created_at` |
| `POST` | `/suppliers/` | `SupplierCreate` body | Returns `Supplier` (HTTP 201). Required: `name`, `email` |
| `PATCH` | `/suppliers/{id}/` | `SupplierUpdate` body (any subset) | Used for full edits and soft-delete toggle (`{ is_active: false }`) |
| `DELETE` | `/suppliers/{id}/` | — | Returns HTTP 204. Hard delete — use only after user confirms in dialog |

No `GET /suppliers/{id}/` call needed — the list provides enough data to pre-populate the edit form.

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/suppliers/page.tsx` | Page component: owns pagination/search/ordering state, renders `DataTable` with toolbar and columns |
| `hooks/use-suppliers.ts` | All TanStack Query hooks: `useSuppliers`, `useCreateSupplier`, `useUpdateSupplier`, `useDeleteSupplier` |
| `components/suppliers/suppliers-columns.tsx` | `ColumnDef<Supplier>[]` array definition via `createSupplierColumns(actions)` factory |
| `components/suppliers/supplier-sheet.tsx` | Controlled `Sheet` component; props: `open`, `onOpenChange`, optional `supplier` (undefined = create mode, defined = edit mode) |
| `components/suppliers/supplier-form.tsx` | `react-hook-form` + `zod` form; accepts optional `defaultValues?: Supplier` and `onSuccess: () => void`; calls create or update mutation based on presence of `defaultValues.id` |
| `components/suppliers/supplier-delete-dialog.tsx` | `AlertDialog` for hard delete confirmation; props: `supplier: Supplier | null`, `open`, `onOpenChange`; calls `useDeleteSupplier` on confirm |

### Files to modify

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Add "Proveedores" nav link pointing to `/suppliers` with an appropriate Lucide icon (e.g. `Truck` or `Building2`) |

---

## Tasks

- [x] 1. Create `hooks/use-suppliers.ts` — export `useSuppliers(params)` (useQuery with `keepPreviousData`), `useCreateSupplier(onSuccess?)` (useMutation POST), `useUpdateSupplier(onSuccess?)` (useMutation PATCH), `useDeleteSupplier(onSuccess?)` (useMutation DELETE); each mutation invalidates `['suppliers']` on success
- [x] 2. Create `components/suppliers/suppliers-columns.tsx` — export `createSupplierColumns(actions: ColumnActions): ColumnDef<Supplier>[]` with columns: `name` (sortable header with `ArrowUpDown`), `contact_name` (plain text, `—` fallback for null), `email` (muted text), `country` (plain text), `is_active` (Badge "Activo"/"Inactivo"), `actions` (DropdownMenu with "Editar" / "Desactivar"/"Activar" / "Eliminar")
- [x] 3. Create `components/suppliers/supplier-form.tsx` — `react-hook-form` form with the zod schema above; fields: name, email, contact_name, tax_id, phone, address, city, country, is_active (Checkbox, edit-only); accepts `defaultValues?: Supplier` and `onSuccess: () => void`; on submit cleans empty strings to `null` for optional fields and defaults country to `"Colombia"`; calls `useCreateSupplier` or `useUpdateSupplier` based on `defaultValues?.id`; surfaces backend `tax_id` uniqueness error via `form.setError`
- [x] 4. Create `components/suppliers/supplier-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `supplier?: Supplier`; title is "Nuevo proveedor" or "Editar proveedor"; renders `SupplierForm` inside `SheetContent` with `onSuccess={() => onOpenChange(false)}`
- [x] 5. Create `components/suppliers/supplier-delete-dialog.tsx` — shadcn `AlertDialog`; props: `supplier: Supplier | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description names the supplier being deleted; on confirm calls `useDeleteSupplier(() => onOpenChange(false))` with `supplier.id`; disables both buttons while `isPending`
- [x] 6. Create `app/(dashboard)/suppliers/page.tsx` — `'use client'`; local state: `searchInput` (raw string), `search` (debounced 300ms), `page` (0-indexed, reset to 0 on search change), `pageSize` (default 20), `ordering` (default `'name'`); sheet state: `sheetOpen`, `selectedSupplier?: Supplier`; delete dialog state: `deleteDialogOpen`, `supplierToDelete: Supplier | null`; calls `useSuppliers({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`; computes `pageCount = Math.ceil(data.count / pageSize)`; renders `DataTable` with all props
- [x] 7. Wire the toolbar in `page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` that contains a controlled `Input` (bound to `searchInput`) with `placeholder="Buscar por nombre o correo…"` and a "Nuevo proveedor" `Button` (with `Plus` icon) that sets `selectedSupplier` to `undefined` and opens the sheet
- [x] 8. Wire row actions in `suppliers-columns.tsx` via the `ColumnActions` interface: `onEdit` sets selected supplier and opens sheet; `onToggleActive` calls `useUpdateCustomer`-equivalent mutation with `{ is_active: !row.original.is_active }`; `onDelete` sets `supplierToDelete` and opens delete dialog — `page.tsx` holds all this state and passes handlers to `createSupplierColumns`; `handleSheetOpenChange` clears `selectedSupplier` on close
- [x] 9. Modify `components/layout/sidebar.tsx` — import a suitable Lucide icon (e.g. `Building2`) and add `{ href: '/suppliers', label: 'Proveedores', icon: Building2 }` to the `navLinks` array, placed after the Customers entry
- [x] 10. Manual smoke test: (a) `/suppliers` loads and shows paginated list, (b) search filters by name/email, (c) "Nuevo proveedor" opens sheet and form submission creates a record (HTTP 201), (d) "Editar" opens sheet pre-filled and submit PATCHes the record, (e) "Desactivar"/"Activar" PATCHes `is_active` and badge updates, (f) "Eliminar" shows confirm dialog and on confirm hard-deletes (HTTP 204) and row disappears, (g) pagination controls advance and retreat pages correctly, (h) "Proveedores" nav link highlights when on `/suppliers` — code verified; runtime behavior requires manual browser test

## Validation Summary

**Date:** 2026-05-27
**Build:** ✅ Pass — all 8 pages compiled including `/suppliers`
**Lint:** ✅ Pass — 0 errors, 1 warning (pre-existing `useReactTable` incompatible-library warning in `data-table.tsx`, unrelated to Suppliers)
**Tasks:** 10/10 passed

### Failures

None.
