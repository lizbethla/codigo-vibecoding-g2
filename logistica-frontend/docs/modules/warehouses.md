# Module: Warehouses (Almacenes)

**Base path:** `/api/v1/warehouses/`  
**Purpose:** Storage facilities that serve as origin points for shipments.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseSummary, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List warehouses
```http
GET /api/v1/warehouses/
```
Query params: `?page=`, `?page_size=`, `?search=<name|code>`, `?ordering=name|code|city|created_at`

Response: `PaginatedResponse<WarehouseSummary>` (id, code, name, city, country, is_active)

### Get warehouse
```http
GET /api/v1/warehouses/{id}/
```
Response: `Warehouse` (full object, includes nested `manager: { id, username, first_name, last_name }`)

### Create warehouse
```http
POST /api/v1/warehouses/
Content-Type: application/json
```
Body: `WarehouseCreate`  
Required fields: `name`, `code`, `address`, `city`  
Response: `Warehouse` (HTTP 201)

### Full update
```http
PUT /api/v1/warehouses/{id}/
```

### Partial update
```http
PATCH /api/v1/warehouses/{id}/
```

### Delete
```http
DELETE /api/v1/warehouses/{id}/
```
Response: HTTP 204

## Field notes

| Field | Notes |
|-------|-------|
| `code` | Short unique identifier (e.g. `"BOG-01"`), max 20 chars |
| `manager` | Optional FK to Django User id |
| `latitude` / `longitude` | Decimal strings; useful for map display |
| `capacity_m3` | Storage capacity in cubic meters; optional |

## Search fields
`name`, `code`

## Ordering fields
`name`, `code`, `city`, `created_at`
