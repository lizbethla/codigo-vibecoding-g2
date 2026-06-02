# Spec: Drivers (Conductores)

## Overview

The Drivers module provides a single list page at `/drivers` where staff can view, search, create, edit, and delete driver records. The list is a server-paginated TanStack Table showing driver full name (derived from the nested `user` object), national ID, license type badge, license expiry date with a warning indicator when the expiry is within 30 days, status badge (color-coded), and a per-row actions menu. Create and edit share one form rendered inside a shadcn `Sheet`. A separate `AlertDialog` confirms hard delete.

**Key structural notes:**
- The list endpoint (`GET /api/v1/drivers/`) returns objects that include a nested `user: { id, username, first_name, last_name, email }` field. The "Name" column is constructed as `${user.first_name} ${user.last_name}` (falling back to `user.username` if both name parts are empty).
- The list response shape matches `DriverSummary` (id, national_id, license_type, status, user object) — it does NOT include all `Driver` fields such as `phone`, `license_expiry`, or `date_of_birth`. Therefore, the edit form requires a **separate detail fetch** (`GET /api/v1/drivers/{id}/`) to pre-populate all fields.
- `license_expiry` is a `YYYY-MM-DD` date string. The expiry warning logic compares it to today's date: if `differenceInDays(parseISO(license_expiry), new Date()) <= 30`, show a warning badge or highlight in the table cell.
- `user` is a required FK (Django User id integer). The form must include a **Users select** dropdown to pick an existing Django User. Because there is no dedicated `/users/` list endpoint in the documented API, the implementation uses a static approach: the `user` field is a plain number input (`type="number"`) labeled "ID de usuario (Django User)". This avoids dependency on an undocumented endpoint while still satisfying the backend requirement.
- `status` and `license_type` are string enums with fixed option sets — both rendered as `Select` in the form.
- `date_of_birth` is optional (`YYYY-MM-DD` string).
- All dates in form fields use `type="date"` HTML inputs (no external date-picker library needed).
- No soft-delete: the module only supports hard DELETE with confirmation.

**Pages:** `/drivers`
**Complexity:** CRUD + status enum badges + license expiry highlighting + detail fetch for edit

---

## Pages

### Page: `/drivers`

- **Route:** `/drivers`
- **Component:** `app/(dashboard)/drivers/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `DriversPage` | new — `app/(dashboard)/drivers/page.tsx` | Page entry; owns `searchInput`, `search`, `page`, `pageSize`, `ordering`, sheet state, delete dialog state |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo conductor" `Button` |
| `DriverSheet` | new — `components/drivers/driver-sheet.tsx` | shadcn `Sheet` wrapping `DriverForm`; used for both create and edit; triggers a detail fetch when `driverId` is provided |
| `DriverForm` | new — `components/drivers/driver-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateDriver` or `useUpdateDriver`; receives `defaultValues?: Driver` |
| `DriverDeleteDialog` | new — `components/drivers/driver-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete; calls `useDeleteDriver` on confirm |
| `Badge` | shadcn/ui | Renders `status` and `license_type` values; expiry warning indicator |
| `Button` | shadcn/ui | Toolbar "Nuevo conductor" action, form submit |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | shadcn/ui | `status` select and `license_type` select inside `DriverForm` |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All driver data-fetching and mutation hooks live in `hooks/use-drivers.ts`.

**List query:**

