# Spec: Routes (Rutas)

## Overview

The Routes module creates two pages: a list page at `/routes` and a detail page at `/routes/[id]`. The list page shows a server-paginated TanStack Table of routes with code, name, origin/destination city combined, distance, is_active badge, and per-row actions. Create and edit forms for routes live in a shadcn `Sheet`. The detail page shows all route fields and manages the nested stops collection (add, edit, delete stops). Stops are already embedded in the `GET /routes/{id}/` response so no separate fetch is needed for initial load; mutations (create/edit/delete stop) use the nested `/routes/{route_pk}/stops/{pk}/` endpoints. This module is more complex than standard CRUD because of the nested resource management on the detail page.

**Pages:** `/routes` (list), `/routes/[id]` (detail + stops management)
**Complexity:** CRUD + nested resource management + order uniqueness constraint

---

## Pages

### Page: `/routes`

- **Route:** `/routes`
- **Component:** `app/(dashboard)/routes/page.tsx`
- **Type:** list

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `RoutesPage` | new — `app/(dashboard)/routes/page.tsx` | Page entry; owns `searchInput`, `search`, `page`, `pageSize`, `ordering`, sheet state, delete dialog state |
| `DataTable` | `components/data-table/data-table.tsx` | Receives `columns`, `data`, `pageCount`, `pageIndex`, `pageSize`, `onPageChange`, `onPageSizeChange`, `isLoading`, `toolbar` |
| `DataTableToolbar` | `components/data-table/data-table-toolbar.tsx` | Passed as the `toolbar` prop; contains the search `Input` and "Nueva ruta" `Button` |
| `RouteSheet` | new — `components/routes/route-sheet.tsx` | shadcn `Sheet` wrapping `RouteForm`; used for both create and edit; triggers a detail fetch when `routeId` is provided |
| `RouteForm` | new — `components/routes/route-form.tsx` | `react-hook-form` + `zod` form for route fields; calls `useCreateRoute` or `useUpdateRoute` |
| `RouteDeleteDialog` | new — `components/routes/route-delete-dialog.tsx` | shadcn `AlertDialog` for hard delete with cascade warning |
| `Badge` | shadcn/ui | Renders `is_active` value |
| `Button` | shadcn/ui | Toolbar "Nueva ruta" action, form submit, detail page actions |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` | shadcn/ui | Per-row actions menu (Edit, Delete, View) |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Slide-over panel for create/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Confirm delete dialog |

#### TanStack Query

All route data-fetching and mutation hooks live in `hooks/use-routes.ts`. Nested stop hooks live in `hooks/use-route-stops.ts`.

**List query:**

```ts
// useRoutes(params)
useQuery<PaginatedResponse<RouteListItem>, AxiosError>({
  queryKey: ['routes', params], // params: { page, page_size, search, ordering }
  queryFn: () => api.get('/routes/', { params }).then((r) => r.data),
  placeholderData: keepPreviousData,
})
```

Where `RouteListItem` is the shape returned by the list endpoint:

```ts
interface RouteListItem {
  id: number;
  code: string;
  name: string;
  origin_city: string;
  destination_city: string;
  is_active: boolean;
}
```

Note: The list endpoint returns `RouteSummary` (id, code, name, origin_city, destination_city, is_active) — it does NOT return `distance_km`, `estimated_hours`, or `stops`. The distance column is **omitted from the list table**.

**Detail query (used in RouteSheet for edit pre-population):**

```ts
// useRoute(id)
useQuery<Route, AxiosError>({
  queryKey: ['routes', id],
  queryFn: () => api.get(`/routes/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

**Create mutation:**

```ts
useMutation<Route, AxiosError, RouteCreate>({
  mutationFn: (body) => api.post('/routes/', body).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    // close sheet, show toast
  },
})
```

**Update mutation (PATCH):**

```ts
useMutation<Route, AxiosError, { id: number; data: RouteUpdate }>({
  mutationFn: ({ id, data }) =>
    api.patch(`/routes/${id}/`, data).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    // close sheet, show toast
  },
})
```

**Delete mutation:**

```ts
useMutation<void, AxiosError, number>({
  mutationFn: (id) => api.delete(`/routes/${id}/`).then(() => undefined),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    // close dialog, show toast
  },
})
```

#### TanStack Table columns

Defined in `components/routes/routes-columns.tsx`. Row type is `RouteListItem`.

| Accessor key | Header | Cell renderer |
|---|---|---|
| `code` | Código | `<span className="font-mono font-medium">{row.original.code}</span>` |
| `name` | Nombre | `<span className="font-medium">{row.original.name}</span>` |
| `route_path` | Ruta | `<span className="text-sm">{row.original.origin_city} <span className="text-muted-foreground">→</span> {row.original.destination_city}</span>` — combined cell; uses `accessorFn: (row) => row.origin_city` with id `'route_path'` |
| `is_active` | Estado | `Badge` with `variant="outline"` plus color className: active → `bg-green-100 text-green-800 border-green-200` labeled "Activo"; inactive → `bg-gray-100 text-gray-800 border-gray-200` labeled "Inactivo" |
| `actions` | (empty) | `DropdownMenu` with items: "Ver detalle" (navigates to `/routes/{id}`), "Editar" (sets `selectedRouteId` and opens `RouteSheet`), "Eliminar" (opens `RouteDeleteDialog`) |

Export `IS_ACTIVE_BADGE_CLASSES` from `components/routes/routes-columns.tsx`.

#### Form fields

Defined in `RouteForm`, validated with `zod`. Used for both create (empty `defaultValues`) and edit (pre-populated from the detail fetch result).

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `name` | Nombre | text input | required, min 1 char | — |
| `code` | Código | text input | required, min 1 char, max 30 chars | Short unique identifier; backend enforces uniqueness; surface backend uniqueness error on field |
| `origin_city` | Ciudad de origen | text input | required, min 1 char | — |
| `destination_city` | Ciudad de destino | text input | required, min 1 char | — |
| `distance_km` | Distancia (km) | text input | optional, positive decimal string | Validate `z.string().regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo').optional().or(z.literal(''))` |
| `estimated_hours` | Tiempo estimado (horas) | text input | optional, positive decimal string | Same regex as distance_km |
| `is_active` | Activa | checkbox / Switch | optional, defaults to `true` | Use shadcn `Switch` component; label on the right |

