# MVP — Logística Frontend

All modules follow SDD. Work **one module at a time**. Never start the next module until the current one passes validation.

Update this file status column as each module progresses.

---

## Module Order & Status

| # | Module | Status | Spec file | FK dependencies |
|---|--------|--------|-----------|----------------|
| 1 | Auth | ✅ Done | docs/specs/auth-spec.md | None |
| 2 | Customers | ✅ Done | docs/specs/customers-spec.md | Auth |
| 3 | Suppliers | ✅ Done | docs/specs/suppliers-spec.md | Auth |
| 4 | Warehouses | ✅ Done | docs/specs/warehouses-spec.md | Auth |
| 5 | Products | ✅ Done | docs/specs/products-spec.md | Suppliers |
| 6 | Drivers | ✅ Done | docs/specs/drivers-spec.md | Auth (User) |
| 7 | Vehicles | ✅ Done | docs/specs/vehicles-spec.md | Drivers |
| 8 | Routes | ✅ Done | docs/specs/routes-spec.md | Auth |
| 9 | Shipments | ✅ Done | docs/specs/shipments-spec.md | Customers, Warehouses, Routes, Vehicles |

## Status legend

| Symbol | Meaning |
|--------|---------|
| ⏳ Pending | Not started |
| 🔄 In Progress | Spec being written or implement running |
| 👁 Awaiting Approval | Spec written — human must approve before implement |
| 🛠 Implementing | Spec approved, implement agent running |
| 🔍 Validating | Implement done, validator agent running |
| ✅ Done | Validator confirmed all tasks pass |

---

## Module Details

### 1. Auth
**Backend:** `POST /api/v1/auth/token/` · `POST /api/v1/auth/token/refresh/`  
**Scope:**
- Login page at `/login` — username + password form → obtains JWT pair
- Stores tokens in Zustand (`useAuthStore`) → persisted to localStorage
- Protected route layout at `app/(dashboard)/layout.tsx` → redirects to `/login` if no token
- Axios interceptor already handles token injection and auto-refresh (already wired in `lib/api.ts`)
- No register/forgot-password (backend only has token endpoints)

**Pages:** `/login`  
**Complexity:** Medium — JWT flow, Zustand integration, route protection

---

### 2. Customers (Clientes)
**Backend docs:** `@docs/modules/customers.md`  
**Scope:**
- List page with TanStack Table: name, customer_type badge, email, is_active badge, actions
- Create / Edit form in Dialog or Sheet — all Customer fields
- Delete with confirm dialog
- Search by name/email, ordering by name/created_at
- Soft-delete toggle (PATCH `is_active: false`) as alternative to DELETE

**Pages:** `/customers`  
**Complexity:** Standard CRUD

---

### 3. Suppliers (Proveedores)
**Backend docs:** `@docs/modules/suppliers.md`  
**Scope:**
- List page with TanStack Table: name, contact_name, email, country, is_active badge, actions
- Create / Edit form — all Supplier fields
- Delete with confirm dialog
- Search by name/email

**Pages:** `/suppliers`  
**Complexity:** Standard CRUD

---

### 4. Warehouses (Almacenes)
**Backend docs:** `@docs/modules/warehouses.md`  
**Scope:**
- List page with TanStack Table: code, name, city, country, capacity_m3, is_active badge, actions
- Create / Edit form — all Warehouse fields (lat/long optional)
- Delete with confirm dialog
- Search by name/code

**Pages:** `/warehouses`  
**Complexity:** Standard CRUD

---

### 5. Products (Productos)
**Backend docs:** `@docs/modules/products.md`  
**Scope:**
- List page with TanStack Table: sku, name, category badge, unit_price, stock_quantity, is_active badge, actions
- Create / Edit form — includes supplier select (fetch from `/suppliers/`) and category select
- Delete with confirm dialog
- Search by name/sku, filter by category

**Pages:** `/products`  
**Complexity:** CRUD + supplier select dropdown (depends on Suppliers module)

---

### 6. Drivers (Conductores)
**Backend docs:** `@docs/modules/drivers.md`  
**Scope:**
- List page with TanStack Table: name (from user), national_id, license_type badge, license_expiry, status badge, actions
- Create / Edit form — all Driver fields (license_expiry date picker, status select)
- Status badge colors: AVAILABLE=green, ON_ROUTE=blue, OFF_DUTY=gray, SUSPENDED=red
- Delete with confirm dialog
- License expiry warning badge if expiry < 30 days

**Pages:** `/drivers`  
**Complexity:** CRUD + status enum badges + license expiry highlighting

---

### 7. Vehicles (Vehículos)
**Backend docs:** `@docs/modules/transport.md`  
**Scope:**
- List page with TanStack Table: plate, vehicle_type badge, brand/model/year, status badge, driver name, actions
- Create / Edit form — includes driver select (fetch from `/drivers/?status=AVAILABLE`) and vehicle_type/fuel_type selects
- Status badge colors: AVAILABLE=green, IN_USE=blue, MAINTENANCE=yellow, RETIRED=gray
- Delete with confirm dialog

**Pages:** `/vehicles`  
**Complexity:** CRUD + driver select dropdown (depends on Drivers module)

---

### 8. Routes (Rutas)
**Backend docs:** `@docs/modules/routes.md`  
**Scope:**
- List page with TanStack Table: code, name, origin_city → destination_city, distance_km, is_active badge, actions
- Create / Edit form for Route fields
- Route detail view — expandable stops list, add/edit/delete stops (nested `/routes/{id}/stops/`)
- Stop form: stop_name, order (integer), estimated_arrival_hours, notes
- Stops ordered by `order` field; unique order per route enforced by backend

**Pages:** `/routes`, `/routes/[id]` (detail + stops management)  
**Complexity:** CRUD + nested resource management

---

### 9. Shipments (Envíos)
**Backend docs:** `@docs/modules/shipments.md`  
**Scope:**
- List page with TanStack Table: tracking_code, customer name, status badge (colored), priority badge, destination_city, scheduled_date, total_cost, actions
- Create form — customer select, warehouse select, optional route/vehicle select, all address fields, recipient fields, scheduled_date
- Edit form — update status, assign route/vehicle, update costs
- Shipment detail page — shows full info + products list
- Add/remove products from shipment (nested `/shipments/{id}/products/`)
- Product form: product select (from `/products/`), quantity, unit_price (auto-filled from product, editable)
- Status flow badges: PENDING=gray, CONFIRMED=blue, IN_WAREHOUSE=indigo, IN_TRANSIT=orange, OUT_FOR_DELIVERY=yellow, DELIVERED=green, FAILED=red, CANCELLED=red, RETURNED=purple
- tracking_code is read-only (auto-generated)

**Pages:** `/shipments`, `/shipments/[id]`  
**Complexity:** High — depends on all other modules, nested products, status flow

---

## Shared Infrastructure (already built)

| File | Purpose |
|------|---------|
| `lib/api.ts` | Axios instance + auth interceptor + token refresh |
| `lib/query-client.ts` | TanStack Query client config (5min stale, 30min gc) |
| `stores/auth.store.ts` | Zustand auth store (token, user, logout) |
| `providers/query-provider.tsx` | QueryClientProvider wrapper |
| `providers/app-providers.tsx` | Root providers wrapper (used in `app/layout.tsx`) |
| `components/data-table/data-table.tsx` | Generic TanStack Table wrapper |
| `components/data-table/data-table-pagination.tsx` | Pagination controls |
| `components/data-table/data-table-toolbar.tsx` | Search + action bar |
| `docs/schemas/index.ts` | TypeScript types for all API entities |
