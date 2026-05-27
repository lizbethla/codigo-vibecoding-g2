# Resumen del Proyecto — Logistics API

Documento de referencia rápida sobre todo lo construido en el proyecto, organizado por fases.

---

## ¿Qué es este proyecto?

API REST para gestión logística de productos de tecnología. Permite registrar clientes, proveedores, productos, almacenes, conductores, vehículos y rutas, y gestionar envíos completos con seguimiento de estado.

**Stack:** Python 3.13 · Django 6.0 · Django REST Framework 3.17 · JWT · SQLite (dev) / PostgreSQL (producción)

---

## Estado actual

```
✅ Fase 1 — Setup base del proyecto
✅ Fase 2 — Clientes y Proveedores
✅ Fase 3 — Productos, Almacenes y Conductores
✅ Fase 4 — Vehículos y Rutas
✅ Fase 5 — Envíos (entidad central)
✅ Fase 6 — Documentación Swagger UI
```

`python manage.py check` → **0 errores, 0 advertencias**

---

## Cómo correr el proyecto

```bash
# 1. Activar entorno virtual
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Mac/Linux

# 2. Iniciar servidor
python manage.py runserver

# 3. Abrir en el navegador
# API:      http://127.0.0.1:8000/api/v1/
# Swagger:  http://127.0.0.1:8000/api/schema/swagger-ui/
# Admin:    http://127.0.0.1:8000/admin/
```

---

## Endpoints disponibles

### Autenticación

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/v1/auth/token/` | Login → retorna access + refresh token |
| POST | `/api/v1/auth/token/refresh/` | Renueva el access token |
| POST | `/api/v1/auth/token/verify/` | Verifica si un token es válido |

**Todos los demás endpoints requieren autenticación.**
Header: `Authorization: Bearer <access_token>`

---

### Módulos CRUD

Todos los módulos siguen el mismo patrón:

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/v1/<recurso>/` | Listar (paginado, con filtros) |
| POST | `/api/v1/<recurso>/` | Crear |
| GET | `/api/v1/<recurso>/{id}/` | Ver detalle completo |
| PUT | `/api/v1/<recurso>/{id}/` | Actualizar completo |
| PATCH | `/api/v1/<recurso>/{id}/` | Actualizar parcial |
| DELETE | `/api/v1/<recurso>/{id}/` | Eliminar |

#### Recursos disponibles

| Recurso | URL base | App Django |
|---------|----------|-----------|
| Clientes | `/api/v1/customers/` | `apps.customers` |
| Proveedores | `/api/v1/suppliers/` | `apps.suppliers` |
| Productos | `/api/v1/products/` | `apps.products` |
| Almacenes | `/api/v1/warehouses/` | `apps.warehouses` |
| Conductores | `/api/v1/drivers/` | `apps.drivers` |
| Vehículos | `/api/v1/vehicles/` | `apps.transport` |
| Rutas | `/api/v1/routes/` | `apps.routes` |
| Envíos | `/api/v1/shipments/` | `apps.shipments` |

#### Endpoints anidados (sub-recursos)

| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/routes/{id}/stops/` | Paradas de una ruta |
| GET/PUT/PATCH/DELETE | `/api/v1/routes/{id}/stops/{stop_id}/` | Parada específica |
| GET/POST | `/api/v1/shipments/{id}/products/` | Productos de un envío |
| GET/PUT/PATCH/DELETE | `/api/v1/shipments/{id}/products/{product_id}/` | Producto específico del envío |

---

## Filtros disponibles por módulo

Todos los módulos admiten `?search=texto` y `?ordering=campo`.

| Módulo | Filtros de campo |
|--------|-----------------|
| Clientes | `?customer_type=COMPANY` · `?is_active=true` · `?country=Colombia` |
| Proveedores | `?is_active=true` · `?country=Colombia` |
| Productos | `?category=LAPTOP` · `?supplier=1` · `?is_active=true` |
| Almacenes | `?city=Bogotá` · `?is_active=true` |
| Conductores | `?status=AVAILABLE` · `?license_type=C` |
| Vehículos | `?vehicle_type=TRUCK` · `?status=AVAILABLE` · `?fuel_type=DIESEL` |
| Rutas | `?origin_city=Bogotá` · `?destination_city=Medellín` · `?is_active=true` |
| Envíos | `?status=PENDING` · `?priority=HIGH` · `?customer=1` · `?vehicle=2` · `?scheduled_date_after=2025-01-01&scheduled_date_before=2025-12-31` |

---

## Estructura de archivos

```
logistica-api-claudecode/
│
├── config/
│   ├── settings/
│   │   ├── __init__.py       ← selecciona entorno según DJANGO_ENV
│   │   ├── base.py           ← configuración común
│   │   ├── development.py    ← SQLite, DEBUG=True
│   │   └── production.py     ← PostgreSQL, DEBUG=False
│   ├── urls.py               ← todas las rutas del proyecto
│   └── wsgi.py
│
├── apps/
│   ├── customers/            ← Clientes
│   ├── suppliers/            ← Proveedores
│   ├── products/             ← Productos
│   ├── warehouses/           ← Almacenes
│   ├── drivers/              ← Conductores
│   ├── transport/            ← Vehículos
│   ├── routes/               ← Rutas y paradas
│   └── shipments/            ← Envíos (entidad central)
│
├── common/
│   ├── pagination.py         ← Paginación estándar (20 por página, máx 100)
│   ├── exceptions.py         ← Manejo global de errores
│   └── mixins.py
│
├── docs/
│   ├── architecture.md       ← Arquitectura técnica detallada
│   ├── database-schema.md    ← Diseño de base de datos
│   ├── mvp-scope.md          ← Alcance del MVP
│   └── resumen-proyecto.md   ← Este archivo
│
├── spec/                     ← Especificaciones por fase (SDD)
│   ├── customers.md
│   ├── suppliers.md
│   ├── products.md
│   ├── warehouses.md
│   ├── drivers.md
│   ├── transport.md
│   ├── routes.md
│   ├── shipments.md
│   └── swagger-ui.md
│
├── .env                      ← Variables de entorno (no versionar)
├── .env.example              ← Plantilla de variables requeridas
├── manage.py
└── CLAUDE.md
```

---

## Cada app tiene la misma estructura interna

```
apps/<modulo>/
├── models.py        ← Modelo de base de datos
├── serializers.py   ← 3 serializers: List / Detail / Write
├── views.py         ← ViewSet con get_serializer_class()
├── urls.py          ← Router registrado
├── admin.py         ← Configuración del panel admin
├── filters.py       ← Filtros con django-filter
└── migrations/      ← Migraciones de base de datos
```

---

## Lo más importante de cada módulo

### Clientes (`/api/v1/customers/`)
- Tipos: `COMPANY` (empresa) o `INDIVIDUAL` (persona natural)
- Campo `tax_id` único (NIT, RUC, etc.)
- Soft-delete con `is_active`

### Proveedores (`/api/v1/suppliers/`)
- Empresas que venden los productos
- Se vinculan a productos mediante FK

### Productos (`/api/v1/products/`)
- Categorías: `LAPTOP`, `DESKTOP`, `MOBILE`, `TABLET`, `PERIPHERAL`, `NETWORKING`, `STORAGE`, `OTHER`
- Campo `sku` único por producto
- Tienen peso (`weight_kg`) y dimensiones para calcular costos de envío
- El precio (`unit_price`) es el precio de lista actual

### Almacenes (`/api/v1/warehouses/`)
- Punto de origen de los envíos
- Tienen coordenadas GPS y capacidad en m³
- Se puede asignar un encargado (usuario del sistema)

### Conductores (`/api/v1/drivers/`)
- Vinculados a un usuario Django (para futura autenticación propia)
- Tienen licencia con tipo y fecha de vencimiento
- Estados: `AVAILABLE`, `ON_ROUTE`, `OFF_DUTY`, `SUSPENDED`

### Vehículos (`/api/v1/vehicles/`)
- Se asigna un conductor por vehículo
- Tipos: `MOTORCYCLE`, `VAN`, `TRUCK`, `HEAVY_TRUCK`, `REFRIGERATED_TRUCK`, `CONTAINER`
- Estados: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `RETIRED`

### Rutas (`/api/v1/routes/`)
- Tienen ciudad de origen y destino
- Las paradas intermedias van en `/routes/{id}/stops/` con orden específico
- Se pueden reutilizar en múltiples envíos

### Envíos (`/api/v1/shipments/`) — Entidad central
- Agrega: cliente + almacén de origen + ruta + vehículo + productos
- `tracking_code` se genera automáticamente al crear (formato: `LOG-2025-ABCD1234`)
- Estados del ciclo de vida: `PENDING` → `CONFIRMED` → `IN_WAREHOUSE` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`
- También puede terminar en: `FAILED`, `CANCELLED`, `RETURNED`
- Prioridades: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- Los productos del envío van en `/shipments/{id}/products/` con cantidad y precio snapshot