Zod schema:

```ts
const routeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido').max(30, 'Máximo 30 caracteres'),
  origin_city: z.string().min(1, 'La ciudad de origen es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  distance_km: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  estimated_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});
```

On submit, clean the values before sending to the API:
- `distance_km`: if empty string, omit the field
- `estimated_hours`: if empty string, omit the field
- `is_active`: if undefined, omit (backend defaults to `true`)

Surface backend field errors in the `onError` handler:
- `{ code: [...] }` → `form.setError('code', { message: ... })`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides.

---

### Page: `/routes/[id]`

- **Route:** `/routes/[id]`
- **Component:** `app/(dashboard)/routes/[id]/page.tsx`
- **Type:** detail

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `RouteDetailPage` | new — `app/(dashboard)/routes/[id]/page.tsx` | Page entry; receives `params: { id: string }`; owns stop sheet state and stop delete dialog state |
| `RouteInfoCard` | new — `components/routes/route-info-card.tsx` | Displays all route fields (code, name, cities, distance_km, estimated_hours, is_active badge) in a shadcn `Card` |
| `StopsTable` | new — `components/routes/stops-table.tsx` | Renders the list of stops (ordered by `order`) with columns: order number, stop_name, estimated_arrival_hours, notes, actions; receives `stops: RouteStop[]` and action callbacks |
| `StopSheet` | new — `components/routes/stop-sheet.tsx` | shadcn `Sheet` wrapping `StopForm`; used for both add and edit stop; when `stop` prop is provided, pre-populates form |
| `StopForm` | new — `components/routes/stop-form.tsx` | `react-hook-form` + `zod` form for stop fields; calls `useCreateStop` or `useUpdateStop`; surfaces `order` uniqueness error |
| `StopDeleteDialog` | new — `components/routes/stop-delete-dialog.tsx` | shadcn `AlertDialog` for stop hard delete |
| `Button` | shadcn/ui | "Volver a rutas" back button, "Agregar parada" button, form submit |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` | shadcn/ui | Route info section |
| `Badge` | shadcn/ui | is_active status in route info card |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | shadcn/ui | Stop add/edit form |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | shadcn/ui | Stop confirm delete |

#### TanStack Query

Stop mutation hooks live in `hooks/use-route-stops.ts`. The route detail (including initial stops array) is fetched by `useRoute(id)` already described above — the same hook is used on the detail page, so the data and cache entry are shared.

**Route detail query (reused from `hooks/use-routes.ts`):**

```ts
// useRoute(id) — same hook as the sheet uses; returns Route which includes stops[]
useQuery<Route, AxiosError>({
  queryKey: ['routes', id],
  queryFn: () => api.get(`/routes/${id}/`).then((r) => r.data),
  enabled: !!id,
})
```

The `stops[]` array on the detail response is already ordered by `order` field ascending. No separate stop-list fetch is needed for the initial render.

**Create stop mutation:**

```ts
useMutation<RouteStop, AxiosError, { routeId: number; data: RouteStopCreate }>({
  mutationFn: ({ routeId, data }) =>
    api.post(`/routes/${routeId}/stops/`, data).then((r) => r.data),
  onSuccess: (_, { routeId }) => {
    queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
    // close sheet, show toast
  },
})
```

**Update stop mutation (PATCH):**

```ts
useMutation<RouteStop, AxiosError, { routeId: number; stopId: number; data: RouteStopUpdate }>({
  mutationFn: ({ routeId, stopId, data }) =>
    api.patch(`/routes/${routeId}/stops/${stopId}/`, data).then((r) => r.data),
  onSuccess: (_, { routeId }) => {
    queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
    // close sheet, show toast
  },
})
```

**Delete stop mutation:**

```ts
useMutation<void, AxiosError, { routeId: number; stopId: number }>({
  mutationFn: ({ routeId, stopId }) =>
    api.delete(`/routes/${routeId}/stops/${stopId}/`).then(() => undefined),
  onSuccess: (_, { routeId }) => {
    queryClient.invalidateQueries({ queryKey: ['routes', routeId] });
    // close dialog, show toast
  },
})
```

After any stop mutation succeeds, `queryClient.invalidateQueries({ queryKey: ['routes', routeId] })` refetches the route detail (which includes the updated `stops[]` array). This keeps the UI in sync without a separate stops-list query.

#### Stops table columns (inside `StopsTable`)

Row type is `RouteStop`. This is a plain HTML table or shadcn `Table` — it does not use the shared `DataTable` wrapper (no server pagination needed; all stops are embedded in the route detail response).

| Column | Header | Cell renderer |
|---|---|---|
| `order` | # | `<span className="font-mono font-medium text-sm">{stop.order}</span>` |
| `stop_name` | Parada | `<span className="font-medium">{stop.stop_name}</span>` |
| `estimated_arrival_hours` | Llegada estimada (h) | `stop.estimated_arrival_hours ? stop.estimated_arrival_hours + ' h' : <span className="text-muted-foreground">—</span>` |
| `notes` | Notas | `stop.notes ?? <span className="text-muted-foreground">—</span>` |
| actions | (empty) | `Button variant="ghost" size="sm"` for "Editar" and `Button variant="ghost" size="sm" className="text-destructive"` for "Eliminar" |

#### Stop form fields

Defined in `StopForm`, validated with `zod`.

| Field | Label | Type | Validation | Notes |
|---|---|---|---|---|
| `stop_name` | Nombre de la parada | text input | required, min 1 char | — |
| `order` | Orden | number input | required, positive integer, min 1 | `type="number"`, `min="1"`, `step="1"`; backend enforces uniqueness per route; surface `order` backend uniqueness error on field with message "Ya existe una parada con este número de orden en esta ruta." |
| `estimated_arrival_hours` | Horas desde salida | text input | optional, positive decimal string | Same regex pattern as route decimal fields |
| `notes` | Notas | textarea | optional | Multi-line; blank → omit field |

Zod schema:

```ts
const stopSchema = z.object({
  stop_name: z.string().min(1, 'El nombre de la parada es requerido'),
  order: z
    .number({ invalid_type_error: 'Debe ser un número entero' })
    .int()
    .positive('El orden debe ser mayor que 0'),
  estimated_arrival_hours: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});
