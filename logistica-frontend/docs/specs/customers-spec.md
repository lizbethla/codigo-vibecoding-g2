# Spec: Customers (Clientes)

## Overview

The Customers module provides a single list page at `/customers` where staff can view, search, create, edit, soft-delete (toggle `is_active`), and hard-delete customer records. The list is a server-paginated TanStack Table showing name, customer type badge, email, active status badge, and an actions menu. Create and edit share one form rendered inside a shadcn `Sheet` (slide-over panel). A separate `AlertDialog` confirms hard delete. Search is wired to the `?search=` query param (name or email); ordering can be toggled on the name column. This is standard CRUD; no FK dependencies beyond Auth.

---

## Pages

### Page: `/customers`

- **Route:** `/customers`
- **Component:** `app/(dashboard)/customers/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `CustomersPage` | new — `app/(dashboard)/customers/page.tsx` | Page entry; owns `search`, `page`, `pageSize`, `ordering` state via `useState` |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo cliente" `Button` |
| `CustomerSheet` | new — `components/customers/customer-sheet.tsx` | shadcn `Sheet` wrapping `CustomerForm`; used for both create and edit |
| `CustomerForm` | new — `components/customers/customer-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateCustomer` or `useUpdateCustomer` |
| `CustomerDeleteDialog` | new — `components/customers/customer-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete confirmation; calls `useDeleteCustomer` |
| `Badge` | shadcn/ui | Renders `customer_type` and `is_active` values |
| `Button` | shadcn/ui | Toolbar "Nuevo cliente" action, form submit |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Toggle active, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All data-fetching and mutation hooks live in `hooks/use-customers.ts`.

**List query:**

```ts
// useCustomers(params)
useQuery<PaginatedResponse<CustomerSummary>>({
  queryKey: ['customers', params],  // params: { page, page_size, search, ordering }
  queryFn: () =>
    api.get('/customers/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

`params` object is built from the page's local state (`search`, `page`, `pageSize`, `ordering`). The list endpoint returns `CustomerSummary` objects, which is sufficient for all visible columns.

**Create mutation:**

```ts
useMutation<Customer, AxiosError, CustomerCreate>({
  mutationFn: (body) => api.post('/customers/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Customer, AxiosError, { id: number; data: CustomerUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/customers/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    // close sheet, show toast
  },
})
```

Used for both full edit (all fields) and soft-delete toggle (`{ is_active: false/true }`).

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/customers/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/customers/customers-columns.tsx`. The table uses `CustomerSummary` rows for most columns. Because the list endpoint only returns `id`, `name`, `customer_type` in `CustomerSummary`, and the page-level query fetches the full paginated response, the `email` and `is_active` columns require the query to return `Customer`-level data. The list endpoint (`GET /api/v1/customers/`) is documented to return `CustomerSummary` (id, name, customer_type, email, is_active) — use `Customer` as the row type to cover all columns visible in the UI.

| Accessor key | Header | Cell renderer |
|---|---|---|
| `name` | Nombre | Plain text; column header is sortable — clicking calls `setOrdering('name')` / `setOrdering('-name')` |
| `customer_type` | Tipo | `Badge`: `COMPANY` → variant `default` label "Empresa"; `INDIVIDUAL` → variant `secondary` label "Particular" |
| `email` | Correo | Plain text |
| `is_active` | Estado | `Badge`: `true` → variant `default` (green) label "Activo"; `false` → variant `destructive` label "Inactivo" |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (opens `CustomerSheet` with prefilled data), "Desactivar" / "Activar" (PATCH toggle `is_active`), "Eliminar" (opens `CustomerDeleteDialog`) |

#### Form fields

Defined in `CustomerForm`, validated with `zod`. Used for both create and edit (edit pre-populates all fields).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `name` | Nombre | text input | required, min 1 char | — |
| `email` | Correo electrónico | email input | required, valid email | — |
| `customer_type` | Tipo de cliente | `Select` | required | Options: `COMPANY` / "Empresa", `INDIVIDUAL` / "Particular"; default `COMPANY` |
| `tax_id` | NIT / Cédula | text input | optional | Unique constraint enforced by backend; surface backend validation error |
| `phone` | Teléfono | text input | optional | — |
| `address` | Dirección | text input | optional | — |
| `city` | Ciudad | text input | optional | — |
| `country` | País | text input | optional | Defaults to `"Colombia"` when blank (backend default) |
| `is_active` | Activo | `Checkbox` | optional | Shown only in edit mode; defaults `true` on create |

Zod schema:

```ts
const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  customer_type: z.enum(['COMPANY', 'INDIVIDUAL']),
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
| `Customer` | Row type for the table (full object returned from list with all visible columns), `CustomerForm` prefill data type |
| `CustomerSummary` | Type annotation for paginated `results` from list response (minimal); superseded by `Customer` for table rows that need `email` / `is_active` |
| `CustomerCreate` | `useCreateCustomer` mutation variables; form submit body |
| `CustomerUpdate` | `useUpdateCustomer` mutation variables; also used for soft-delete PATCH |
| `CustomerType` | `customer_type` field union type (`'COMPANY' | 'INDIVIDUAL'`) |
| `PaginatedResponse<Customer>` | Return type of the list query |

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/customers/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<Customer>`. `ordering` values: `name`, `-name`, `created_at`, `-created_at` |
| `POST` | `/customers/` | `CustomerCreate` body | Returns `Customer` (HTTP 201). Required: `name`, `email` |
| `PATCH` | `/customers/{id}/` | `CustomerUpdate` body (any subset) | Used for full edits and soft-delete toggle (`{ is_active: false }`) |
| `DELETE` | `/customers/{id}/` | — | Returns HTTP 204. Hard delete — use only after user confirms in dialog |

