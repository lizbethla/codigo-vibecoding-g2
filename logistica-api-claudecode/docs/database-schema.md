# Schema de Base de Datos — Logistics API

Documento de diseño de la base de datos para la API REST de logística. Todos los nombres de tablas y columnas están en inglés. Django nombra las tablas automáticamente como `{app_label}_{nombre_modelo_en_minúsculas}`.

---

## Tabla de Contenido

1. [Tablas Django built-in](#1-tablas-django-built-in)
2. [Decisiones de Diseño](#2-decisiones-de-diseño)
3. [Schema por Módulo](#3-schema-por-módulo)
   - 3.1 [customers_customer](#31-customers_customer)
   - 3.2 [suppliers_supplier](#32-suppliers_supplier)
   - 3.3 [products_product](#33-products_product)
   - 3.4 [warehouses_warehouse](#34-warehouses_warehouse)
   - 3.5 [drivers_driver](#35-drivers_driver)
   - 3.6 [transport_vehicle](#36-transport_vehicle)
   - 3.7 [routes_route](#37-routes_route)
   - 3.8 [routes_routestop](#38-routes_routestop)
   - 3.9 [shipments_shipment ← TABLA CENTRAL](#39-shipments_shipment--tabla-central)
   - 3.10 [shipments_shipmentproduct](#310-shipments_shipmentproduct)
4. [Diagrama de Relaciones (ERD)](#4-diagrama-de-relaciones-erd)
5. [Resumen de Relaciones](#5-resumen-de-relaciones)
6. [Índices Recomendados](#6-índices-recomendados)
7. [Orden de Registro en INSTALLED_APPS](#7-orden-de-registro-en-installed_apps)
8. [Secuencia de Implementación](#8-secuencia-de-implementación)

---

## 1. Tablas Django built-in

Estas tablas se crean automáticamente al ejecutar `python manage.py migrate` sin ninguna app custom. No se deben crear ni modificar manualmente.

| Tabla | App Django | Propósito |
|---|---|---|
| `auth_user` | `django.contrib.auth` | Cuentas de usuario del sistema |
| `auth_group` | `django.contrib.auth` | Grupos de permisos |
| `auth_permission` | `django.contrib.auth` | Permisos granulares |
| `auth_user_groups` | `django.contrib.auth` | M2M: usuario ↔ grupo |
| `auth_user_user_permissions` | `django.contrib.auth` | M2M: usuario ↔ permiso |
| `auth_group_permissions` | `django.contrib.auth` | M2M: grupo ↔ permiso |
| `django_content_type` | `django.contrib.contenttypes` | Registro de tipos de contenido |
| `django_session` | `django.contrib.sessions` | Almacenamiento de sesiones |
| `django_admin_log` | `django.contrib.admin` | Log de acciones del admin |
| `django_migrations` | interno | Seguimiento de migraciones |

**Campos clave de `auth_user` usados por este proyecto:**

| Campo | Tipo | Descripción |
|---|---|---|
| id | INTEGER (PK) | Identificador único |
| username | VARCHAR(150) | Nombre de usuario único |
| email | VARCHAR(254) | Correo electrónico |
| first_name | VARCHAR(150) | Nombre |
| last_name | VARCHAR(150) | Apellido |
| is_active | BOOLEAN | Usuario activo/inactivo |
| is_staff | BOOLEAN | Acceso al panel de administración |
| date_joined | DATETIME | Fecha de registro |

**Puntos de integración con tablas custom:**
- `auth_user` ← `drivers_driver.user` (OneToOne — perfil de conductor)
- `auth_user` ← `warehouses_warehouse.manager` (FK nullable — encargado de almacén)

---

## 2. Decisiones de Diseño

### PK entero (BigAutoField) sobre UUID
Se usa `BigAutoField` (entero auto-incremental) como PK por defecto en todos los modelos. Más simple para joins, legible en URLs del admin, mejor compatibilidad con SQLite. Al migrar a PostgreSQL se puede evaluar UUID como PK si se requiere distribución o exposición externa de IDs.

### `Driver` como perfil OneToOne de `auth_user`
Los conductores necesitarán autenticarse (portal de conductor, app móvil). El patrón de perfil con `OneToOneField` a `auth_user` es el enfoque canónico de Django. Mantiene la autenticación en el sistema de auth de Django y los datos de negocio en la app `drivers`. El nombre, email e `is_active` se leen de `driver.user.*` sin duplicar.

### `Warehouse.manager` como FK nullable a `auth_user`
El rol de encargado de almacén es fase 1 básica. Una FK nullable a `auth_user` es suficiente. Se puede evolucionar a un modelo `WarehouseManager` con perfil completo en fases posteriores.

### `Shipment` es la entidad central
`Shipment` agrega: `Customer`, `Warehouse` (origen), `Route`, `Vehicle`, y `Products` (vía tabla pivote). Todas las decisiones de diseño de otras entidades gravitaron alrededor de lo que `Shipment` necesita referenciar.

### `Route` como lista ordenada de paradas
`Route` tiene nombre, ciudades origen/destino y metadatos. Las paradas detalladas viven en `RouteStop` con un campo `order` para secuenciarlas. Permite rutas multi-parada sin complicar el modelo `Route`.

### `Supplier` alimenta `Product`, no `Shipment`
Los proveedores venden productos a la empresa. Los productos llevan un FK a su proveedor. Los envíos referencian productos, lo que crea la cadena indirecta hasta el proveedor. No se necesita un vínculo directo `Supplier → Shipment` en fase 1.

### Status como `TextChoices`
Todos los campos de estado usan `models.TextChoices` (disponible desde Django 3.0). Se almacena como VARCHAR, legible en queries, compatible con validación automática de DRF.

### Snapshot de precio en `ShipmentProduct`
`ShipmentProduct.unit_price` captura el precio del producto al momento del envío. Si el precio del producto cambia después, el historial de costos de envíos anteriores permanece correcto. Patrón estándar de e-commerce.

### Modelo `Vehicle` (no `Transport`) en app `transport`
Nombrar el modelo `Transport` en la app `transport` generaría la tabla `transport_transport`, lo cual es confuso. El nombre `Vehicle` produce `transport_vehicle`, claro y descriptivo.

---

## 3. Schema por Módulo

### 3.1 `customers_customer`

**App:** `customers` | **Modelo:** `Customer`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `name` | `CharField(max_length=200)` | VARCHAR(200) | NOT NULL | Nombre completo de empresa o persona |
| `customer_type` | `CharField(max_length=10, choices=CustomerType)` | VARCHAR(10) | NOT NULL, default=`COMPANY` | Tipo de cliente |
| `tax_id` | `CharField(max_length=50)` | VARCHAR(50) | UNIQUE, nullable | NIT / RUC / RFC u otro número fiscal |
| `email` | `EmailField` | VARCHAR(254) | NOT NULL, UNIQUE | Correo electrónico principal |
| `phone` | `CharField(max_length=20)` | VARCHAR(20) | nullable | Teléfono de contacto |
| `address` | `TextField` | TEXT | nullable | Dirección completa |
| `city` | `CharField(max_length=100)` | VARCHAR(100) | nullable | Ciudad |
| `country` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL, default=`Colombia` | País |
| `is_active` | `BooleanField` | BOOLEAN | NOT NULL, default=`True` | Soft-delete / cliente activo |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**`CustomerType` choices:**
- `COMPANY` — Empresa
- `INDIVIDUAL` — Persona natural

---

### 3.2 `suppliers_supplier`

**App:** `suppliers` | **Modelo:** `Supplier`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `name` | `CharField(max_length=200)` | VARCHAR(200) | NOT NULL | Nombre de la empresa proveedora |
| `contact_name` | `CharField(max_length=150)` | VARCHAR(150) | nullable | Nombre del contacto principal |
| `email` | `EmailField` | VARCHAR(254) | NOT NULL, UNIQUE | Correo electrónico de contacto |
| `phone` | `CharField(max_length=20)` | VARCHAR(20) | nullable | Teléfono de contacto |
| `address` | `TextField` | TEXT | nullable | Dirección física |
| `city` | `CharField(max_length=100)` | VARCHAR(100) | nullable | Ciudad |
| `country` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL, default=`Colombia` | País |
| `tax_id` | `CharField(max_length=50)` | VARCHAR(50) | UNIQUE, nullable | NIT / número fiscal |
| `is_active` | `BooleanField` | BOOLEAN | NOT NULL, default=`True` | Proveedor activo |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

---

### 3.3 `products_product`

**App:** `products` | **Modelo:** `Product`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `supplier` | `ForeignKey('suppliers.Supplier', on_delete=SET_NULL)` | INTEGER | FK, nullable | Proveedor que suministra este producto |
| `sku` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL, UNIQUE | Código de referencia del producto |
| `name` | `CharField(max_length=200)` | VARCHAR(200) | NOT NULL | Nombre del producto |
| `description` | `TextField` | TEXT | nullable | Descripción detallada |
| `category` | `CharField(max_length=50, choices=ProductCategory)` | VARCHAR(50) | NOT NULL | Categoría de producto |
| `unit_price` | `DecimalField(max_digits=12, decimal_places=2)` | DECIMAL(12,2) | NOT NULL | Precio de lista actual |
| `weight_kg` | `DecimalField(max_digits=8, decimal_places=3)` | DECIMAL(8,3) | NOT NULL, default=0 | Peso en kilogramos |
| `dimensions_cm` | `CharField(max_length=50)` | VARCHAR(50) | nullable | Dimensiones L×A×H en cm (formato string) |
| `stock_quantity` | `PositiveIntegerField` | INTEGER | NOT NULL, default=0 | Unidades disponibles en inventario |
| `is_active` | `BooleanField` | BOOLEAN | NOT NULL, default=`True` | Producto activo / descontinuado |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**`ProductCategory` choices:**
`LAPTOP` · `DESKTOP` · `MOBILE` · `TABLET` · `PERIPHERAL` · `NETWORKING` · `STORAGE` · `OTHER`

**Relaciones:**
- `supplier` → `suppliers_supplier.id` (`SET_NULL` — el producto persiste si se elimina el proveedor)

---

### 3.4 `warehouses_warehouse`

**App:** `warehouses` | **Modelo:** `Warehouse`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `manager` | `ForeignKey(settings.AUTH_USER_MODEL, on_delete=SET_NULL)` | INTEGER | FK, nullable | Usuario `auth_user` asignado como encargado |
| `name` | `CharField(max_length=150)` | VARCHAR(150) | NOT NULL | Nombre del almacén |
| `code` | `CharField(max_length=20)` | VARCHAR(20) | NOT NULL, UNIQUE | Código operativo corto (ej: `BOG-01`) |
| `address` | `TextField` | TEXT | NOT NULL | Dirección completa |
| `city` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Ciudad |
| `country` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL, default=`Colombia` | País |
| `latitude` | `DecimalField(max_digits=9, decimal_places=6)` | DECIMAL(9,6) | nullable | Latitud GPS |
| `longitude` | `DecimalField(max_digits=9, decimal_places=6)` | DECIMAL(9,6) | nullable | Longitud GPS |
| `capacity_m3` | `DecimalField(max_digits=10, decimal_places=2)` | DECIMAL(10,2) | nullable | Capacidad total en metros cúbicos |
| `is_active` | `BooleanField` | BOOLEAN | NOT NULL, default=`True` | Almacén operativo |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**Relaciones:**
- `manager` → `auth_user.id` (`SET_NULL` — el almacén persiste si se elimina el usuario encargado)

---

### 3.5 `drivers_driver`

**App:** `drivers` | **Modelo:** `Driver`

Patrón de perfil OneToOne. El nombre, apellido, email e `is_active` del conductor se leen de `driver.user.*` — no se duplican en este modelo.

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `user` | `OneToOneField(settings.AUTH_USER_MODEL, on_delete=CASCADE)` | INTEGER | UNIQUE, FK, NOT NULL | Cuenta de usuario Django vinculada |
| `license_number` | `CharField(max_length=50)` | VARCHAR(50) | NOT NULL, UNIQUE | Número de licencia de conducir |
| `license_type` | `CharField(max_length=20, choices=LicenseType)` | VARCHAR(20) | NOT NULL | Categoría de licencia |
| `license_expiry` | `DateField` | DATE | NOT NULL | Fecha de vencimiento de licencia |
| `phone` | `CharField(max_length=20)` | VARCHAR(20) | NOT NULL | Teléfono móvil de contacto |
| `status` | `CharField(max_length=20, choices=DriverStatus)` | VARCHAR(20) | NOT NULL, default=`AVAILABLE` | Disponibilidad actual |
| `date_of_birth` | `DateField` | DATE | nullable | Fecha de nacimiento |
| `national_id` | `CharField(max_length=50)` | VARCHAR(50) | NOT NULL, UNIQUE | Número de documento de identidad |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**`LicenseType` choices:**
- `A` — Motocicletas
- `B` — Vehículos livianos
- `C` — Vehículos pesados
- `CE` — Vehículos articulados pesados
- `BTP` — Transporte público

**`DriverStatus` choices:**
`AVAILABLE` · `ON_ROUTE` · `OFF_DUTY` · `SUSPENDED`

**Relaciones:**
- `user` → `auth_user.id` (`CASCADE` — eliminar usuario elimina el perfil de conductor)

---

### 3.6 `transport_vehicle`

**App:** `transport` | **Modelo:** `Vehicle`

> El modelo se llama `Vehicle` (no `Transport`) para evitar la tabla confusa `transport_transport`.

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `driver` | `ForeignKey('drivers.Driver', on_delete=SET_NULL)` | INTEGER | FK, nullable | Conductor actualmente asignado |
| `plate` | `CharField(max_length=20)` | VARCHAR(20) | NOT NULL, UNIQUE | Placa del vehículo |
| `vehicle_type` | `CharField(max_length=30, choices=VehicleType)` | VARCHAR(30) | NOT NULL | Tipo de vehículo |
| `brand` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Marca del fabricante |
| `model` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Modelo del vehículo |
| `year` | `PositiveSmallIntegerField` | SMALLINT | NOT NULL | Año de fabricación |
| `capacity_kg` | `DecimalField(max_digits=10, decimal_places=2)` | DECIMAL(10,2) | NOT NULL | Carga máxima en kilogramos |
| `capacity_m3` | `DecimalField(max_digits=8, decimal_places=2)` | DECIMAL(8,2) | nullable | Capacidad de volumen |
| `fuel_type` | `CharField(max_length=20, choices=FuelType)` | VARCHAR(20) | NOT NULL, default=`DIESEL` | Tipo de combustible |
| `status` | `CharField(max_length=20, choices=VehicleStatus)` | VARCHAR(20) | NOT NULL, default=`AVAILABLE` | Estado operativo |
| `last_maintenance` | `DateField` | DATE | nullable | Fecha del último mantenimiento |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**`VehicleType` choices:**
`MOTORCYCLE` · `VAN` · `TRUCK` · `HEAVY_TRUCK` · `REFRIGERATED_TRUCK` · `CONTAINER`

**`FuelType` choices:**
`GASOLINE` · `DIESEL` · `ELECTRIC` · `HYBRID` · `GAS`

**`VehicleStatus` choices:**
`AVAILABLE` · `IN_USE` · `MAINTENANCE` · `RETIRED`

**Relaciones:**
- `driver` → `drivers_driver.id` (`SET_NULL` — el vehículo persiste si se desvincula el conductor)

---

### 3.7 `routes_route`

**App:** `routes` | **Modelo:** `Route`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `name` | `CharField(max_length=150)` | VARCHAR(150) | NOT NULL | Nombre descriptivo de la ruta |
| `code` | `CharField(max_length=30)` | VARCHAR(30) | NOT NULL, UNIQUE | Código operativo corto |
| `origin_city` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Ciudad de origen |
| `destination_city` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Ciudad de destino final |
| `distance_km` | `DecimalField(max_digits=8, decimal_places=2)` | DECIMAL(8,2) | nullable | Distancia total en kilómetros |
| `estimated_hours` | `DecimalField(max_digits=5, decimal_places=2)` | DECIMAL(5,2) | nullable | Tiempo estimado de recorrido en horas |
| `is_active` | `BooleanField` | BOOLEAN | NOT NULL, default=`True` | Ruta disponible para uso |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

---

### 3.8 `routes_routestop`

**App:** `routes` | **Modelo:** `RouteStop`

Tabla de paradas ordenadas dentro de una ruta. Una ruta puede tener múltiples paradas en secuencia.

**`Meta`:** `unique_together = [('route', 'order')]` · `ordering = ['route', 'order']`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `route` | `ForeignKey('routes.Route', on_delete=CASCADE)` | INTEGER | FK, NOT NULL | Ruta padre |
| `stop_name` | `CharField(max_length=150)` | VARCHAR(150) | NOT NULL | Nombre de la ciudad o punto de parada |
| `order` | `PositiveSmallIntegerField` | SMALLINT | NOT NULL | Posición en la ruta (desde 1) |
| `estimated_arrival_hours` | `DecimalField(max_digits=5, decimal_places=2)` | DECIMAL(5,2) | nullable | Horas desde el inicio de ruta hasta esta parada |
| `notes` | `TextField` | TEXT | nullable | Notas operativas para esta parada |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**Relaciones:**
- `route` → `routes_route.id` (`CASCADE` — las paradas se eliminan cuando se elimina la ruta)

---

### 3.9 `shipments_shipment` — TABLA CENTRAL

**App:** `shipments` | **Modelo:** `Shipment`

Entidad central del negocio. Agrega cliente, almacén de origen, ruta, vehículo y productos en un solo envío.

> `tracking_code` se genera automáticamente en el método `save()` del modelo con formato `LOG-{AÑO}-{8 chars aleatorios}`.

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `customer` | `ForeignKey('customers.Customer', on_delete=PROTECT)` | INTEGER | FK, NOT NULL | Cliente que generó el envío |
| `origin_warehouse` | `ForeignKey('warehouses.Warehouse', on_delete=PROTECT, related_name='outgoing_shipments')` | INTEGER | FK, NOT NULL | Almacén de origen |
| `route` | `ForeignKey('routes.Route', on_delete=PROTECT)` | INTEGER | FK, nullable | Ruta asignada para la entrega |
| `vehicle` | `ForeignKey('transport.Vehicle', on_delete=SET_NULL)` | INTEGER | FK, nullable | Vehículo asignado |
| `tracking_code` | `CharField(max_length=50)` | VARCHAR(50) | NOT NULL, UNIQUE | Código de rastreo legible |
| `status` | `CharField(max_length=25, choices=ShipmentStatus)` | VARCHAR(25) | NOT NULL, default=`PENDING` | Estado actual del ciclo de vida |
| `priority` | `CharField(max_length=10, choices=ShipmentPriority)` | VARCHAR(10) | NOT NULL, default=`NORMAL` | Prioridad de entrega |
| `origin_address` | `TextField` | TEXT | NOT NULL | Dirección de recogida |
| `destination_address` | `TextField` | TEXT | NOT NULL | Dirección de entrega |
| `destination_city` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL | Ciudad de destino |
| `destination_country` | `CharField(max_length=100)` | VARCHAR(100) | NOT NULL, default=`Colombia` | País de destino |
| `recipient_name` | `CharField(max_length=150)` | VARCHAR(150) | NOT NULL | Nombre del receptor del envío |
| `recipient_phone` | `CharField(max_length=20)` | VARCHAR(20) | nullable | Teléfono del receptor |
| `scheduled_date` | `DateField` | DATE | NOT NULL | Fecha planeada de despacho |
| `estimated_delivery` | `DateField` | DATE | nullable | Fecha estimada de llegada |
| `actual_delivery` | `DateTimeField` | DATETIME | nullable | Timestamp real de entrega |
| `total_weight_kg` | `DecimalField(max_digits=10, decimal_places=3)` | DECIMAL(10,3) | NOT NULL, default=0 | Peso total calculado |
| `total_volume_m3` | `DecimalField(max_digits=10, decimal_places=4)` | DECIMAL(10,4) | nullable | Volumen total calculado |
| `base_cost` | `DecimalField(max_digits=12, decimal_places=2)` | DECIMAL(12,2) | NOT NULL, default=0 | Costo de envío antes de impuestos |
| `tax_amount` | `DecimalField(max_digits=12, decimal_places=2)` | DECIMAL(12,2) | NOT NULL, default=0 | Monto de impuestos aplicados |
| `total_cost` | `DecimalField(max_digits=12, decimal_places=2)` | DECIMAL(12,2) | NOT NULL, default=0 | Costo total facturado |
| `notes` | `TextField` | TEXT | nullable | Notas internas del envío |
| `products` | `ManyToManyField('products.Product', through='ShipmentProduct')` | — | M2M via tabla pivote | Productos incluidos en el envío |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**`ShipmentStatus` choices:**

| Valor | Descripción |
|---|---|
| `PENDING` | Envío creado, pendiente de confirmación |
| `CONFIRMED` | Confirmado por el sistema |
| `IN_WAREHOUSE` | Productos recibidos en almacén |
| `IN_TRANSIT` | En camino al destino |
| `OUT_FOR_DELIVERY` | En reparto local |
| `DELIVERED` | Entregado exitosamente |
| `FAILED` | Intento de entrega fallido |
| `CANCELLED` | Cancelado |
| `RETURNED` | Devuelto al almacén |

**`ShipmentPriority` choices:**
`LOW` · `NORMAL` · `HIGH` · `URGENT`

**Relaciones:**
- `customer` → `customers_customer.id` (`PROTECT` — no se puede eliminar un cliente con envíos)
- `origin_warehouse` → `warehouses_warehouse.id` (`PROTECT`)
- `route` → `routes_route.id` (`PROTECT`, nullable — la ruta puede asignarse después de crear el envío)
- `vehicle` → `transport_vehicle.id` (`SET_NULL`, nullable — el vehículo se asigna en flujo posterior)

---

### 3.10 `shipments_shipmentproduct`

**App:** `shipments` | **Modelo:** `ShipmentProduct`

Tabla pivote M2M explícita entre `Shipment` y `Product`. Almacena datos de línea de pedido que no pertenecen a ninguno de los dos extremos.

**`Meta`:** `unique_together = [('shipment', 'product')]`

| Columna | Tipo Django | Tipo DB | Restricciones | Descripción |
|---|---|---|---|---|
| `id` | `BigAutoField` | INTEGER | PK, auto-increment | Identificador único |
| `shipment` | `ForeignKey('shipments.Shipment', on_delete=CASCADE)` | INTEGER | FK, NOT NULL | Envío padre |
| `product` | `ForeignKey('products.Product', on_delete=PROTECT)` | INTEGER | FK, NOT NULL | Producto incluido |
| `quantity` | `PositiveIntegerField` | INTEGER | NOT NULL | Cantidad de unidades |
| `unit_price` | `DecimalField(max_digits=12, decimal_places=2)` | DECIMAL(12,2) | NOT NULL | Precio al momento del envío (snapshot) |
| `line_total` | `DecimalField(max_digits=14, decimal_places=2)` | DECIMAL(14,2) | NOT NULL | `quantity × unit_price` (calculado en `save()`) |
| `notes` | `CharField(max_length=200)` | VARCHAR(200) | nullable | Notas de la línea |
| `created_at` | `DateTimeField(auto_now_add=True)` | DATETIME | NOT NULL | Fecha de creación |
| `updated_at` | `DateTimeField(auto_now=True)` | DATETIME | NOT NULL | Fecha de última actualización |

**Relaciones:**
- `shipment` → `shipments_shipment.id` (`CASCADE` — las líneas se eliminan con el envío)
- `product` → `products_product.id` (`PROTECT` — no se puede eliminar un producto que esté en envíos)

---

## 4. Diagrama de Relaciones (ERD)

```
auth_user (Django built-in)
  │
  ├─── OneToOne ──────────────────► drivers_driver
  │                                      │
  │                                      │ FK (driver, SET_NULL)
  │                                      ▼
  │                               transport_vehicle
  │                                      │
  │                                      │ FK (vehicle, SET_NULL)
  │                                      ▼
  └─── FK (manager, SET_NULL) ──► warehouses_warehouse ◄─── FK (origin_warehouse, PROTECT)
                                                                     │
                                                                     │
suppliers_supplier                                                   │
  │                                                                  │
  │ FK (supplier, SET_NULL)                               shipments_shipment ◄─── FK (customer, PROTECT)
  ▼                                                                  │             │
products_product ◄────── FK (product, PROTECT) ──── shipments_shipmentproduct     │
                                                                                   │
routes_route ◄──────────────────────────────── FK (route, PROTECT, nullable) ─────┘
  │
  │ FK (route, CASCADE)
  ▼
routes_routestop

customers_customer ──── FK (customer, PROTECT) ──► shipments_shipment
```

**Dirección de dependencias entre apps** (para orden de importación):

```
customers   ──────────────────────────────────────────────────┐
suppliers   ──► products ─────────────────────────────────────┤
auth_user   ──► warehouses ───────────────────────────────────┤──► shipments
auth_user   ──► drivers ──► transport ────────────────────────┤
                routes ───────────────────────────────────────┘
```

---

## 5. Resumen de Relaciones

| Columna | Tabla origen | Tabla destino | Tipo | On Delete | Nullable |
|---|---|---|---|---|---|
| `driver.user` | `drivers_driver` | `auth_user` | OneToOne | CASCADE | No |
| `warehouse.manager` | `warehouses_warehouse` | `auth_user` | FK | SET_NULL | Sí |
| `product.supplier` | `products_product` | `suppliers_supplier` | FK | SET_NULL | Sí |
| `routestop.route` | `routes_routestop` | `routes_route` | FK | CASCADE | No |
| `vehicle.driver` | `transport_vehicle` | `drivers_driver` | FK | SET_NULL | Sí |
| `shipment.customer` | `shipments_shipment` | `customers_customer` | FK | PROTECT | No |
| `shipment.origin_warehouse` | `shipments_shipment` | `warehouses_warehouse` | FK | PROTECT | No |
| `shipment.route` | `shipments_shipment` | `routes_route` | FK | PROTECT | Sí |
| `shipment.vehicle` | `shipments_shipment` | `transport_vehicle` | FK | SET_NULL | Sí |
| `shipment.products` | `shipments_shipment` | `products_product` | M2M (through) | — | — |
| `shipmentproduct.shipment` | `shipments_shipmentproduct` | `shipments_shipment` | FK | CASCADE | No |
| `shipmentproduct.product` | `shipments_shipmentproduct` | `products_product` | FK | PROTECT | No |

---

## 6. Índices Recomendados

Índices adicionales a los PK por defecto. En Django se declaran en `Meta.indexes`:

```python
class Meta:
    indexes = [
        models.Index(fields=['status']),
        models.Index(fields=['scheduled_date']),
        # etc.
    ]
```

| Tabla | Columna(s) | Razón |
|---|---|---|
| `shipments_shipment` | `status` | Filtro más consultado |
| `shipments_shipment` | `tracking_code` | UNIQUE — ya indexado |
| `shipments_shipment` | `scheduled_date` | Queries por rango de fechas |
| `shipments_shipment` | `vehicle_id, status` | Consultas de carga por vehículo |
| `shipments_shipment` | `customer_id` | FK — auto-indexado por Django |
| `products_product` | `sku` | UNIQUE — ya indexado |
| `drivers_driver` | `status` | Consultas de conductores disponibles |
| `transport_vehicle` | `status` | Consultas de flota disponible |

---

## 7. Orden de Registro en `INSTALLED_APPS`

El orden respeta las dependencias de FK para que las migraciones se generen y apliquen correctamente.

```python
INSTALLED_APPS = [
    # Django built-ins
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    # Apps del proyecto (sin dependencias primero)
    'customers',
    'suppliers',
    'products',     # depende de: suppliers
    'warehouses',   # depende de: auth_user
    'drivers',      # depende de: auth_user
    'transport',    # depende de: drivers
    'routes',
    'shipments',    # depende de: customers, warehouses, transport, routes, products
]
```

---

## 8. Secuencia de Implementación

Orden recomendado para iniciar el desarrollo respetando las dependencias entre modelos:

1. Crear las 7 apps faltantes con `python manage.py startapp <nombre>`:
   `customers` · `suppliers` · `warehouses` · `drivers` · `transport` · `routes` · `shipments`

2. Registrar las 8 apps en `INSTALLED_APPS` (ver sección 7)

3. Agregar `'rest_framework'` a `INSTALLED_APPS`

4. Mover `SECRET_KEY` y `DEBUG` a `.env` usando `python-decouple`

5. Implementar modelos en este orden (respetando dependencias FK):
   - `customers.Customer` — sin dependencias externas
   - `suppliers.Supplier` — sin dependencias externas
   - `products.Product` — depende de `Supplier`
   - `warehouses.Warehouse` — depende de `auth_user`
   - `drivers.Driver` — depende de `auth_user`
   - `transport.Vehicle` — depende de `Driver`
   - `routes.Route` + `routes.RouteStop` — dependencia interna únicamente
   - `shipments.Shipment` + `shipments.ShipmentProduct` — depende de todos los anteriores

6. Ejecutar migraciones:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. Registrar todos los modelos en `admin.py` de cada app

8. Iniciar implementación de serializers y viewsets DRF por app