```

On submit, clean the values before sending to the API:
- `estimated_arrival_hours`: if empty string, omit the field
- `notes`: if empty string, omit the field

Surface backend field errors:
- `{ order: [...] }` → `form.setError('order', { message: errors.order[0] })`

#### Zustand usage

No Zustand state is needed beyond what Auth already provides.

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|---|---|
| `Route` | Full object returned by detail fetch; includes `stops: RouteStop[]`; returned by create/update mutations |
| `RouteCreate` | `useCreateRoute` mutation variables; form submit body |
| `RouteUpdate` | `useUpdateRoute` mutation variables |
| `RouteSummary` | Shape of list items — aligns with `RouteListItem` local interface |
| `RouteStop` | Each stop object in `Route.stops[]`; row type for `StopsTable` |
| `RouteStopCreate` | `useCreateStop` mutation variables; stop form submit body |
| `RouteStopUpdate` | `useUpdateStop` mutation variables |
| `PaginatedResponse<T>` | Return type of the list query |

Local interface (not in `docs/schemas/index.ts`, defined in `hooks/use-routes.ts`):

```ts
// Shape returned by the list endpoint (RouteSummary)
interface RouteListItem {
  id: number;
  code: string;
  name: string;
  origin_city: string;
  destination_city: string;
  is_active: boolean;
}
```

---

## API calls

| Method | Endpoint | Params / Body | Notes |
|---|---|---|---|
| `GET` | `/routes/` | `?page=`, `?page_size=`, `?search=`, `?ordering=` | Returns `PaginatedResponse<RouteListItem>`. `search` matches on `name` or `code`. `ordering` values: `name`, `-name`, `code`, `-code`, `origin_city`, `-origin_city`, `destination_city`, `-destination_city`, `created_at`, `-created_at` |
| `GET` | `/routes/{id}/` | — | Returns full `Route` with embedded `stops[]` ordered by `order`. Used both by `RouteSheet` (edit pre-population) and the detail page |
| `POST` | `/routes/` | `RouteCreate` body | Returns `Route` (HTTP 201). Required: `name`, `code`, `origin_city`, `destination_city` |
| `PATCH` | `/routes/{id}/` | `RouteUpdate` body (any subset) | Used for full edits from the form; does NOT modify stops |
| `DELETE` | `/routes/{id}/` | — | Returns HTTP 204. Hard delete — cascade deletes all stops. Only after user confirms in dialog |
| `POST` | `/routes/{route_pk}/stops/` | `RouteStopCreate` body | Returns `RouteStop` (HTTP 201). Required: `stop_name`, `order`. Error on duplicate order: `{ "order": ["Ya existe una parada con este número de orden en esta ruta."] }` |
| `PATCH` | `/routes/{route_pk}/stops/{pk}/` | `RouteStopUpdate` body (any subset) | Returns updated `RouteStop` |
| `DELETE` | `/routes/{route_pk}/stops/{pk}/` | — | Returns HTTP 204 |

---

## File list

### Files to create

| File | Purpose |
|---|---|
| `app/(dashboard)/routes/page.tsx` | List page: owns pagination/search/ordering state and all sheet/dialog state; renders `DataTable` with toolbar and columns |
| `app/(dashboard)/routes/[id]/page.tsx` | Detail page: fetches route by id (including stops[]), renders `RouteInfoCard`, `StopsTable`, stop sheet, stop delete dialog; back button to `/routes` |
| `hooks/use-routes.ts` | TanStack Query hooks: `useRoutes(params)` (list, `keepPreviousData`), `useRoute(id)` (detail, `enabled: !!id`), `useCreateRoute(onSuccess?)` (POST), `useUpdateRoute(onSuccess?)` (PATCH), `useDeleteRoute(onSuccess?)` (DELETE) |
| `hooks/use-route-stops.ts` | TanStack Query mutation hooks: `useCreateStop(onSuccess?)` (POST nested), `useUpdateStop(onSuccess?)` (PATCH nested), `useDeleteStop(onSuccess?)` (DELETE nested) — all invalidate `['routes', routeId]` on success |
| `components/routes/routes-columns.tsx` | `ColumnDef<RouteListItem>[]` via `createRouteColumns(actions)` factory; exports `IS_ACTIVE_BADGE_CLASSES` constant; `ColumnActions` interface |
| `components/routes/route-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open`, `onOpenChange`, `routeId?: number`; calls `useRoute(routeId)` in edit mode; shows loading skeleton; renders `RouteForm` |
| `components/routes/route-form.tsx` | `react-hook-form` + `zod` form using `routeSchema`; accepts `defaultValues?: Route` and `onSuccess: () => void`; calls `useCreateRoute` or `useUpdateRoute`; surfaces `code` backend uniqueness error |
| `components/routes/route-delete-dialog.tsx` | `AlertDialog`; props: `routeName`, `routeId`, `open`, `onOpenChange`; warns about cascade deletion of stops; calls `useDeleteRoute` on confirm |
| `components/routes/route-info-card.tsx` | Displays all route fields in a shadcn `Card`; receives `route: Route` prop; shows is_active badge, code, name, cities, distance_km, estimated_hours |
| `components/routes/stops-table.tsx` | Renders `RouteStop[]` ordered by `order` in a shadcn `Table`; props: `stops: RouteStop[]`, `onEdit: (stop: RouteStop) => void`, `onDelete: (stop: RouteStop) => void` |
| `components/routes/stop-sheet.tsx` | Controlled `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open`, `onOpenChange`, `routeId: number`, `stop?: RouteStop`; renders `StopForm` in add or edit mode; title: "Agregar parada" or "Editar parada" |
| `components/routes/stop-form.tsx` | `react-hook-form` + `zod` form using `stopSchema`; accepts `defaultValues?: RouteStop`, `routeId: number`, and `onSuccess: () => void`; calls `useCreateStop` or `useUpdateStop`; surfaces `order` backend uniqueness error |
| `components/routes/stop-delete-dialog.tsx` | `AlertDialog`; props: `stopName`, `routeId`, `stopId`, `open`, `onOpenChange`; calls `useDeleteStop` on confirm |

### Files to modify

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Import `Route` (or `MapPin`) icon from `lucide-react` and add `{ href: '/routes', label: 'Rutas', icon: Route }` to the `navLinks` array, placed after the Vehículos entry |

---

## Tasks

- [x] 1. Create `hooks/use-routes.ts` — export:
  - `RouteListItem` interface (id, code, name, origin_city, destination_city, is_active)
  - `useRoutes(params: { page: number; page_size: number; search?: string; ordering?: string })` — `useQuery` with `queryKey: ['routes', params]`, calls `GET /routes/` with params, returns `PaginatedResponse<RouteListItem>`, uses `keepPreviousData`
  - `useRoute(id: number | undefined)` — `useQuery` with `queryKey: ['routes', id]`, calls `GET /routes/${id}/`, returns `Route`, `enabled: !!id`
  - `useCreateRoute(onSuccess?: () => void)` — `useMutation` POST `/routes/`, body `RouteCreate`, invalidates `['routes']` on success
  - `useUpdateRoute(onSuccess?: () => void)` — `useMutation` PATCH `/routes/${id}/`, body `{ id: number; data: RouteUpdate }`, invalidates `['routes']` on success
  - `useDeleteRoute(onSuccess?: () => void)` — `useMutation` DELETE `/routes/${id}/`, invalidates `['routes']` on success

- [x] 2. Create `hooks/use-route-stops.ts` — export:
  - `useCreateStop(onSuccess?: () => void)` — `useMutation`, calls `POST /routes/${routeId}/stops/`, body `{ routeId: number; data: RouteStopCreate }`, on success invalidates `['routes', routeId]`
  - `useUpdateStop(onSuccess?: () => void)` — `useMutation`, calls `PATCH /routes/${routeId}/stops/${stopId}/`, body `{ routeId: number; stopId: number; data: RouteStopUpdate }`, on success invalidates `['routes', routeId]`
  - `useDeleteStop(onSuccess?: () => void)` — `useMutation`, calls `DELETE /routes/${routeId}/stops/${stopId}/`, body `{ routeId: number; stopId: number }`, on success invalidates `['routes', routeId]`

- [x] 3. Create `components/routes/routes-columns.tsx` — define and export:
  - `IS_ACTIVE_BADGE_CLASSES: Record<string, string>` — two entries: `'true'` → `'bg-green-100 text-green-800 border-green-200'`, `'false'` → `'bg-gray-100 text-gray-800 border-gray-200'`
  - `ColumnActions` interface: `{ onEdit: (id: number, name: string) => void; onDelete: (id: number, name: string) => void; onView: (id: number) => void }`
  - `createRouteColumns(actions: ColumnActions): ColumnDef<RouteListItem>[]` with columns: `code` (font-mono font-medium), `name` (font-medium), `route_path` (combined origin → destination using `accessorFn`), `is_active` (Badge outline + color className + "Activo"/"Inactivo"), `actions` (DropdownMenu with "Ver detalle", "Editar", "Eliminar")

- [x] 4. Create `components/routes/route-form.tsx` — `react-hook-form` + `zod` form using `routeSchema`; fields in order: `name` (text), `code` (text, max 30), `origin_city` (text), `destination_city` (text), `distance_km` (text, optional), `estimated_hours` (text, optional), `is_active` (Switch, defaults to `true`); on submit: omit `distance_km` and `estimated_hours` if empty string; call `useCreateRoute` or `useUpdateRoute` based on `defaultValues?.id`; surface `code` backend uniqueness error via `form.setError('code', ...)` in the mutation `onError` handler; show loading state on submit button while mutation is pending

- [x] 5. Create `components/routes/route-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-lg overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `routeId?: number`; when `routeId` is provided call `useRoute(routeId)` inside the sheet; show centered spinner/skeleton while `isLoading`; once resolved render `RouteForm` with `defaultValues={routeData}` and `onSuccess={() => onOpenChange(false)}`; when `routeId` is undefined (create mode) render `RouteForm` with no `defaultValues` immediately; title: "Nueva ruta" (create) or "Editar ruta" (edit)

