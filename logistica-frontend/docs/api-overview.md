# API Overview — Logística Backend

**Backend repo:** `../logistica-api-claudecode`  
**Framework:** Django 6.0 + Django REST Framework 3.17  
**Base URL (dev):** `http://127.0.0.1:8000/api/v1`  
**Interactive docs:** `http://127.0.0.1:8000/api/schema/swagger-ui/`

---

## Authentication

All endpoints require JWT Bearer authentication.

### Obtain tokens

```http
POST /api/v1/auth/token/
Content-Type: application/json

{ "username": "string", "password": "string" }
```

Response:
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

- Access token lifetime: **60 minutes**
- Refresh token lifetime: **7 days**

### Refresh access token

```http
POST /api/v1/auth/token/refresh/
Content-Type: application/json

{ "refresh": "<refresh_token>" }
```

### Verify token

```http
POST /api/v1/auth/token/verify/
Content-Type: application/json

{ "token": "<access_token>" }
```

### Sending the token

All protected requests must include:

```
Authorization: Bearer <access_token>
```

---

## Pagination

All list endpoints are paginated.

| Query param | Default | Max |
|-------------|---------|-----|
| `page` | 1 | — |
| `page_size` | 20 | 100 |

List response envelope:
```json
{
  "count": 150,
  "next": "http://127.0.0.1:8000/api/v1/customers/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Filtering & Ordering

Each module supports:

| Param | Example | Notes |
|-------|---------|-------|
| `search` | `?search=John` | Full-text on module-specific fields |
| `ordering` | `?ordering=-created_at` | Prefix `-` for descending |
| Module-specific filters | varies | See each module doc |

---

## Response Format

**Success:** JSON object or array (varies by endpoint)  
**Errors:**
```json
{ "detail": "error message" }
{ "field_name": ["validation error"] }
```

---

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Auth | `/auth/token/` | JWT token management |
| Customers | `/customers/` | Companies/individuals generating shipments |
| Suppliers | `/suppliers/` | Companies selling products |
| Products | `/products/` | Tech products to be shipped |
| Warehouses | `/warehouses/` | Storage facilities |
| Drivers | `/drivers/` | Vehicle drivers/personnel |
| Vehicles | `/vehicles/` | Delivery vehicles |
| Routes | `/routes/` | Delivery routes + stops |
| Shipments | `/shipments/` | Core entity — delivery orders |

Full details: see `docs/modules/<module>.md`  
TypeScript types: see `docs/schemas/index.ts`

---

## Common Patterns

- All `created_at` / `updated_at` fields are **read-only** (auto-set by backend)
- `tracking_code` on shipments is **auto-generated** (format: `LOG-YYYY-XXXX`)
- `country` fields default to `"Colombia"` when omitted
- Decimal/money fields come as **strings** in JSON — parse with `parseFloat()` or keep as string for display
- Foreign key fields return **summary objects** in list views, **full nested objects** in detail views
- All timestamps are UTC; backend timezone is `America/Bogota`
- Nested resources (stops, shipment products) use `/parent/{id}/child/` URL pattern
