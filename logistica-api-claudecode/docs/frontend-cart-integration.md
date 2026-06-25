# Guía de Integración — Carrito de Compras (Frontend)

Documento técnico para el equipo de frontend. Describe los endpoints disponibles, el flujo completo de compra y los contratos de request/response necesarios para implementar un carrito de compras.

**Base URL (desarrollo):** `http://localhost:8000`  
**Base URL (producción):** `https://<dominio>.railway.app`  
**Autenticación:** JWT Bearer token en header `Authorization`

---

## Tabla de Contenido

1. [Flujo completo de compra](#1-flujo-completo-de-compra)
2. [Autenticación](#2-autenticación)
3. [Listar productos](#3-listar-productos)
4. [Crear sesión de pago (Checkout)](#4-crear-sesión-de-pago-checkout)
5. [Historial de órdenes](#5-historial-de-órdenes)
6. [Páginas de retorno (success / cancel)](#6-páginas-de-retorno-success--cancel)
7. [Códigos de error](#7-códigos-de-error)
8. [Ejemplo de implementación React](#8-ejemplo-de-implementación-react)

---

## 1. Flujo completo de compra

```
[Usuario]                [Frontend]               [API]              [Stripe]
    │                        │                      │                    │
    │── login ──────────────►│                      │                    │
    │                        │── POST /auth/token ─►│                    │
    │                        │◄── { access, ... } ──│                    │
    │                        │                      │                    │
    │── browse products ────►│                      │                    │
    │                        │── GET /products/ ───►│                    │
    │                        │◄── { results: [...] }│                    │
    │                        │                      │                    │
    │── add to cart ────────►│ (estado local)       │                    │
    │── checkout ───────────►│                      │                    │
    │                        │── POST /payments/checkout/ ─────────────►│
    │                        │◄── { checkout_url, session_id, ... } ────│
    │                        │                      │                    │
    │◄── redirect ───────────│ window.location = checkout_url           │
    │                        │                      │                    │
    │── paga en Stripe ─────────────────────────────────────────────────►│
    │◄── redirige a success_url / cancel_url ────────────────────────────│
    │                        │                      │                    │
    │                        │── GET /payments/orders/ ────────────────►│
    │◄── orden confirmada ───│◄── { status: "COMPLETED", ... } ─────────│
```

**Puntos clave:**
- El frontend **nunca maneja datos de tarjeta** — Stripe Checkout es una página hosteada por Stripe.
- El estado de la orden se actualiza vía webhook (backend lo hace automáticamente).
- Para confirmar el pago, el frontend debe consultar `GET /payments/orders/` después del redirect.

---

## 2. Autenticación

### Login

```
POST /api/v1/auth/token/
Content-Type: application/json
```

**Request:**
```json
{
  "username": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response 200:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "username": "usuario",
  "email": "usuario@ejemplo.com",
  "is_superuser": false,
  "is_staff": false
}
```

**Almacenamiento del token:**
```javascript
// Guardar al hacer login
localStorage.setItem('access_token', data.access)
localStorage.setItem('refresh_token', data.refresh)

// Usar en cada request
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
}
```

### Renovar token (cuando el access expira en 60 min)

```
POST /api/v1/auth/token/refresh/
Content-Type: application/json
```

**Request:**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200:**
```json
{ "access": "<nuevo_access_token>" }
```

---

## 3. Listar productos

```
GET /api/v1/products/
Authorization: Bearer <access_token>
```

### Query params disponibles

| Param | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `page` | integer | `?page=2` | Número de página (default: 1) |
| `page_size` | integer | `?page_size=12` | Items por página (default: 20, max: 100) |
| `category` | string | `?category=LAPTOP` | Filtrar por categoría |
| `is_active` | boolean | `?is_active=true` | Solo productos activos |
| `search` | string | `?search=dell` | Búsqueda en nombre y SKU |
| `ordering` | string | `?ordering=unit_price` | Ordenar (prefijo `-` para descendente) |

### Categorías disponibles

| Valor | Descripción |
|-------|-------------|
| `LAPTOP` | Laptop |
| `DESKTOP` | Computador de escritorio |
| `MOBILE` | Móvil |
| `TABLET` | Tableta |
| `PERIPHERAL` | Periférico |
| `NETWORKING` | Redes |
| `STORAGE` | Almacenamiento |
| `OTHER` | Otro |

### Response 200

```json
{
  "count": 9,
  "next": "http://localhost:8000/api/v1/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 6,
      "sku": "LTAP-DELL-LAT5540",
      "name": "Dell Latitude 5540 14\" Business Laptop",
      "category": "LAPTOP",
      "unit_price": "1249.99",
      "stock_quantity": 15,
      "is_active": true
    },
    {
      "id": 7,
      "sku": "MOB-SAM-A54-5G",
      "name": "Samsung Galaxy A54 5G 128GB",
      "category": "MOBILE",
      "unit_price": "369.00",
      "stock_quantity": 40,
      "is_active": true
    }
  ]
}
```

### Detalle de un producto

```
GET /api/v1/products/{id}/
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "id": 6,
  "sku": "LTAP-DELL-LAT5540",
  "name": "Dell Latitude 5540 14\" Business Laptop",
  "description": "Intel Core i7-1365U, 16GB RAM DDR5, 512GB NVMe SSD...",
  "category": "LAPTOP",
  "unit_price": "1249.99",
  "weight_kg": "1.560",
  "dimensions_cm": "32.4 x 21.6 x 1.87",
  "stock_quantity": 15,
  "is_active": true,
  "supplier": {
    "id": 1,
    "name": "Proveedor Tecnología S.A."
  },
  "created_at": "2026-06-23T21:00:00Z",
  "updated_at": "2026-06-23T21:00:00Z"
}
```

> **Nota:** `unit_price` viene como string decimal. Convertir con `parseFloat(product.unit_price)` para cálculos en el frontend.

---

## 4. Crear sesión de pago (Checkout)

Este es el endpoint central del carrito. Recibe todos los ítems seleccionados y retorna una URL de pago de Stripe.

```
POST /api/v1/payments/checkout/
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request

```json
{
  "items": [
    { "product_id": 6,  "quantity": 1 },
    { "product_id": 7,  "quantity": 2 },
    { "product_id": 10, "quantity": 1 }
  ]
}
```

**Reglas de validación:**
- `items`: mínimo 1 ítem, máximo 20
- `quantity`: mínimo 1, máximo 100 por producto
- `product_id`: debe existir y tener `is_active: true`

### Response 201

```json
{
  "order_id": 42,
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3...",
  "session_id": "cs_test_a1b2c3d4e5f6...",
  "amount_usd": 1988.99
}
```

### Qué hacer con la respuesta

```javascript
const response = await createCheckoutSession(cartItems)

// Redirigir al usuario a Stripe Checkout
window.location.href = response.checkout_url

// Guardar session_id para verificar el pago después
sessionStorage.setItem('stripe_session_id', response.session_id)
sessionStorage.setItem('order_id', response.order_id)
```

> **Importante:** No implementar tu propio formulario de pago. Stripe Checkout maneja PCI compliance, 3DS, Apple Pay, Google Pay automáticamente.

---

## 5. Historial de órdenes

```
GET /api/v1/payments/orders/
Authorization: Bearer <access_token>
```

Solo retorna las órdenes del usuario autenticado.

### Response 200

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 42,
      "status": "COMPLETED",
      "amount_usd": 1988.99,
      "items": [
        {
          "product_name": "Dell Latitude 5540 14\" Business Laptop",
          "product_sku": "LTAP-DELL-LAT5540",
          "quantity": 1,
          "unit_price": "1249.99"
        },
        {
          "product_name": "Samsung Galaxy A54 5G 128GB",
          "product_sku": "MOB-SAM-A54-5G",
          "quantity": 2,
          "unit_price": "369.00"
        }
      ],
      "created_at": "2026-06-23T22:15:00Z"
    },
    {
      "id": 41,
      "status": "EXPIRED",
      "amount_usd": 599.00,
      "items": [...],
      "created_at": "2026-06-23T20:00:00Z"
    }
  ]
}
```

### Estados de una orden

| Status | Descripción | Qué mostrar al usuario |
|--------|-------------|------------------------|
| `PENDING` | Sesión creada, usuario no pagó aún | "Pago pendiente" |
| `COMPLETED` | Pago confirmado por Stripe | "Pago exitoso ✓" |
| `EXPIRED` | Sesión expiró sin pagar (30 min) | "Sesión expirada" |
| `CANCELLED` | Cancelado | "Cancelado" |

---

## 6. Páginas de retorno (success / cancel)

Stripe redirige al usuario a estas URLs después del pago. El frontend debe implementarlas.

### URL de éxito

Stripe redirige a:
```
http://localhost:8000/checkout/success/?session_id=cs_test_...
```

> En producción actualizar `STRIPE_SUCCESS_URL` en el backend `.env` a tu URL de frontend, por ejemplo: `https://mi-tienda.com/checkout/success`.

**Qué hacer en la página de éxito:**

```javascript
// Leer session_id de la URL
const params = new URLSearchParams(window.location.search)
const sessionId = params.get('session_id')

// Consultar el estado de la orden
const orders = await fetchOrders()
const order = orders.results.find(o => o.status === 'COMPLETED')

// Mostrar confirmación y limpiar el carrito
if (order) {
  clearCart()
  showSuccessMessage(order)
}
```

> **Nota:** La orden puede seguir en `PENDING` por algunos segundos mientras Stripe procesa el webhook. Implementar un polling corto (2-3 intentos con 2s de espera) si es necesario.

### URL de cancelación

Stripe redirige a:
```
http://localhost:8000/checkout/cancel/
```

**Qué hacer en la página de cancelación:**

```javascript
// El carrito se mantiene — el usuario solo cerró Stripe sin pagar
// Mostrar mensaje y redirigir de vuelta al carrito
showMessage('Pago cancelado. Tu carrito sigue disponible.')
router.push('/cart')
```

---

## 7. Códigos de error

### Checkout (`POST /api/v1/payments/checkout/`)

| HTTP | Causa | Mensaje |
|------|-------|---------|
| `400` | Items vacíos o quantity inválida | `{"items": {"non_field_errors": [...]}}` |
| `401` | Token JWT ausente o expirado | `{"detail": "Authentication credentials were not provided."}` |
| `404` | product_id no existe o inactivo | `{"detail": "Producto id=X no encontrado o inactivo."}` |
| `422` | Producto sin precio en Stripe | `{"detail": "Producto \"X\" no está disponible para pago..."}` |
| `502` | Error de comunicación con Stripe | `{"detail": "No se pudo crear la sesión de pago."}` |

### Manejo recomendado en el frontend

```javascript
async function checkout(cartItems) {
  try {
    const res = await api.post('/api/v1/payments/checkout/', { items: cartItems })
    window.location.href = res.data.checkout_url

  } catch (error) {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (status === 401) {
      // Token expirado — renovar y reintentar
      await refreshToken()
      return checkout(cartItems)
    }

    if (status === 404) {
      showError('Uno de los productos ya no está disponible.')
      await refreshCart() // re-fetch productos para actualizar disponibilidad
      return
    }

    if (status === 422) {
      showError('Algunos productos no están disponibles para pago en línea.')
      return
    }

    // 502 u otros
    showError('Error al procesar el pago. Intenta de nuevo.')
  }
}
```

---

## 8. Ejemplo de implementación React

### Hook del carrito (`useCart.ts`)

```typescript
import { useState } from 'react'

interface CartItem {
  product_id: number
  name: string
  unit_price: number
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (product: { id: number; name: string; unit_price: string }) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        unit_price: parseFloat(product.unit_price),
        quantity: 1,
      }]
    })
  }

  const removeItem = (product_id: number) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id))
  }

  const updateQuantity = (product_id: number, quantity: number) => {
    if (quantity < 1) return removeItem(product_id)
    setItems(prev =>
      prev.map(i => i.product_id === product_id ? { ...i, quantity } : i)
    )
  }

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  const clear = () => setItems([])

  return { items, addItem, removeItem, updateQuantity, total, clear }
}
```

### Función de checkout (`checkoutService.ts`)

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

// Interceptor: adjunta token en cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function createCheckoutSession(
  items: Array<{ product_id: number; quantity: number }>
): Promise<{ checkout_url: string; order_id: number; session_id: string; amount_usd: number }> {
  const { data } = await api.post('/api/v1/payments/checkout/', { items })
  return data
}

export async function getOrders() {
  const { data } = await api.get('/api/v1/payments/orders/')
  return data
}

export async function getProducts(params?: Record<string, string>) {
  const { data } = await api.get('/api/v1/products/', { params })
  return data
}
```

### Botón de pago (`CheckoutButton.tsx`)

```tsx
import { useState } from 'react'
import { createCheckoutSession } from './checkoutService'
import { useCart } from './useCart'

export function CheckoutButton() {
  const { items, total } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const { checkout_url } = await createCheckoutSession(
        items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      )
      window.location.href = checkout_url  // redirige a Stripe
    } catch (err: any) {
      const status = err.response?.status
      if (status === 404) setError('Uno o más productos no están disponibles.')
      else if (status === 401) setError('Sesión expirada. Inicia sesión nuevamente.')
      else setError('Error al procesar el pago. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleCheckout} disabled={loading || items.length === 0}>
        {loading ? 'Procesando...' : `Pagar $${total.toFixed(2)} USD`}
      </button>
    </div>
  )
}
```

### Tarjeta de prueba Stripe (desarrollo)

Para probar pagos sin tarjeta real:

| Campo | Valor |
|-------|-------|
| Número | `4242 4242 4242 4242` |
| Fecha | Cualquier fecha futura |
| CVC | Cualquier 3 dígitos |
| ZIP | Cualquier 5 dígitos |

Más tarjetas de prueba: `stripe.com/docs/testing`

---

## Resumen de endpoints

| Método | Endpoint | Auth | Propósito |
|--------|----------|------|-----------|
| `POST` | `/api/v1/auth/token/` | No | Login → JWT |
| `POST` | `/api/v1/auth/token/refresh/` | No | Renovar access token |
| `GET` | `/api/v1/products/` | JWT | Listar productos (con filtros) |
| `GET` | `/api/v1/products/{id}/` | JWT | Detalle de producto |
| `POST` | `/api/v1/payments/checkout/` | JWT | Crear sesión de pago |
| `GET` | `/api/v1/payments/orders/` | JWT | Historial de órdenes |

Documentación interactiva completa: `http://localhost:8000/api/schema/swagger-ui/`