- [x] 6. Create `components/routes/route-delete-dialog.tsx` — shadcn `AlertDialog`; props: `routeName: string`, `routeId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description must warn about cascade: `¿Eliminar la ruta "${routeName}"? Se eliminarán también todas las paradas asociadas. Esta acción no se puede deshacer.`; on confirm call `useDeleteRoute(() => onOpenChange(false)).mutate(routeId)`; both AlertDialogAction and AlertDialogCancel disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 7. Create `app/(dashboard)/routes/page.tsx` — `'use client'`; local state:
  - `searchInput: string` (raw input value)
  - `search: string` (debounced 300ms, resets `page` to 0 on change)
  - `page: number` (0-indexed, default 0)
  - `pageSize: number` (default 20)
  - `ordering: string` (default `'name'`)
  - `sheetOpen: boolean`
  - `selectedRouteId: number | undefined`
  - `deleteDialogOpen: boolean`
  - `routeToDeleteId: number | null`
  - `routeToDeleteName: string`
  - Calls `useRoutes({ page: page + 1, page_size: pageSize, search: search || undefined, ordering })`
  - Computes `pageCount = Math.ceil((data?.count ?? 0) / pageSize)`
  - Uses `useMemo` for columns, `useCallback` for all handlers
  - Renders page heading "Rutas" and subtitle "Gestiona las rutas de entrega"
  - `onView(id)` handler uses `router.push(`/routes/${id}`)` (import `useRouter` from `next/navigation`)

- [x] 8. Wire the toolbar in `app/(dashboard)/routes/page.tsx`: pass a `toolbar` function rendering `DataTableToolbar` with a controlled `Input` (bound to `searchInput`, `placeholder="Buscar por nombre o código…"`) and a "Nueva ruta" `Button` (with `Plus` icon from `lucide-react`) that sets `selectedRouteId` to `undefined` and opens the sheet

- [x] 9. Wire row actions via the `ColumnActions` interface in `app/(dashboard)/routes/page.tsx`: `onEdit(id, name)` sets `selectedRouteId = id` and opens sheet; `onDelete(id, name)` sets `routeToDeleteId = id`, `routeToDeleteName = name`, and opens delete dialog; `onView(id)` calls `router.push(`/routes/${id}`)`; `handleSheetOpenChange` clears `selectedRouteId` when sheet closes

- [x] 10. Create `components/routes/route-info-card.tsx` — receives `route: Route` prop; renders a shadcn `Card` with two sections: header (code badge + name + is_active Badge) and content grid showing: origin_city → destination_city, distance_km (display as `parseFloat(route.distance_km).toFixed(2) + ' km'` or "—" if null), estimated_hours (display as `route.estimated_hours + ' h'` or "—" if null); also render an "Editar ruta" `Button` with `Pencil` icon that, when clicked, opens the route edit sheet (parent page owns the sheet state; pass `onEdit` callback as prop)

- [x] 11. Create `components/routes/stops-table.tsx` — receives `stops: RouteStop[]`, `onEdit: (stop: RouteStop) => void`, `onDelete: (stop: RouteStop) => void`; renders a shadcn `Table` (not the DataTable wrapper) with columns: `#` (order), `Parada` (stop_name), `Llegada estimada (h)`, `Notas`, actions; stops are already sorted by `order` ascending from the API response (re-sort client-side: `[...stops].sort((a, b) => a.order - b.order)` to be safe); "Editar" uses `Button variant="ghost" size="sm"` with `Pencil` icon; "Eliminar" uses `Button variant="ghost" size="sm" className="text-destructive"` with `Trash2` icon; show empty state row "Sin paradas. Agrega la primera parada." when `stops.length === 0`

