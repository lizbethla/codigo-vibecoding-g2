# Spec: Vehicles (Vehículos)

## Overview

The Vehicles module provides a single list page at `/vehicles` where staff can view, search, create, edit, and delete vehicle records. The list is a server-paginated TanStack Table showing license plate, vehicle type badge, brand/model/year combined, status badge (color-coded), assigned driver name, and a per-row actions menu. Create and edit share one form rendered inside a shadcn `Sheet`. A separate `AlertDialog` confirms hard delete.

**Key structural notes:**
- The list endpoint (`GET /api/v1/vehicles/`) returns objects that match `VehicleSummary` shape (id, plate, vehicle_type, brand, model, year, status) — it does NOT return the nested `driver` object. Therefore, the edit form requires a **separate detail fetch** (`GET /api/v1/vehicles/{id}/`) to pre-populate all fields including the currently assigned driver. This mirrors the Drivers module pattern.
- The detail endpoint returns `Vehicle` which includes `driver: DriverSummary | null` where `DriverSummary = { id, national_id, license_number, license_type, full_name }`.
- The form includes a **Driver select** dropdown. Because drivers may have any status when already assigned to a vehicle, the dropdown fetches `GET /api/v1/drivers/?page_size=100` (all drivers, not filtered by status) so that the currently assigned driver appears in the options during edit mode. Each option is labeled as `{full_name} — {national_id}`.
- `vehicle_type`, `fuel_type`, and `status` are string enums with fixed option sets — all rendered as `Select` in the form.
- `capacity_kg` is a required decimal string; `capacity_m3` is optional decimal string. Both use `type="text"` inputs.
- `year` is an integer — form input is `type="number"`.
- `last_maintenance` is optional (`YYYY-MM-DD` date string) — rendered as `type="date"` input.
- `driver` is optional FK (Driver id integer). Sending `null` explicitly clears the driver assignment.
- No soft-delete: the module only supports hard DELETE with confirmation.

**Pages:** `/vehicles`
**Complexity:** CRUD + status enum badges + driver select dropdown (depends on Drivers module)

---

## Pages

### Page: `/vehicles`

- **Route:** `/vehicles`
- **Component:** `app/(dashboard)/vehicles/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `VehiclesPage` | new — `app/(dashboard)/vehicles/page.tsx` | Page entry; owns `searchInput`, `search`, `page`, `pageSize`, `ordering`, sheet state, delete dialog state |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nuevo vehículo" `Button` |
| `VehicleSheet` | new — `components/vehicles/vehicle-sheet.tsx` | shadcn `Sheet` wrapping `VehicleForm`; used for both create and edit; triggers a detail fetch when `vehicleId` is provided |
| `VehicleForm` | new — `components/vehicles/vehicle-form.tsx` | `react-hook-form` + `zod` form; calls `useCreateVehicle` or `useUpdateVehicle`; includes driver `Select`, vehicle_type `Select`, fuel_type `Select`; receives `defaultValues?: Vehicle` |
| `VehicleDeleteDialog` | new — `components/vehicles/vehicle-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete; calls `useDeleteVehicle` on confirm |
| `Badge` | shadcn/ui | Renders `vehicle_type` and `status` values with color-coded classes |
| `Button` | shadcn/ui | Toolbar "Nuevo vehículo" action, form submit |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Delete) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | shadcn/ui | `vehicle_type`, `fuel_type`, `status`, and `driver` selects inside `VehicleForm` |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All vehicle data-fetching and mutation hooks live in `hooks/use-vehicles.ts`. The driver list hook for the form dropdown is an addition to the existing `hooks/use-drivers.ts`.

**List query:**

