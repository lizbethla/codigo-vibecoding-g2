# Module: Routes (Rutas)

**Base paths:**  
- Routes: `/api/v1/routes/`  
- Stops (nested): `/api/v1/routes/{route_pk}/stops/`  
**Purpose:** Define delivery routes and their ordered waypoints/stops.  
**Auth:** Bearer token required on all endpoints.

## TypeScript types

```ts
import { Route, RouteCreate, RouteUpdate, RouteStop, RouteStopCreate, RouteStopUpdate, RouteSummary, PaginatedResponse } from '@/docs/schemas';
```

## Route Endpoints

### List routes
```http
GET /api/v1/routes/
```
Query params: `?page=`, `?page_size=`, `?search=<name|code>`, `?ordering=name|code|origin_city|destination_city|created_at`

Response: `PaginatedResponse<RouteSummary>` (id, code, name, origin_city, destination_city, is_active)

### Get route (with stops)
```http
GET /api/v1/routes/{id}/
```
Response: `Route` (full object — includes nested `stops[]` array ordered by `order` field)

### Create route
```http
POST /api/v1/routes/
Content-Type: application/json
```
Body: `RouteCreate`  
Required fields: `name`, `code`, `origin_city`, `destination_city`  
Response: `Route` with empty `stops: []` (HTTP 201)

### Full update
```http
PUT /api/v1/routes/{id}/
```
Note: does NOT modify stops — use nested `/stops/` endpoints

### Partial update
```http
PATCH /api/v1/routes/{id}/
```

### Delete
```http
DELETE /api/v1/routes/{id}/
```
**Warning:** Cascade deletes all stops for this route.  
Response: HTTP 204

---

## Route Stop Endpoints

### List stops for a route
```http
GET /api/v1/routes/{route_pk}/stops/
```
Response: `PaginatedResponse<RouteStop>` ordered by `order` field

### Add stop to route
```http
POST /api/v1/routes/{route_pk}/stops/
Content-Type: application/json
```
Body: `RouteStopCreate`  
Required fields: `stop_name`, `order`  
Constraint: `order` must be unique per route  
Response: `RouteStop` (HTTP 201)  
Error: `{ "order": ["Ya existe una parada con este número de orden en esta ruta."] }`

### Get stop
```http
GET /api/v1/routes/{route_pk}/stops/{pk}/
```

### Full update stop
```http
PUT /api/v1/routes/{route_pk}/stops/{pk}/
```

### Partial update stop
```http
PATCH /api/v1/routes/{route_pk}/stops/{pk}/
```

### Delete stop
```http
DELETE /api/v1/routes/{route_pk}/stops/{pk}/
```
Response: HTTP 204

## Field notes

| Field | Notes |
|-------|-------|
| `code` | Short unique route identifier, max 30 chars |
| `distance_km` | Decimal string; optional |
| `estimated_hours` | Decimal string; total route time estimate |
| `stops[].order` | Must be unique per route; use 1, 2, 3... |
| `stops[].estimated_arrival_hours` | Hours from departure start |

## Search fields (routes)
`name`, `code`

## Ordering fields (routes)
`name`, `code`, `origin_city`, `destination_city`, `created_at`