- [x] 12. Create `components/routes/stop-form.tsx` — `react-hook-form` + `zod` form using `stopSchema`; accepts `defaultValues?: RouteStop`, `routeId: number`, and `onSuccess: () => void`; fields in order: `stop_name` (text), `order` (number input, min=1, step=1; use `valueAsNumber: true` in register), `estimated_arrival_hours` (text, optional), `notes` (textarea, optional); on submit: omit `estimated_arrival_hours` if empty string, omit `notes` if empty string; call `useCreateStop` or `useUpdateStop` based on `defaultValues?.id`; surface `order` backend uniqueness error via `form.setError('order', { message: errors.order[0] })` in the `onError` handler; show loading state on submit button while mutation is pending

- [x] 13. Create `components/routes/stop-sheet.tsx` — shadcn `Sheet` (`side="right"`, `className="w-full sm:max-w-md overflow-y-auto"`); props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `routeId: number`, `stop?: RouteStop`; when `stop` is provided, render `StopForm` with `defaultValues={stop}` (pre-populated for edit); when `stop` is undefined, render `StopForm` with no `defaultValues` (add mode); title: "Agregar parada" (add) or "Editar parada" (edit); `onSuccess={() => onOpenChange(false)}`

- [x] 14. Create `components/routes/stop-delete-dialog.tsx` — shadcn `AlertDialog`; props: `stopName: string`, `routeId: number`, `stopId: number | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`; description: `¿Eliminar la parada "${stopName}"? Esta acción no se puede deshacer.`; on confirm call `useDeleteStop(() => onOpenChange(false)).mutate({ routeId, stopId })`; both buttons disabled while `isPending`; AlertDialogAction has `variant="destructive"`