---

## Paginación

Todas las listas retornan este formato:

```json
{
  "count": 150,
  "next": "http://127.0.0.1:8000/api/v1/shipments/?page=2",
  "previous": null,
  "results": [...]
}
```

- Página por defecto: **20 elementos**
- Cambiar tamaño: `?page_size=50`
- Máximo: `?page_size=100`

---

## Documentación interactiva

| URL | Herramienta | Uso |
|-----|-------------|-----|
| `/api/schema/swagger-ui/` | Swagger UI | Probar endpoints directamente desde el navegador |
| `/api/schema/redoc/` | Redoc | Documentación navegable, mejor para lectura |
| `/api/schema/` | YAML crudo | Importar en Postman, Insomnia, etc. |

Los endpoints están agrupados por sección:
- **auth** — tokens JWT
- **Clientes** — customers
- **Conductores** — drivers
- **Almacenes** — warehouses
- **Envíos** — shipments + productos del envío
- **Productos** — products
- **Proveedores** — suppliers
- **Rutas** — routes + paradas

---

## Flujo de prueba básico

```
1. Crear superusuario:
   python manage.py createsuperuser

2. Obtener token:
   POST /api/v1/auth/token/
   { "username": "admin", "password": "tu-contraseña" }

3. Usar token en Swagger:
   Botón "Authorize" → Bearer <access_token>

4. Crear datos maestros (en este orden):
   POST /api/v1/suppliers/      ← proveedor
   POST /api/v1/products/       ← producto (con supplier_id)
   POST /api/v1/customers/      ← cliente
   POST /api/v1/warehouses/     ← almacén
   POST /api/v1/drivers/        ← conductor (con user_id)
   POST /api/v1/vehicles/       ← vehículo (con driver_id)
   POST /api/v1/routes/         ← ruta
   POST /api/v1/routes/{id}/stops/  ← paradas de la ruta

5. Crear un envío:
   POST /api/v1/shipments/
   {
     "customer": 1,
     "origin_warehouse": 1,
     "route": 1,
     "vehicle": 1,
     "origin_address": "Calle 100 #15-20, Bogotá",
     "destination_address": "Carrera 50 #30-10, Medellín",
     "destination_city": "Medellín",
     "recipient_name": "Juan García",
     "scheduled_date": "2025-06-01"
   }
   → Respuesta incluye tracking_code generado automáticamente

6. Agregar productos al envío:
   POST /api/v1/shipments/{id}/products/
   { "product": 1, "quantity": 3, "unit_price": "2500000.00" }
```

---

## Variables de entorno requeridas

Ver `.env.example` para la lista completa. Las esenciales:

```env
DJANGO_ENV=development          # o 'production' para Railway
SECRET_KEY=clave-secreta-larga
DATABASE_URL=postgresql://...   # solo en producción
```

---

## Comandos útiles

```bash
# Verificar que todo está bien configurado
python manage.py check

# Crear migraciones después de cambiar un modelo
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario para el admin
python manage.py createsuperuser

# Validar el schema OpenAPI
python manage.py spectacular --validate --fail-on-warn

# Ver todas las URLs registradas
python manage.py show_urls
```