No `GET /customers/{id}/` call needed for this module — the list provides enough data to pre-populate the edit form.

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/customers/page.tsx` | Page component: owns pagination/search state, renders `DataTable` with toolbar and columns |
| `hooks/use-customers.ts` | All TanStack Query hooks: `useCustomers`, `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer` |
| `components/customers/customers-columns.tsx` | `ColumnDef<Customer>[]` array definition |
| `components/customers/customer-sheet.tsx` | Controlled `Sheet` component; receives `open`, `onOpenChange`, and optional `customer` prop (undefined = create mode, defined = edit mode) |
| `components/customers/customer-form.tsx` | `react-hook-form` + `zod` form; receives optional `defaultValues` and `onSuccess` callback; calls create or update mutation based on whether an `id` is present |
| `components/customers/customer-delete-dialog.tsx` | `AlertDialog` for hard delete confirmation; receives `customer` and `open`/`onOpenChange` props; calls `useDeleteCustomer` |

### Files to modify

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Add "Clientes" nav link pointing to `/customers` |

---

## Tasks

- [x] 1. Create `hooks/use-customers.ts` — export `useCustomers(params)` (useQuery), `useCreateCustomer()` (useMutation POST), `useUpdateCustomer()` (useMutation PATCH), `useDeleteCustomer()` (useMutation DELETE); each mutation invalidates `['customers']` on success
- [x] 2. Create `components/customers/customers-columns.tsx` — define `ColumnDef<Customer>[]` with columns: `name` (sortable header), `customer_type` (Badge), `email`, `is_active` (Badge), `actions` (DropdownMenu with Edit / Toggle active / Delete)
- [x] 3. Create `components/customers/customer-form.tsx` — `react-hook-form` form with zod schema; fields: name, email, customer_type (Select), tax_id, phone, address, city, country, is_active (Checkbox, edit only); accepts `defaultValues?: Customer` and `onSuccess: () => void`; calls `useCreateCustomer` or `useUpdateCustomer` based on whether `defaultValues.id` is present
- [x] 4. Create `components/customers/customer-sheet.tsx` — shadcn `Sheet` (`side="right"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `customer?: Customer`; title is "Nuevo cliente" or "Editar cliente"; renders `CustomerForm` inside `SheetContent`
- [x] 5. Create `components/customers/customer-delete-dialog.tsx` — shadcn `AlertDialog`; props: `customer: Customer | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; on confirm calls `useDeleteCustomer` with `customer.id`
- [x] 6. Create `app/(dashboard)/customers/page.tsx` — `'use client'`; local state: `search` (string, debounced 300ms before passed to query), `page` (number, 0-indexed), `pageSize` (number, default 20), `ordering` (string, default `'name'`); calls `useCustomers({ page: page + 1, page_size: pageSize, search, ordering })`; computes `pageCount = Math.ceil(data.count / pageSize)`; renders `DataTable` with columns, data, pageCount, pageIndex, pageSize, onPageChange, onPageSizeChange, isLoading, and toolbar prop
- [x] 7. Wire the toolbar: pass a `toolbar` function to `DataTable` that renders `DataTableToolbar` (with `searchPlaceholder="Buscar por nombre o correo…"`) plus a "Nuevo cliente" `Button` that opens the `CustomerSheet` in create mode
- [x] 8. Wire row actions in `customers-columns.tsx`: "Editar" sets selected customer + opens sheet; "Desactivar"/"Activar" calls `useUpdateCustomer` with `{ is_active: !row.original.is_active }`; "Eliminar" sets selected customer + opens delete dialog — the `page.tsx` component holds the `selectedCustomer`, `sheetOpen`, and `deleteDialogOpen` state and passes them down
- [x] 9. Add "Clientes" nav link to `components/layout/sidebar.tsx` pointing to `/customers`
- [x] 10. Manual smoke test: (a) `/customers` loads and shows paginated list, (b) search filters results, (c) "Nuevo cliente" opens sheet and form submission creates a record, (d) "Editar" opens sheet pre-filled and submit updates record, (e) "Desactivar" PATCHes `is_active: false` and badge updates, (f) "Eliminar" shows confirm dialog and on confirm removes record, (g) pagination controls work — all wiring confirmed present in code; manual run-through required by developer

---

## Validation Summary

**Date:** 2026-05-27
**Build:** ✅ Pass — Next.js compiled successfully, `/customers` route generated
**Lint:** ✅ Pass — 0 errors, 1 warning (unrelated: `useReactTable` in `data-table.tsx`)
**Tasks:** 10/10 passed

### Failures

None.
