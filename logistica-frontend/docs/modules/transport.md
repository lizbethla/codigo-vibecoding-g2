# Module: Vehicles / Transport (Vehículos)

**Base path:** `/api/v1/vehicles/`  
**Purpose:** Delivery vehicles assigned to shipments.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Vehicle, VehicleCreate, VehicleUpdate, VehicleType, VehicleStatus, FuelType, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List vehicles
```http
GET /api/v1/vehicles/
```
Query params: `?page=`, `?page_size=`, `?search=<plate>`, `?ordering=plate|year|status|created_at`

Response: `PaginatedResponse<VehicleSummary>` (id, plate, vehicle_type, brand, model, year, status)

### Get vehicle
```http
GET /api/v1/vehicles/{id}/
```
Response: `Vehicle` (full object, includes nested `driver: { id, national_id, license_number, license_type, full_name }`)

### Create vehicle
```http
POST /api/v1/vehicles/
Content-Type: application/json
```
Body: `VehicleCreate`  
Required fields: `plate`, `vehicle_type`, `brand`, `model`, `year`, `capacity_kg`  
Response: `Vehicle` (HTTP 201)

### Full update
```http
PUT /api/v1/vehicles/{id}/
```

### Partial update
```http
PATCH /api/v1/vehicles/{id}/
```
Common use: change `status` or assign `driver`

### Delete
```http
DELETE /api/v1/vehicles/{id}/
```
Response: HTTP 204

## Vehicle type values

| Value | Label |
|-------|-------|
| `MOTORCYCLE` | Motocicleta |
| `VAN` | Furgoneta |
| `TRUCK` | Camión |
| `HEAVY_TRUCK` | Camión pesado |
| `REFRIGERATED_TRUCK` | Camión refrigerado |
| `CONTAINER` | Contenedor |

## Status values

| Value | Label | Meaning |
|-------|-------|---------|
| `AVAILABLE` | Disponible | Ready for assignment |
| `IN_USE` | En uso | Currently on route |
| `MAINTENANCE` | En mantenimiento | Under maintenance |
| `RETIRED` | Retirado | Decommissioned |

## Fuel type values

`GASOLINE` | `DIESEL` | `ELECTRIC` | `HYBRID` | `GAS`  
Default: `DIESEL`

## Field notes

| Field | Notes |
|-------|-------|
| `plate` | License plate; unique |
| `capacity_kg` | Decimal string — max load weight |
| `capacity_m3` | Decimal string — max volume; optional |
| `driver` | Optional FK to Driver id |

## Search fields
`plate`

## Ordering fields
`plate`, `year`, `status`, `created_at`
