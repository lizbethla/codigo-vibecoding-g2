# Module: Shipments (Envíos)

**Base paths:**  
- Shipments: `/api/v1/shipments/`  
- Products (nested): `/api/v1/shipments/{shipment_pk}/products/`  
**Purpose:** Core business entity — delivery orders from warehouse to recipient.  
**Auth:** Bearer token required on all endpoints.

## TypeScript types

```ts
import {
  Shipment, ShipmentCreate, ShipmentUpdate,
  ShipmentStatus, ShipmentPriority,
  ShipmentProduct, ShipmentProductCreate, ShipmentProductUpdate,
  PaginatedResponse
} from '@/docs/schemas';
```

## Shipment Endpoints

### List shipments
```http
GET /api/v1/shipments/
```
Query params: `?page=`, `?page_size=`, `?search=<tracking_code|recipient_name>`, `?ordering=scheduled_date|created_at|total_cost|status`

Response: `PaginatedResponse<ShipmentSummary>` (id, tracking_code, customer summary, status, priority, destination_city, scheduled_date, total_cost)

### Get shipment (with products)
```http
GET /api/v1/shipments/{id}/
```
Response: `Shipment` (full object — includes nested `shipment_products[]` array, all FK summaries)

### Create shipment
```http
POST /api/v1/shipments/
Content-Type: application/json
```
Body: `ShipmentCreate`  
Required fields: `customer`, `origin_warehouse`, `origin_address`, `destination_address`, `destination_city`, `recipient_name`, `scheduled_date`  
Note: `tracking_code` is **auto-generated** — do NOT send it  
Response: `Shipment` with generated `tracking_code` (HTTP 201)

### Full update
```http
PUT /api/v1/shipments/{id}/
```
Note: does NOT modify shipment_products — use nested `/products/` endpoints

### Partial update
```http
PATCH /api/v1/shipments/{id}/
```
Common use: update `status`, assign `vehicle`, set `actual_delivery`

### Delete
```http
DELETE /api/v1/shipments/{id}/
```
**Warning:** Cascade deletes all shipment products.  
Response: HTTP 204

---

## Shipment Product Endpoints

### List products in shipment
```http
GET /api/v1/shipments/{shipment_pk}/products/
```
Response: `PaginatedResponse<ShipmentProduct>` (id, product summary, quantity, unit_price, line_total, notes)

### Add product to shipment
```http
POST /api/v1/shipments/{shipment_pk}/products/
Content-Type: application/json
```
Body: `ShipmentProductCreate`  
Required fields: `product`, `quantity`, `unit_price`  
Constraint: each product unique per shipment  
`line_total` is **auto-calculated** by backend (`quantity × unit_price`)  
Response: `ShipmentProduct` (HTTP 201)  
Error: `{ "product": ["Este producto ya está registrado en este envío."] }`

### Get shipment product
```http
GET /api/v1/shipments/{shipment_pk}/products/{pk}/
```

### Full update shipment product
```http
PUT /api/v1/shipments/{shipment_pk}/products/{pk}/
```

### Partial update shipment product
```http
PATCH /api/v1/shipments/{shipment_pk}/products/{pk}/
```

### Remove product from shipment
```http
DELETE /api/v1/shipments/{shipment_pk}/products/{pk}/
```
Response: HTTP 204

---

## Status values

| Value | Label | Transition |
|-------|-------|-----------|
| `PENDING` | Pendiente | Initial state |
| `CONFIRMED` | Confirmado | Confirmed, awaiting pickup |
| `IN_WAREHOUSE` | En almacén | Stored at origin warehouse |
| `IN_TRANSIT` | En tránsito | Picked up, on the way |
| `OUT_FOR_DELIVERY` | En reparto | Last-mile delivery |
| `DELIVERED` | Entregado | Terminal — success |
| `FAILED` | Fallido | Terminal — delivery failed |
| `CANCELLED` | Cancelado | Terminal — cancelled |
| `RETURNED` | Devuelto | Terminal — returned to origin |

## Priority values

| Value | Label |
|-------|-------|
| `LOW` | Baja |
| `NORMAL` | Normal (default) |
| `HIGH` | Alta |
| `URGENT` | Urgente |

## Field notes

| Field | Notes |
|-------|-------|
| `tracking_code` | Read-only; auto-generated as `LOG-YYYY-XXXX` |
| `customer` | FK to Customer id; detail view returns `{ id, name, customer_type }` |
| `origin_warehouse` | FK to Warehouse id; detail view returns `{ id, code, name, city }` |
| `route` / `vehicle` | Optional; can be assigned after creation via PATCH |
| `total_cost` | Should equal `base_cost + tax_amount`; currently set manually by client |
| `actual_delivery` | ISO datetime string; set when status = `DELIVERED` |
| `line_total` | Read-only on ShipmentProduct; auto-calculated |

## Search fields (shipments)
`tracking_code`, `recipient_name`

## Ordering fields (shipments)
`scheduled_date`, `created_at`, `total_cost`, `status`