- [x] 15. Create `app/(dashboard)/routes/[id]/page.tsx` — `'use client'`; receives `params: { id: string }`; parses `routeId = parseInt(params.id, 10)`; calls `useRoute(routeId)`; local state:
  - `stopSheetOpen: boolean`
  - `selectedStop: RouteStop | undefined` (undefined = add mode)
  - `stopDeleteDialogOpen: boolean`
  - `stopToDelete: RouteStop | null`
  - `routeSheetOpen: boolean` (for editing the route itself from the detail page)
  - Show loading state (spinner or skeleton) while `isLoading`; show error message if `isError`; when loaded, render: a "Volver a rutas" `Button` (with `ArrowLeft` icon, navigates with `router.back()` or `router.push('/routes')`), page heading (route name), `RouteInfoCard` with `route` data and `onEdit={() => setRouteSheetOpen(true)}`, a section heading "Paradas" with "Agregar parada" `Button` (opens stop sheet in add mode), `StopsTable` receiving `route.stops`, `onEdit`, and `onDelete` callbacks; `RouteSheet` (for editing the route), `StopSheet`, `StopDeleteDialog`

- [x] 16. Modify `components/layout/sidebar.tsx` — import `Route` (or `MapPin`) icon from `lucide-react` and add `{ href: '/routes', label: 'Rutas', icon: Route }` to `navLinks` after the Vehículos entry

