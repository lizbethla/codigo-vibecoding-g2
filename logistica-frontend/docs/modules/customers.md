# Module: Customers (Clientes)

**Base path:** `/api/v1/customers/`  
**Purpose:** Companies or individuals that generate shipments.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Customer, CustomerCreate, CustomerUpdate, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List customers
```http
GET /api/v1/customers/
```
Query params: `?page=`, `?page_size=`, `?search=<name|email>`, `?ordering=name|created_at`

Response: `PaginatedResponse<CustomerSummary>` (list includes id, name, customer_type, email, is_active)

### Get customer
```http
GET /api/v1/customers/{id}/
```
Response: `Customer` (full object)

### Create customer
```http
POST /api/v1/customers/
Content-Type: application/json
```
Body: `CustomerCreate`  
Required fields: `name`, `email`  
Response: `Customer` (HTTP 201)

### Full update
```http
PUT /api/v1/customers/{id}/
```
Body: `CustomerCreate` (all required fields)

### Partial update
```http
PATCH /api/v1/customers/{id}/
```
Body: `CustomerUpdate` (any subset)

### Delete
```http
DELETE /api/v1/customers/{id}/
```
Response: HTTP 204

## Field notes

| Field | Notes |
|-------|-------|
| `customer_type` | `COMPANY` or `INDIVIDUAL`, defaults to `COMPANY` |
| `tax_id` | NIT or cédula; unique, optional |
| `country` | Defaults to `"Colombia"` |
| `is_active` | Use PATCH to soft-delete (set `false`) instead of DELETE |

## Search fields
`name`, `email`

## Ordering fields
`name`, `created_at`