```ts
// useVehicles(params)
useQuery<PaginatedResponse<VehicleListItem>, AxiosError>({
  queryKey: ['vehicles', params],  // params: { page, page_size, search, ordering }
  queryFn: () => api.get('/vehicles/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

Where `VehicleListItem` is the shape returned by the list endpoint:

```ts
interface VehicleListItem {
  id: number;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
}
```

The list endpoint does NOT return the nested `driver` object, so the driver column in the table cannot be populated from the list response. The driver column is **omitted from the list table** — it is only shown in the detail sheet (edit mode). See the columns section for details.

**Detail query (for edit pre-population):**

```ts
// useVehicle(id)
useQuery<Vehicle, AxiosError>({
  queryKey: ['vehicles', id],
  queryFn: () => api.get(`/vehicles/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

Used inside `VehicleSheet` when `vehicleId` is provided (edit mode). The result is passed as `defaultValues` to `VehicleForm` once the query resolves.

**Driver list query (for form dropdown — added to `hooks/use-drivers.ts`):**

```ts
// useDriversList()
// Fetches all drivers in one request (page_size=100) for use in select dropdowns.
// Does NOT filter by status — all drivers are included so the currently assigned
// driver appears in the edit form even if not AVAILABLE.
useQuery<PaginatedResponse<DriverListItem>, AxiosError>({
  queryKey: ['drivers-list'],
  queryFn: () =>
    api.get('/drivers/', { params: { page_size: 100, ordering: 'status' } }).then((r) => r.data),
  staleTime: 5 * 60 * 1000, // 5 min — driver list changes infrequently
})
```

**Create mutation:**

```ts
useMutation<Vehicle, AxiosError, VehicleCreate>({
  mutationFn: (body) => api.post('/vehicles/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Vehicle, AxiosError, { id: number; data: VehicleUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/vehicles/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    // close sheet, show toast
  },
})
```

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/vehicles/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/vehicles/vehicles-columns.tsx`. Row type is `VehicleListItem` (shape returned by the list endpoint).

| Accessor key | Header | Cell renderer |
|---|---|---|
| `plate` | Placa | `<span className="font-mono font-medium">{row.original.plate}</span>` |
| `vehicle_type` | Tipo | `Badge` with variant `secondary` and Spanish label from `VEHICLE_TYPE_LABELS` |
| `brand_model_year` | Vehículo | `<span className="font-medium">{row.original.brand} {row.original.model}</span><span className="text-muted-foreground text-sm ml-1">({row.original.year})</span>` — combined brand, model, year; uses `accessorFn: (row) => row.brand` with id `'brand_model_year'` |
| `status` | Estado | `Badge` with `variant="outline"` plus Tailwind className from `STATUS_BADGE_CLASSES` and Spanish label from `STATUS_LABELS` |
| `actions` | (empty) | `DropdownMenu` with items: "Editar" (sets `selectedVehicleId` and opens `VehicleSheet`), "Eliminar" (opens `VehicleDeleteDialog`) |

**Vehicle type label map:**

```ts
const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTORCYCLE:         'Motocicleta',
  VAN:                'Furgoneta',
  TRUCK:              'Camión',
  HEAVY_TRUCK:        'Camión pesado',
  REFRIGERATED_TRUCK: 'Camión refrigerado',
  CONTAINER:          'Contenedor',
};
```

**Status label map:**

```ts
const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE:   'Disponible',
  IN_USE:      'En uso',
  MAINTENANCE: 'En mantenimiento',
  RETIRED:     'Retirado',
};
```

**Status badge variant map** (using `variant="outline"` plus Tailwind className overrides):

| Status | Tailwind className on Badge |
|---|---|
| `AVAILABLE`   | `bg-green-100 text-green-800 border-green-200` |
| `IN_USE`      | `bg-blue-100 text-blue-800 border-blue-200` |
| `MAINTENANCE` | `bg-yellow-100 text-yellow-800 border-yellow-200` |
| `RETIRED`     | `bg-gray-100 text-gray-800 border-gray-200` |

Export `VEHICLE_TYPE_LABELS`, `STATUS_LABELS`, and `STATUS_BADGE_CLASSES` from `components/vehicles/vehicles-columns.tsx` so they can be reused in `VehicleForm`.

**Note on driver column:** The list endpoint does not return driver data, so the driver name cannot be shown in the list table. Driver information is only surfaced in the detail sheet (edit mode) — the form displays the currently assigned driver in the driver select when pre-populating from the detail fetch.

**Fuel type label map (for form, not table — exported from columns file for reuse):**

```ts
const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Gasolina',
  DIESEL:   'Diésel',
  ELECTRIC: 'Eléctrico',
  HYBRID:   'Híbrido',
  GAS:      'Gas',
};
```

#### Form fields

Defined in `VehicleForm`, validated with `zod`. Used for both create (empty `defaultValues`) and edit (pre-populated from the detail fetch result).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `plate` | Placa | text input | required, min 1 char, max 20 chars | Unique constraint enforced by backend; surface backend uniqueness error on field |
| `vehicle_type` | Tipo de vehículo | `Select` | required | 6 options with Spanish labels from `VEHICLE_TYPE_LABELS` |
| `brand` | Marca | text input | required, min 1 char | — |
| `model` | Modelo | text input | required, min 1 char | — |
| `year` | Año | number input | required, integer, 1900–2100 | `type="number"`, `min="1900"`, `max="2100"`, `step="1"` |
| `capacity_kg` | Capacidad (kg) | text input | required, positive decimal string | Validate with `z.string().regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')` |
| `capacity_m3` | Capacidad (m³) | text input | optional, positive decimal string | Same regex; blank → `undefined` (omit field) |
| `fuel_type` | Combustible | `Select` | optional, defaults to `DIESEL` | 5 options with Spanish labels from `FUEL_TYPE_LABELS` |
| `status` | Estado | `Select` | optional, defaults to `AVAILABLE` | 4 options with Spanish labels from `STATUS_LABELS` |
| `driver` | Conductor | `Select` | optional | Options populated from `useDriversList().data?.results ?? []`; each option labeled `{full_name} — {national_id}`, value is `String(driver.id)`; includes a "Sin conductor" option with value `""` to clear the assignment; blank → `null` (send explicitly to clear) |
| `last_maintenance` | Último mantenimiento | date input | optional | `type="date"`; blank → `undefined` (omit field) |

Zod schema:

```ts
const vehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').max(20, 'Máximo 20 caracteres'),
  vehicle_type: z.enum([
    'MOTORCYCLE', 'VAN', 'TRUCK', 'HEAVY_TRUCK', 'REFRIGERATED_TRUCK', 'CONTAINER',
  ]),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z
    .number({ invalid_type_error: 'Debe ser un número entero' })
    .int()
    .min(1900, 'Año mínimo 1900')
    .max(2100, 'Año máximo 2100'),
  capacity_kg: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo'),
  capacity_m3: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  fuel_type: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS']).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']).optional(),
  driver: z.string().optional(), // driver id as string; "" means clear assignment (send null)
  last_maintenance: z.string().optional().or(z.literal('')),
});
```

On submit, clean the values before sending to the API:
- `capacity_m3`: if empty string, omit the field
- `driver`: if `""` (Sin conductor), send `null` to clear assignment; if non-empty string, send `parseInt(values.driver, 10)`; if `undefined` and creating, omit the field
- `last_maintenance`: if empty string or undefined, omit the field
- `fuel_type`: if undefined, omit (backend defaults to `DIESEL`)
- `status`: if undefined, omit (backend defaults to `AVAILABLE`)

Surface backend field errors in the `onError` handler of the mutation:
- `{ plate: [...] }` → `form.setError('plate', { message: ... })`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides. The Axios interceptor in `lib/api.ts` reads the token from localStorage automatically.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Vehicle` | Full object returned by detail fetch (`GET /vehicles/{id}/`); `VehicleForm` prefill data type; returned by create/update mutations |
| `VehicleCreate` | `useCreateVehicle` mutation variables; form submit body |
| `VehicleUpdate` | `useUpdateVehicle` mutation variables |
| `VehicleType` | `vehicle_type` field union type; used in columns badge and form select |
| `VehicleStatus` | `status` field union type; used in columns badge and form select |
| `FuelType` | `fuel_type` field union type; used in form select |
| `VehicleSummary` | Shape of list items (minus driver) — see `VehicleListItem` local interface |
| `DriverSummary` | Nested driver object type inside `Vehicle`; `id` and `full_name`/`national_id` used to pre-select driver in edit mode |
| `PaginatedResponse<T>` | Return type of the list query and driver list query |

Local interface (not in `docs/schemas/index.ts`, defined in `hooks/use-vehicles.ts`):

```ts
// Shape returned by the list endpoint (subset of Vehicle — no driver field)
interface VehicleListItem {
  id: number;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
}
```

Additionally, `DriverListItem` (already exported from `hooks/use-drivers.ts`) is used inside `VehicleForm` to populate the driver select options.

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/vehicles/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<VehicleListItem>`. `search` matches on `plate`. `ordering` values: `plate`, `-plate`, `year`, `-year`, `status`, `-status`, `created_at`, `-created_at` |
| `GET` | `/vehicles/{id}/` | — | Returns full `Vehicle` object including `driver: DriverSummary \| null`. Called only when opening the edit sheet. |
| `POST` | `/vehicles/` | `VehicleCreate` body | Returns `Vehicle` (HTTP 201). Required: `plate`, `vehicle_type`, `brand`, `model`, `year`, `capacity_kg` |
| `PATCH` | `/vehicles/{id}/` | `VehicleUpdate` body (any subset) | Used for full edits from the form; also used for status change or driver assignment |
| `DELETE` | `/vehicles/{id}/` | — | Returns HTTP 204. Hard delete — only after user confirms in dialog |
| `GET` | `/drivers/` | `?page_size=100&ordering=status` | Used by `useDriversList` (added to `hooks/use-drivers.ts`) to populate the driver select. Returns `PaginatedResponse<DriverListItem>`; only `results` (id, full_name, national_id) are used |

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/vehicles/page.tsx` | Page component: owns pagination/search/ordering state and all sheet/dialog state; renders `DataTable` with toolbar and columns |
| `hooks/use-vehicles.ts` | All TanStack Query hooks: `useVehicles(params)` (useQuery with `keepPreviousData`), `useVehicle(id)` (useQuery for detail, enabled only when id is set), `useCreateVehicle(onSuccess?)` (useMutation POST), `useUpdateVehicle(onSuccess?)` (useMutation PATCH), `useDeleteVehicle(onSuccess?)` (useMutation DELETE) |
| `components/vehicles/vehicles-columns.tsx` | `ColumnDef<VehicleListItem>[]` definition via `createVehicleColumns(actions)` factory; also exports `VEHICLE_TYPE_LABELS`, `STATUS_LABELS`, `STATUS_BADGE_CLASSES`, `FUEL_TYPE_LABELS` constants |
| `components/vehicles/vehicle-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `vehicleId?: number`; when `vehicleId` is set, calls `useVehicle(vehicleId)` inside the sheet; shows a loading skeleton while fetching; once resolved renders `VehicleForm` with `defaultValues`; title is "Nuevo vehículo" or "Editar vehículo" |
| `components/vehicles/vehicle-form.tsx` | `react-hook-form` + `zod` form using `vehicleSchema`; accepts `defaultValues?: Vehicle` and `onSuccess: () => void`; calls `useCreateVehicle` or `useUpdateVehicle` based on presence of `defaultValues?.id`; calls `useDriversList()` internally to populate driver select |
| `components/vehicles/vehicle-delete-dialog.tsx` | shadcn `AlertDialog`; props: `vehiclePlate: string`, `vehicleId: number \| null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description reads `¿Eliminar el vehículo "${vehiclePlate}"? Esta acción no se puede deshacer.`; on confirm calls `useDeleteVehicle(() => onOpenChange(false)).mutate(vehicleId)`; both buttons disabled while `isPending`; AlertDialogAction has `variant="destructive"` |

### Files to modify

| File | Change |
|---|---|
| `hooks/use-drivers.ts` | Add and export `useDriversList()` — a non-paginated query that calls `GET /drivers/?page_size=100&ordering=status` with `queryKey: ['drivers-list']` and `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<DriverListItem>`; used by `VehicleForm` to populate the driver select dropdown |
| `components/layout/sidebar.tsx` | Import `Truck` icon from `lucide-react` and add `{ href: '/vehicles', label: 'Vehículos', icon: Truck }` to the `navLinks` array, placed after the Conductores entry |

---

## Tasks

- [x] 1. Modify `hooks/use-drivers.ts` — add and export `useDriversList()`: `useQuery` with `queryKey: ['drivers-list']`, calls `GET /drivers/` with params `{ page_size: 100, ordering: 'status' }`, `staleTime: 5 * 60 * 1000`; returns `PaginatedResponse<DriverListItem>`; this is a lightweight hook for dropdown population only, does not affect the paginated `useDrivers`

- [x] 2. Create `hooks/use-vehicles.ts` — export:
  - `VehicleListItem` interface (id, plate, vehicle_type, brand, model, year, status — no driver field)
  - `useVehicles(params: { page: number; page_size: number; search?: string; ordering?: string })` — `useQuery` with `queryKey: ['vehicles', params]`, calls `GET /vehicles/` with params, returns `PaginatedResponse<VehicleListItem>`, uses `keepPreviousData`
  - `useVehicle(id: number | undefined)` — `useQuery` with `queryKey: ['vehicles', id]`, calls `GET /vehicles/${id}/`, returns `Vehicle`, `enabled: !!id`
  - `useCreateVehicle(onSuccess?: () => void)` — `useMutation` POST `/vehicles/`, body `VehicleCreate`, invalidates `['vehicles']` on success
  - `useUpdateVehicle(onSuccess?: () => void)` — `useMutation` PATCH `/vehicles/${id}/`, body `{ id: number; data: VehicleUpdate }`, invalidates `['vehicles']` on success
  - `useDeleteVehicle(onSuccess?: () => void)` — `useMutation` DELETE `/vehicles/${id}/`, invalidates `['vehicles']` on success

- [x] 3. Create `components/vehicles/vehicles-columns.tsx` — define and export:
  - `VEHICLE_TYPE_LABELS: Record<VehicleType, string>` — all 6 values in Spanish
  - `STATUS_LABELS: Record<VehicleStatus, string>` — all 4 values in Spanish
  - `STATUS_BADGE_CLASSES: Record<VehicleStatus, string>` — Tailwind className strings for green/blue/yellow/gray colors
  - `FUEL_TYPE_LABELS: Record<FuelType, string>` — all 5 values in Spanish
  - `ColumnActions` interface: `{ onEdit: (id: number, plate: string) => void; onDelete: (id: number, plate: string) => void }`
  - `createVehicleColumns(actions: ColumnActions): ColumnDef<VehicleListItem>[]` with columns: `plate` (font-mono font-medium), `vehicle_type` (Badge secondary + Spanish label), `brand_model_year` (accessorFn returning brand, combined cell rendering `{brand} {model} ({year})`), `status` (Badge outline + color className + Spanish label), `actions` (DropdownMenu with "Editar" and "Eliminar")

- [x] 4. Create `components/vehicles/vehicle-form.tsx` — `react-hook-form` + `zod` form using `vehicleSchema`; fields in order: `plate` (text), `vehicle_type` (Select with 6 Spanish options), `brand` (text), `model` (text), `year` (number input, min=1900, max=2100, step=1; use `valueAsNumber: true` in register), `capacity_kg` (text), `capacity_m3` (text, optional), `fuel_type` (Select with 5 Spanish options, defaults to DIESEL), `status` (Select with 4 Spanish options, defaults to AVAILABLE), `driver` (Select populated from `useDriversList().data?.results ?? []`, each option labeled `{full_name} — {national_id}`, value is `String(driver.id)`, plus "Sin conductor" option with value `""`), `last_maintenance` (date input, optional); on submit: clean values (capacity_m3 empty → omit; driver `""` → send `null`; driver non-empty string → `parseInt(..., 10)`; last_maintenance empty → omit; fuel_type/status undefined → omit); call `useCreateVehicle` or `useUpdateVehicle` based on `defaultValues?.id`; surface `plate` backend uniqueness error via `form.setError('plate', ...)` in the mutation `onError` handler; show loading state on submit button while mutation is pending; show loading state on driver select while `useDriversList` is loading

- [x] 5. Create `components/vehicles/vehicle-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `vehicleId?: number`; when `vehicleId` is provided call `useVehicle(vehicleId)` inside the sheet; show a centered spinner/skeleton in the sheet body while `isLoading`; once resolved render `VehicleForm` with `defaultValues={vehicleData}` and `onSuccess={() => onOpenChange(false)}`; when `vehicleId` is undefined (create mode) render `VehicleForm` with no `defaultValues` immediately; title: "Nuevo vehículo" (create) or "Editar vehículo" (edit)

- [x] 6. Create `components/vehicles/vehicle-delete-dialog.tsx` — shadcn `AlertDialog`; props: `vehiclePlate: string`, `vehicleId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar el vehículo "${vehiclePlate}"? Esta acción no se puede deshacer.`; on confirm call `useDeleteVehicle(() => onOpenChange(false)).mutate(vehicleId)`; both AlertDialogAction and AlertDialogCancel disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 7. Create `app/(dashboard)/vehicles/page.tsx` — `'use client'`; local state:
  - `searchInput: string` (raw input value)
  - `search: string` (debounced 300ms, resets `page` to 0 on change)
  - `page: number` (0-indexed, default 0)
  - `pageSize: number` (default 20)
  - `ordering: string` (default `'plate'`)
  - `sheetOpen: boolean`
  - `selectedVehicleId: number | undefined`
  - `deleteDialogOpen: boolean`
  - `vehicleToDeleteId: number | null`
  - `vehicleToDeletePlate: string`
  - Calls `useVehicles({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`
  - Computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`
  - Uses `useMemo` for columns, `useCallback` for all handlers
  - Renders page heading "Vehículos" and subtitle "Gestiona la flota de vehículos"

- [x] 8. Wire the toolbar in `page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` with a controlled `Input` (bound to `searchInput`, `placeholder="Buscar por placa…"`) and a "Nuevo vehículo" `Button` (with `Plus` icon from `lucide-react`) that sets `selectedVehicleId` to `undefined` and opens the sheet

- [x] 9. Wire row actions via the `ColumnActions` interface: `onEdit(id, plate)` sets `selectedVehicleId = id` and opens sheet; `onDelete(id, plate)` sets `vehicleToDeleteId = id`, `vehicleToDeletePlate = plate`, and opens delete dialog; `handleSheetOpenChange` clears `selectedVehicleId` when sheet closes; all state and handlers live in `page.tsx` and are passed to `createVehicleColumns`

- [x] 10. Modify `components/layout/sidebar.tsx` — import `Truck` from `lucide-react` and add `{ href: '/vehicles', label: 'Vehículos', icon: Truck }` to `navLinks` after the Conductores entry

- [ ] 11. Manual smoke test: (a) `/vehicles` loads and shows paginated list with correct columns (plate, vehicle_type badge, brand/model/year combined, status badge, actions — no driver column), (b) search by plate filters results, (c) "Nuevo vehículo" opens empty sheet — all form fields render including driver select (populated from drivers list), vehicle_type/fuel_type/status selects show correct Spanish options, form submission creates vehicle (HTTP 201) and row appears, (d) "Editar" opens sheet — detail fetch fires, form pre-populated with all vehicle fields including currently assigned driver pre-selected in driver select, PATCH succeeds and row updates, (e) driver select "Sin conductor" option clears assignment (sends `driver: null`), (f) "Eliminar" shows confirm dialog naming the plate, on confirm hard-deletes (HTTP 204) and row disappears, (g) status badge colors match AVAILABLE=green / IN_USE=blue / MAINTENANCE=yellow / RETIRED=gray, (h) vehicle_type badge shows correct Spanish label, (i) pagination controls work, (j) "Vehículos" nav link highlights when on `/vehicles`

---

## Validation criteria

All tasks 1–10 are independently verifiable by static analysis (file existence, exports, type correctness, hook signatures, component props). Task 11 requires a live backend.

Build must pass with `npm run build` (zero TypeScript errors). Lint must pass with `npm run lint` (zero errors).

---

## Validation Summary

**Date:** 2026-05-28
**Build:** Pass — all 10 routes compiled, zero TypeScript errors
**Lint:** Pass — 0 errors (2 pre-existing warnings in unrelated files: data-table.tsx and driver-form.tsx)
**Tasks:** 10/10 passed (task 11 is manual smoke test, skipped)

### Observations
- Task 4: `year` field uses a custom `onChange` handler instead of `valueAsNumber: true` in register — functionally equivalent, produces correct integer type for zod validation.
- Task 4: Driver select label builds `{full_name}` from `user.first_name + user.last_name` because `DriverListItem` (from paginated endpoint) returns the `user` object rather than a computed `full_name` field. This is correct given the actual API shape.
- All hooks, components, columns, form fields, and sidebar entry verified present and correct.