```ts
// useDrivers(params)
useQuery<PaginatedResponse<DriverListItem>, AxiosError>({
  queryKey: ['drivers', params],  // params: { page, page_size, search, ordering }
  queryFn: () => api.get('/drivers/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

Where `DriverListItem` is the shape returned by the list endpoint:

```ts
interface DriverListItem {
  id: number;
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  license_type: LicenseType;
  status: DriverStatus;
  national_id: string;
  license_number?: string; // may be present depending on serializer
}
```

Because the list endpoint does NOT return `license_expiry`, `phone`, `date_of_birth`, or `license_number`, the expiry warning cannot be shown in the list table from the list response alone. The expiry column is **omitted from the list** (not available from the list endpoint) — the spec for this column is limited to what the list response actually provides. See the columns section for details.

**Detail query (for edit pre-population):**

```ts
// useDriver(id)
useQuery<Driver, AxiosError>({
  queryKey: ['drivers', id],
  queryFn: () => api.get(`/drivers/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

Used inside `DriverSheet` when `driverId` is provided (edit mode). The result is passed as `defaultValues` to `DriverForm` once the query resolves.

**Create mutation:**

```ts
useMutation<Driver, AxiosError, DriverCreate>({
  mutationFn: (body) => api.post('/drivers/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Driver, AxiosError, { id: number; data: DriverUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/drivers/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    // close sheet, show toast
  },
})
```

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/drivers/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/drivers/drivers-columns.tsx`. Row type is `DriverListItem` (shape returned by the list endpoint).

| Accessor key | Header | Cell renderer |
|---|---|---|
| `user` | Conductor | `<span className="font-medium">{row.original.user.first_name} {row.original.user.last_name || row.original.user.username}</span>` — full name derived from nested user; falls back to `username` if both name parts are empty or whitespace |
| `national_id` | Cédula | `<span className="font-mono text-sm">{row.original.national_id}</span>` |
| `license_type` | Tipo de licencia | `Badge` with variant `secondary` and the Spanish label from `LICENSE_TYPE_LABELS` (see label map below) |
| `status` | Estado | `Badge` with color variant from `STATUS_BADGE_VARIANTS` (see variant map below) and Spanish label from `STATUS_LABELS` |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (sets `selectedDriverId` and opens `DriverSheet`), "Eliminar" (opens `DriverDeleteDialog`) |

**License type label map:**

```ts
const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  A:   'Motocicletas',
  B:   'Vehículos livianos',
  C:   'Vehículos pesados',
  CE:  'Vehículos articulados pesados',
  BTP: 'Transporte público',
};
```

**Status label map:**

```ts
const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE:  'Disponible',
  ON_ROUTE:   'En ruta',
  OFF_DUTY:   'Fuera de servicio',
  SUSPENDED:  'Suspendido',
};
```

**Status badge variant map** (using shadcn Badge `variant` prop where possible; supplement with Tailwind `className` overrides where needed):

| Status | Tailwind className on Badge |
|---|---|
| `AVAILABLE` | `bg-green-100 text-green-800 border-green-200` |
| `ON_ROUTE` | `bg-blue-100 text-blue-800 border-blue-200` |
| `OFF_DUTY` | `bg-gray-100 text-gray-800 border-gray-200` |
| `SUSPENDED` | `bg-red-100 text-red-800 border-red-200` |

Render the status badge using `variant="outline"` plus the className above, since shadcn's built-in variants (`default`, `secondary`, `destructive`, `outline`) do not cover all four colors.

Export `LICENSE_TYPE_LABELS`, `STATUS_LABELS`, and `STATUS_BADGE_CLASSES` from `components/drivers/drivers-columns.tsx` so they can be reused in `DriverForm`.

**Note on license expiry column:** The list endpoint does not return `license_expiry`, so the expiry warning cannot be shown in the list table. The expiry warning is surfaced only inside the detail sheet (edit mode) — the form displays the `license_expiry` date and shows a `Badge variant="destructive"` warning labeled "Vence pronto" next to it when `differenceInDays(parseISO(values.license_expiry), new Date()) <= 30`.

#### Form fields

Defined in `DriverForm`, validated with `zod`. Used for both create (empty `defaultValues`) and edit (pre-populated from the detail fetch result).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `user` | ID de usuario | number input | required, positive integer | Django User id; `type="number"`, `min="1"`, `step="1"`; backend enforces one-to-one (one Driver per User); surface backend uniqueness error on field |
| `license_number` | Número de licencia | text input | required, min 1 char | Unique constraint enforced by backend; surface backend uniqueness error on field |
| `license_type` | Tipo de licencia | `Select` | required | 5 options with Spanish labels from `LICENSE_TYPE_LABELS` |
| `license_expiry` | Vencimiento de licencia | date input | required, valid date string | `type="date"`; if within 30 days of today, show inline `Badge variant="destructive"` labeled "Vence pronto" below the field |
| `phone` | Teléfono | text input | required, min 1 char | — |
| `national_id` | Cédula | text input | required, min 1 char | Unique constraint enforced by backend; surface backend uniqueness error on field |
| `status` | Estado | `Select` | optional, defaults to `AVAILABLE` | 4 options with Spanish labels from `STATUS_LABELS`; shown in create mode to allow pre-setting status |
| `date_of_birth` | Fecha de nacimiento | date input | optional | `type="date"`; blank → `undefined` (omit field) |

Zod schema:

```ts
const driverSchema = z.object({
  user: z
    .number({ invalid_type_error: 'Debe ser un número entero' })
    .int()
    .positive('Debe ser un ID de usuario válido'),
  license_number: z.string().min(1, 'El número de licencia es requerido'),
  license_type: z.enum(['A', 'B', 'C', 'CE', 'BTP']),
  license_expiry: z.string().min(1, 'La fecha de vencimiento es requerida'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  national_id: z.string().min(1, 'La cédula es requerida'),
  status: z.enum(['AVAILABLE', 'ON_ROUTE', 'OFF_DUTY', 'SUSPENDED']).optional(),
  date_of_birth: z.string().optional(),
});
```

On submit, clean the values before sending to the API:
- `status`: if undefined, omit (backend defaults to `AVAILABLE`)
- `date_of_birth`: if empty string or undefined, omit the field

Surface backend field errors in the `onError` handler of the mutation:
- `{ user: [...] }` → `form.setError('user', { message: ... })`
- `{ license_number: [...] }` → `form.setError('license_number', { message: ... })`
- `{ national_id: [...] }` → `form.setError('national_id', { message: ... })`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides. The Axios interceptor in `lib/api.ts` reads the token from localStorage automatically.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Driver` | Full object returned by detail fetch (`GET /drivers/{id}/`); `DriverForm` prefill data type; returned by create/update mutations |
| `DriverCreate` | `useCreateDriver` mutation variables; form submit body |
| `DriverUpdate` | `useUpdateDriver` mutation variables |
| `DriverStatus` | `status` field union type; used in columns badge and form select |
| `LicenseType` | `license_type` field union type; used in columns badge and form select |
| `DriverUser` | Nested user object type inside `Driver` |
| `PaginatedResponse<T>` | Return type of the list query |

Local interface (not in `docs/schemas/index.ts`, defined in `hooks/use-drivers.ts` or `components/drivers/drivers-columns.tsx`):

```ts
// Shape returned by the list endpoint (subset of Driver)
interface DriverListItem {
  id: number;
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  license_type: LicenseType;
  status: DriverStatus;
  national_id: string;
}
```

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/drivers/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<DriverListItem>`. `search` matches on `national_id` or `license_number`. `ordering` values: `status`, `-status`, `license_expiry`, `-license_expiry`, `created_at`, `-created_at` |
| `GET` | `/drivers/{id}/` | — | Returns full `Driver` object for edit pre-population. Called only when opening the edit sheet. |
| `POST` | `/drivers/` | `DriverCreate` body | Returns `Driver` (HTTP 201). Required: `user`, `license_number`, `license_type`, `license_expiry`, `phone`, `national_id` |
| `PATCH` | `/drivers/{id}/` | `DriverUpdate` body (any subset) | Used for full edits from the form |
| `DELETE` | `/drivers/{id}/` | — | Returns HTTP 204. Hard delete — only after user confirms in dialog |

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/drivers/page.tsx` | Page component: owns pagination/search/ordering state and all sheet/dialog state; renders `DataTable` with toolbar and columns |
| `hooks/use-drivers.ts` | All TanStack Query hooks: `useDrivers(params)` (useQuery with `keepPreviousData`), `useDriver(id)` (useQuery for detail, enabled only when id is set), `useCreateDriver(onSuccess?)` (useMutation POST), `useUpdateDriver(onSuccess?)` (useMutation PATCH), `useDeleteDriver(onSuccess?)` (useMutation DELETE) |
| `components/drivers/drivers-columns.tsx` | `ColumnDef<DriverListItem>[]` definition via `createDriverColumns(actions)` factory; also exports `LICENSE_TYPE_LABELS`, `STATUS_LABELS`, `STATUS_BADGE_CLASSES` constants |
| `components/drivers/driver-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `driverId?: number`; when `driverId` is set, calls `useDriver(driverId)` and shows a loading skeleton while fetching; once resolved, renders `DriverForm` with `defaultValues`; title is "Nuevo conductor" or "Editar conductor" |
| `components/drivers/driver-form.tsx` | `react-hook-form` + `zod` form using `driverSchema`; accepts `defaultValues?: Driver` and `onSuccess: () => void`; calls `useCreateDriver` or `useUpdateDriver` based on presence of `defaultValues?.id`; shows license expiry warning badge inline when expiry is within 30 days |
| `components/drivers/driver-delete-dialog.tsx` | shadcn `AlertDialog`; props: `driverName: string`, `driverId: number \| null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description reads `¿Eliminar al conductor "${driverName}"? Esta acción no se puede deshacer.`; on confirm calls `useDeleteDriver(() => onOpenChange(false))` with `driverId`; both buttons disabled while `isPending` |

### Files to modify

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Import `Truck` icon from `lucide-react` (or `UserCheck` — use whichever is available and semantically fitting) and add `{ href: '/drivers', label: 'Conductores', icon: <chosen icon> }` to the `navLinks` array, placed after the Productos entry |

---

## Tasks

- [x] 1. Create `hooks/use-drivers.ts` — export:
  - `useDrivers(params: { page: number; page_size: number; search?: string; ordering?: string })` — `useQuery` with `queryKey: ['drivers', params]`, calls `GET /drivers/` with params, returns `PaginatedResponse<DriverListItem>`, uses `keepPreviousData`
  - `useDriver(id: number | undefined)` — `useQuery` with `queryKey: ['drivers', id]`, calls `GET /drivers/${id}/`, returns `Driver`, `enabled: !!id`
  - `useCreateDriver(onSuccess?: () => void)` — `useMutation` POST `/drivers/`, body `DriverCreate`, invalidates `['drivers']` on success
  - `useUpdateDriver(onSuccess?: () => void)` — `useMutation` PATCH `/drivers/${id}/`, body `{ id: number; data: DriverUpdate }`, invalidates `['drivers']` on success
  - `useDeleteDriver(onSuccess?: () => void)` — `useMutation` DELETE `/drivers/${id}/`, invalidates `['drivers']` on success

- [x] 2. Create `components/drivers/drivers-columns.tsx` — define and export:
  - `LICENSE_TYPE_LABELS: Record<LicenseType, string>` — all 5 values in Spanish
  - `STATUS_LABELS: Record<DriverStatus, string>` — all 4 values in Spanish
  - `STATUS_BADGE_CLASSES: Record<DriverStatus, string>` — Tailwind className strings for green/blue/gray/red colors
  - `ColumnActions` interface: `{ onEdit: (id: number, name: string) => void; onDelete: (id: number, name: string) => void }`
  - `createDriverColumns(actions: ColumnActions): ColumnDef<DriverListItem>[]` with columns: `user` (full name, font-medium), `national_id` (font-mono text-sm), `license_type` (Badge secondary + Spanish label), `status` (Badge outline + color className + Spanish label), `actions` (DropdownMenu with "Editar" and "Eliminar")

- [x] 3. Create `components/drivers/driver-form.tsx` — `react-hook-form` + `zod` form using `driverSchema`; fields in order: `user` (number input, type="number", min=1), `license_number` (text), `license_type` (Select with 5 Spanish options), `license_expiry` (date input; show "Vence pronto" Badge variant="destructive" below the field when within 30 days — compute with `differenceInDays(parseISO(value), new Date()) <= 30`), `phone` (text), `national_id` (text), `status` (Select with 4 Spanish options, defaults to AVAILABLE), `date_of_birth` (date input, optional); on submit: omit `date_of_birth` if empty string, omit `status` only if undefined (not if explicitly set); call `useCreateDriver` or `useUpdateDriver` based on `defaultValues?.id`; surface backend field errors (`user`, `license_number`, `national_id`) via `form.setError`; show loading state on submit button while mutation is pending

- [x] 4. Create `components/drivers/driver-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `driverId?: number`; when `driverId` is provided call `useDriver(driverId)` inside the sheet; show a centered spinner/skeleton in the sheet body while `isLoading`; once resolved render `DriverForm` with `defaultValues={driverData}` and `onSuccess={() => onOpenChange(false)}`; when `driverId` is undefined (create mode) render `DriverForm` with no `defaultValues` immediately; title: "Nuevo conductor" (create) or "Editar conductor" (edit)

- [x] 5. Create `components/drivers/driver-delete-dialog.tsx` — shadcn `AlertDialog`; props: `driverName: string`, `driverId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar al conductor "${driverName}"? Esta acción no se puede deshacer.`; on confirm call `useDeleteDriver(() => onOpenChange(false)).mutate(driverId)`; both AlertDialogAction and AlertDialogCancel disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 6. Create `app/(dashboard)/drivers/page.tsx` — `'use client'`; local state:
  - `searchInput: string` (raw input value)
  - `search: string` (debounced 300ms, resets `page` to 0 on change)
  - `page: number` (0-indexed, default 0)
  - `pageSize: number` (default 20)
  - `ordering: string` (default `'status'`)
  - `sheetOpen: boolean`
  - `selectedDriverId: number | undefined`
  - `selectedDriverName: string` (for delete dialog label — derived from the row when "Eliminar" is clicked)
  - `deleteDialogOpen: boolean`
  - `driverToDeleteId: number | null`
  - `driverToDeleteName: string`
  - Calls `useDrivers({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`
  - Computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`
  - Uses `useMemo` for columns, `useCallback` for all handlers
  - Renders page heading "Conductores" and subtitle "Gestiona los conductores de la flota"

- [x] 7. Wire the toolbar in `page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` with a controlled `Input` (bound to `searchInput`, `placeholder="Buscar por cédula o número de licencia…"`) and a "Nuevo conductor" `Button` (with `Plus` icon from `lucide-react`) that sets `selectedDriverId` to `undefined` and opens the sheet

- [x] 8. Wire row actions via the `ColumnActions` interface: `onEdit(id, name)` sets `selectedDriverId = id` and opens sheet; `onDelete(id, name)` sets `driverToDeleteId = id`, `driverToDeleteName = name`, and opens delete dialog; `handleSheetOpenChange` clears `selectedDriverId` when sheet closes; all state and handlers live in `page.tsx` and are passed to `createDriverColumns`

- [x] 9. Modify `components/layout/sidebar.tsx` — import `UserCheck` (or semantically appropriate icon) from `lucide-react` and add `{ href: '/drivers', label: 'Conductores', icon: UserCheck }` to `navLinks` after the Productos entry

- [ ] 10. Manual smoke test: (a) `/drivers` loads and shows paginated list with correct columns, (b) search by cédula filters results, (c) search by license number filters results, (d) "Nuevo conductor" opens empty sheet — form renders all fields, submission creates driver (HTTP 201) and row appears, (e) "Editar" opens sheet — detail fetch fires, form pre-populated with all driver fields, PATCH succeeds and row updates, (f) "Eliminar" shows confirm dialog naming the driver, on confirm hard-deletes (HTTP 204) and row disappears, (g) status badge colors match AVAILABLE=green / ON_ROUTE=blue / OFF_DUTY=gray / SUSPENDED=red, (h) license type badge shows correct Spanish label, (i) pagination controls work, (j) "Conductores" nav link highlights when on `/drivers`

---

## Validation criteria

All tasks 1–9 are independently verifiable by static analysis (file existence, exports, type correctness, hook signatures, component props). Task 10 requires a live backend.

Build must pass with `npm run build` (zero TypeScript errors). Lint must pass with `npm run lint` (zero errors).

---

## Validation Summary

**Date:** 2026-05-28
**Build:** Pass
**Lint:** Pass — 2 warnings (react-hooks/incompatible-library on useReactTable and form.watch; 0 errors)
**Tasks:** 9/9 passed (task 10 is manual smoke test — skipped)

### Failures
None. All statically verifiable tasks pass.
