# Module: Products (Productos)

**Base path:** `/api/v1/products/`  
**Purpose:** Technology products that can be added to shipments.  
**Auth:** Bearer token required on all endpoints.

## TypeScript type

```ts
import { Product, ProductCreate, ProductUpdate, ProductCategory, PaginatedResponse } from '@/docs/schemas';
```

## Endpoints

### List products
```http
GET /api/v1/products/
```
Query params: `?page=`, `?page_size=`, `?search=<name|sku>`, `?ordering=name|unit_price|stock_quantity|created_at`

Response: `PaginatedResponse<ProductSummary>` (id, sku, name, category, unit_price, stock_quantity, is_active)

### Get product
```http
GET /api/v1/products/{id}/
```
Response: `Product` (full object, includes nested `supplier: { id, name }`)

### Create product
```http
POST /api/v1/products/
Content-Type: application/json
```
Body: `ProductCreate`  
Required fields: `sku`, `name`, `category`, `unit_price`  
Response: `Product` (HTTP 201)

### Full update
```http
PUT /api/v1/products/{id}/
```

### Partial update
```http
PATCH /api/v1/products/{id}/
```

### Delete
```http
DELETE /api/v1/products/{id}/
```
Response: HTTP 204

## Category values

| Value | Label |
|-------|-------|
| `LAPTOP` | Portátil |
| `DESKTOP` | Escritorio |
| `MOBILE` | Móvil |
| `TABLET` | Tableta |
| `PERIPHERAL` | Periférico |
| `NETWORKING` | Redes |
| `STORAGE` | Almacenamiento |
| `OTHER` | Otro |

## Field notes

| Field | Notes |
|-------|-------|
| `unit_price` | Decimal string — display with `parseFloat(unit_price).toFixed(2)` |
| `weight_kg` | Decimal string, defaults to `"0"` |
| `dimensions_cm` | Free-text format, e.g. `"30x20x10"` |
| `supplier` | Optional FK to Supplier id; detail view returns `{ id, name }` |
| `stock_quantity` | Integer, updated by backend operations |

## Search fields
`name`, `sku`

## Ordering fields
`name`, `unit_price`, `stock_quantity`, `created_at`
