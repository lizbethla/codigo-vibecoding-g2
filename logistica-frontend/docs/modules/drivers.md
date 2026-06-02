# Module: Drivers (Conductores)

**Base path:** `/api/v1/drivers/`  
**Purpose:** Vehicle drivers/personnel assigned to deliveries.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Driver, DriverCreate, DriverUpdate, DriverStatus, LicenseType, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List drivers
```http
GET /api/v1/drivers/
```
Query params: `?page=`, `?page_size=`, `?search=<national_id|license_number>`, `?ordering=status|license_expiry|created_at`

Response: `PaginatedResponse<DriverSummary>` (id, user: {id, username, first_name, last_name, email}, license_type, status, national_id)

### Get driver
```http
GET /api/v1/drivers/{id}/
```
Response: `Driver` (full object)

### Create driver
```http
POST /api/v1/drivers/
Content-Type: application/json
```
Body: `DriverCreate`  
Required fields: `user`, `license_number`, `license_type`, `license_expiry`, `phone`, `national_id`  
Note: `user` must be an existing Django User id (one-to-one — one Driver per User)  
Response: `Driver` (HTTP 201)

### Full update
```http
PUT /api/v1/drivers/{id}/
```

### Partial update
```http
PATCH /api/v1/drivers/{id}/
```
Common use: change `status` when assigning/releasing driver

### Delete
```http
DELETE /api/v1/drivers/{id}/
```
Response: HTTP 204

## License type values

| Value | Label |
|-------|-------|
| `A` | Motocicletas |
| `B` | Vehículos livianos |
| `C` | Vehículos pesados |
| `CE` | Vehículos articulados pesados |
| `BTP` | Transporte público |

## Status values

| Value | Label | Meaning |
|-------|-------|---------|
| `AVAILABLE` | Disponible | Ready for assignment |
| `ON_ROUTE` | En ruta | Currently on a delivery |
| `OFF_DUTY` | Fuera de servicio | Not working |
| `SUSPENDED` | Suspendido | Suspended — cannot be assigned |

## Search fields
`national_id`, `license_number`

## Ordering fields
`status`, `license_expiry`, `created_at`
