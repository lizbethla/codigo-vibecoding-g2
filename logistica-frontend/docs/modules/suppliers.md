# Module: Suppliers (Proveedores)

**Base path:** `/api/v1/suppliers/`  
**Purpose:** Companies that sell/provide products to be shipped.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Supplier, SupplierCreate, SupplierUpdate, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List suppliers
```http
GET /api/v1/suppliers/
```
Query params: `?page=`, `?page_size=`, `?search=<name|email>`, `?ordering=name|created_at`

Response: `PaginatedResponse<SupplierSummary>` (id, name, email, country, is_active)

### Get supplier
```http
GET /api/v1/suppliers/{id}/
```
Response: `Supplier` (full object)

### Create supplier
```http
POST /api/v1/suppliers/
Content-Type: application/json
```
Body: `SupplierCreate`  
Required fields: `name`, `email`  
Response: `Supplier` (HTTP 201)

### Full update
```http
PUT /api/v1/suppliers/{id}/
```
Body: `SupplierCreate` (all required)

### Partial update
```http
PATCH /api/v1/suppliers/{id}/
```
Body: `SupplierUpdate` (any subset)

### Delete
```http
DELETE /api/v1/suppliers/{id}/
```
Response: HTTP 204

## Field notes

| Field | Notes |
|-------|-------|
| `contact_name` | Contact person name, optional |
| `tax_id` | NIT; unique, optional |
| `country` | Defaults to `"Colombia"` |

## Search fields
`name`, `email`

## Ordering fields
`name`, `created_at`