- [ ] 17. Manual smoke test (SKIPPED — requires live backend): (a) `/routes` loads paginated list with correct columns (code, name, origin→destination, is_active badge, actions — no distance column in list), (b) search by name or code filters results, (c) "Nueva ruta" opens empty sheet — all form fields render including Switch for is_active, form submission creates route (HTTP 201) and row appears, (d) "Editar" opens sheet with route data pre-populated, PATCH succeeds and row updates, (e) "Eliminar" shows confirm dialog naming the route AND warning about stops cascade deletion, on confirm hard-deletes (HTTP 204) and row disappears, (f) "Ver detalle" navigates to `/routes/{id}`, (g) detail page shows route info card with all fields including distance and estimated_hours, (h) stops table shows existing stops ordered by `order`, (i) "Agregar parada" opens stop sheet — form submission creates stop (HTTP 201) and stop appears in table without page reload, (j) "Editar" on a stop opens stop sheet pre-populated, PATCH succeeds and stop updates, (k) duplicate `order` value shows field-level validation error from backend, (l) "Eliminar" on a stop shows confirm dialog, on confirm removes stop and table updates, (m) is_active badge colors: active=green, inactive=gray, (n) "Volver a rutas" returns to the list, (o) "Rutas" nav link highlights when on `/routes` or `/routes/[id]`, (p) pagination controls work on the list page

---

## Validation criteria

All tasks 1–16 are independently verifiable by static analysis (file existence, exports, type correctness, hook signatures, component props). Task 17 requires a live backend.

Build must pass with `npm run build` (zero TypeScript errors). Lint must pass with `npm run lint` (zero errors).

---

## Validation Summary

**Date:** 2026-05-28
**Build:** Pass — zero TypeScript errors, all 13 routes compiled successfully
**Lint:** Pass — zero errors (3 warnings in shared infrastructure files unrelated to Routes module)
**Tasks:** 16/16 passed (task 17 skipped — manual smoke test)

### Failures

None — all tasks pass.
