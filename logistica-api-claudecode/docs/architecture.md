# Arquitectura de Desarrollo — Logistics API MVP

Documento de referencia para el diseño e implementación del API REST de logística. Leer junto con `docs/database-schema.md` antes de iniciar cualquier módulo.

---

## Tabla de Contenido

1. [Stack y Paquetes](#1-stack-y-paquetes)
2. [Estructura de Directorios](#2-estructura-de-directorios)
3. [Estructura Interna de cada App](#3-estructura-interna-de-cada-app)
4. [Capas del Sistema](#4-capas-del-sistema)
5. [Diseño de API](#5-diseño-de-api)
6. [Autenticación — JWT](#6-autenticación--jwt)
7. [Serializers — Patrón Lectura/Escritura](#7-serializers--patrón-lecturaescritura)
8. [Filtros por Módulo](#8-filtros-por-módulo)
9. [Settings por Entorno](#9-settings-por-entorno)
10. [Variables de Entorno](#10-variables-de-entorno)
11. [Alcance MVP vs Post-MVP](#11-alcance-mvp-vs-post-mvp)
12. [Orden de Implementación](#12-orden-de-implementación)

---

## 1. Stack y Paquetes

### Ya instalados

| Paquete | Versión | Estado |
|---|---|---|
| Django | 6.0.5 | ✓ instalado |
| djangorestframework | 3.17.1 | ✓ instalado — pendiente integrar |
| psycopg2-binary | 2.9.12 | ✓ instalado — PostgreSQL listo |
| python-decouple | 3.8 | ✓ instalado — pendiente usar |

### Agregar para MVP

| Paquete | Propósito |
|---|---|
| `djangorestframework-simplejwt` | Autenticación JWT stateless |
| `django-cors-headers` | CORS para clientes frontend |
| `django-filter` | Filtrado de querysets por query params |
| `drf-spectacular` | Documentación OpenAPI 3 / Swagger UI automática |

Instalación:
```bash
pip install djangorestframework-simplejwt django-cors-headers django-filter drf-spectacular
pip freeze > requirements/base.txt
```

### Reservado para Post-MVP (no instalar aún)

- `celery` + `redis` — tareas asíncronas (cálculo de costos, notificaciones)
- `django-storages` — almacenamiento de archivos en S3
- `sentry-sdk` — monitoreo de errores en producción
- `gunicorn` — servidor WSGI para producción

---

## 2. Estructura de Directorios

```
logistica-api-claudecode/
│
├── config/                        ← configuración del proyecto Django
│   ├── settings/
│   │   ├── __init__.py            ← selecciona base o prod según DJANGO_ENV
│   │   ├── base.py                ← settings comunes a todos los entornos
│   │   ├── development.py         ← DEBUG=True, SQLite, CORS permisivo
│   │   └── production.py          ← PostgreSQL, ALLOWED_HOSTS, HTTPS
│   ├── urls.py                    ← /api/v1/ + /api/schema/ + /admin/
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                          ← todas las apps custom del proyecto
│   ├── customers/
│   ├── suppliers/
│   ├── products/                  ← reubicar el scaffold actual aquí
│   ├── warehouses/
│   ├── drivers/
│   ├── transport/
│   ├── routes/
│   └── shipments/
│
├── common/                        ← código compartido entre apps
│   ├── __init__.py
│   ├── pagination.py              ← clase StandardPagination
│   ├── permissions.py             ← permisos DRF reutilizables
│   ├── exceptions.py              ← handler de errores global
│   └── mixins.py                  ← mixins de ViewSet reutilizables
│
├── docs/
│   ├── database-schema.md         ← diseño de BD
│   └── architecture.md            ← este archivo
│
├── requirements/
│   ├── base.txt                   ← dependencias comunes
│   ├── development.txt            ← base + herramientas de dev (ipython, etc.)
│   └── production.txt             ← base + gunicorn, sentry, etc.
│
├── .env                           ← variables locales (gitignored)
├── .env.example                   ← plantilla de variables requeridas
├── manage.py
└── CLAUDE.md
```

> **Nota:** El `products/` actual en la raíz debe moverse a `apps/products/` y actualizar su `AppConfig.name` a `'apps.products'`.

---

## 3. Estructura Interna de cada App

Patrón estándar para las 8 apps del proyecto:

```
apps/<nombre>/
├── __init__.py
├── apps.py                        ← AppConfig — name='apps.<nombre>'
├── models.py                      ← modelos según docs/database-schema.md
├── serializers.py                 ← serializers de lectura y escritura
├── views.py                       ← ViewSets
├── urls.py                        ← router.register() y rutas anidadas
├── admin.py                       ← registro en Django Admin
├── filters.py                     ← FilterSet con django-filter
├── permissions.py                 ← permisos específicos de la app (si aplica)
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    └── test_views.py
```

Ejemplo de `apps.py`:
```python
from django.apps import AppConfig

class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.customers'
    verbose_name = 'Clientes'
```

---

## 4. Capas del Sistema

```
HTTP Request
     │
     ▼
┌────────────────────────────────────┐
│  Router / URLs                     │  config/urls.py → apps/<app>/urls.py
│  /api/v1/<recurso>/                │  DRF DefaultRouter + rutas anidadas
└───────────────┬────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│  Middleware                        │  CorsMiddleware · SecurityMiddleware
└───────────────┬────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│  Autenticación                     │  JWTAuthentication (simplejwt)
│  Permisos                          │  IsAuthenticated · custom permissions
└───────────────┬────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│  ViewSet                           │  apps/<app>/views.py
│                                    │  ModelViewSet / custom actions
│                                    │  Aplica filtros, paginación, ordena
└───────────────┬────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│  Serializer                        │  apps/<app>/serializers.py
│                                    │  Validación, deserialización,
│                                    │  serialización de respuesta
└───────────────┬────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│  Model / ORM                       │  apps/<app>/models.py
│                                    │  Django ORM → SQL
└───────────────┬────────────────────┘
                │
                ▼
         PostgreSQL / SQLite
```

---

## 5. Diseño de API

### Prefijo y versionado

```
/api/v1/          ← todos los endpoints REST
/api/schema/      ← OpenAPI 3 JSON (drf-spectacular)
/api/schema/swagger-ui/  ← interfaz Swagger
/api/schema/redoc/       ← interfaz Redoc
/admin/           ← Django Admin
```

### Endpoints MVP

| Módulo | Endpoint | Métodos | Notas |
|---|---|---|---|
| Clientes | `/api/v1/customers/` | GET, POST | Listado y creación |
| Clientes | `/api/v1/customers/{id}/` | GET, PUT, PATCH, DELETE | |
| Proveedores | `/api/v1/suppliers/` | GET, POST | |
| Proveedores | `/api/v1/suppliers/{id}/` | GET, PUT, PATCH, DELETE | |
| Productos | `/api/v1/products/` | GET, POST | |
| Productos | `/api/v1/products/{id}/` | GET, PUT, PATCH, DELETE | |
| Almacenes | `/api/v1/warehouses/` | GET, POST | |
| Almacenes | `/api/v1/warehouses/{id}/` | GET, PUT, PATCH, DELETE | |
| Conductores | `/api/v1/drivers/` | GET, POST | |
| Conductores | `/api/v1/drivers/{id}/` | GET, PUT, PATCH, DELETE | |
| Vehículos | `/api/v1/vehicles/` | GET, POST | |
| Vehículos | `/api/v1/vehicles/{id}/` | GET, PUT, PATCH, DELETE | |
| Rutas | `/api/v1/routes/` | GET, POST | |
| Rutas | `/api/v1/routes/{id}/` | GET, PUT, PATCH, DELETE | |
| Paradas de ruta | `/api/v1/routes/{id}/stops/` | GET, POST | Anidado bajo ruta |
| Envíos | `/api/v1/shipments/` | GET, POST | Entidad central |
| Envíos | `/api/v1/shipments/{id}/` | GET, PUT, PATCH, DELETE | |
| Productos del envío | `/api/v1/shipments/{id}/products/` | GET, POST | Anidado bajo envío |
| Auth | `/api/v1/auth/token/` | POST | Login → JWT |
| Auth | `/api/v1/auth/token/refresh/` | POST | Renovar access token |
| Auth | `/api/v1/auth/token/verify/` | POST | Verificar token |

### Convenciones de respuesta

| Situación | HTTP | Formato |
|---|---|---|
| Éxito (lectura) | 200 | `{...}` u objeto paginado |
| Creación exitosa | 201 | `{...}` objeto creado |
| Error de validación | 400 | `{"field": ["mensaje de error"]}` |
| No autenticado | 401 | `{"detail": "Authentication credentials were not provided."}` |
| Sin permiso | 403 | `{"detail": "You do not have permission..."}` |
| No encontrado | 404 | `{"detail": "Not found."}` |
| Error de servidor | 500 | `{"detail": "Error interno."}` (sin stack trace en producción) |

### Paginación estándar

Definida en `common/pagination.py`. Todas las listas usan este formato:

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/shipments/?page=2",
  "previous": null,
  "results": [...]
}
```

Configuración: página por defecto = 20 · máximo = 100.

---

## 6. Autenticación — JWT

**Paquete:** `djangorestframework-simplejwt`

### Flujo

```
1. POST /api/v1/auth/token/
   Body: { "username": "...", "password": "..." }
   Response: { "access": "<token>", "refresh": "<token>" }

2. Requests autenticadas:
   Header: Authorization: Bearer <access_token>

3. Access token expira en 60 min → renovar:
   POST /api/v1/auth/token/refresh/
   Body: { "refresh": "<refresh_token>" }
   Response: { "access": "<nuevo_access_token>" }
```

### Tiempos de expiración

| Token | Duración |
|---|---|
| Access | 60 minutos |
| Refresh | 7 días |

### Configuración en `settings/base.py`

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

---

## 7. Serializers — Patrón Lectura/Escritura

Para entidades con relaciones (especialmente `Shipment`), separar en tres serializers:

| Serializer | Usado en | Propósito |
|---|---|---|
| `<Model>ListSerializer` | `GET /recurso/` | Campos mínimos, relaciones como ID o string. Rápido, sin N+1 |
| `<Model>DetailSerializer` | `GET /recurso/{id}/` | Relaciones expandidas (nested). Respuesta completa |
| `<Model>WriteSerializer` | `POST / PUT / PATCH` | Acepta IDs de FK, valida reglas de negocio, guarda |

Ejemplo en `views.py`:

```python
class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse', 'route', 'vehicle'
    )

    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ShipmentWriteSerializer
        return ShipmentDetailSerializer
```

> **Regla:** Nunca usar un único `ModelSerializer` para lectura y escritura en entidades con relaciones. El patrón lista/detalle/escritura evita over-fetching y simplifica la validación.

---

## 8. Filtros por Módulo

Todos los ViewSets usan los tres backends configurados globalmente:
- `DjangoFilterBackend` — filtros exactos por campo
- `SearchFilter` — búsqueda de texto libre (`?search=...`)
- `OrderingFilter` — ordenamiento (`?ordering=-created_at`)

| App | Filtros de campo | Búsqueda de texto |
|---|---|---|
| `customers` | `customer_type`, `is_active`, `country` | `name`, `email` |
| `suppliers` | `is_active`, `country` | `name`, `email` |
| `products` | `category`, `supplier`, `is_active` | `name`, `sku` |
| `warehouses` | `city`, `is_active` | `name`, `code` |
| `drivers` | `status`, `license_type` | `national_id`, `license_number` |
| `transport` | `vehicle_type`, `status`, `fuel_type` | `plate` |
| `routes` | `origin_city`, `destination_city`, `is_active` | `name`, `code` |
| `shipments` | `status`, `priority`, `customer`, `vehicle`, `scheduled_date` (rango) | `tracking_code`, `recipient_name` |

---

## 9. Settings por Entorno

### `config/settings/base.py` — común a todos los entornos

```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

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
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Apps del proyecto
    'apps.customers',
    'apps.suppliers',
    'apps.products',
    'apps.warehouses',
    'apps.drivers',
    'apps.transport',
    'apps.routes',
    'apps.shipments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # debe ser el primero
    'django.middleware.security.SecurityMiddleware',
    # ... resto del middleware estándar
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Logistics API',
    'DESCRIPTION': 'API REST para gestión logística de productos de tecnología',
    'VERSION': '1.0.0',
}
```

### `config/settings/development.py`

```python
from .base import *
from decouple import config

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True   # permisivo en desarrollo
```

### `config/settings/production.py`

```python
from .base import *
from decouple import config
import dj_database_url

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: v.split(','))

DATABASES = {
    'default': dj_database_url.config(default=config('DATABASE_URL'))
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=lambda v: v.split(','))

REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
]
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/day',
    'user': '1000/day',
}
```

### `config/settings/__init__.py`

```python
from decouple import config

env = config('DJANGO_ENV', default='development')

if env == 'production':
    from .production import *
else:
    from .development import *
```

---

## 10. Variables de Entorno

Archivo `.env.example` (comprometer en git). El `.env` real va en `.gitignore`.

```env
# Entorno
DJANGO_ENV=development

# Django
SECRET_KEY=cambiar-por-una-clave-segura-en-produccion
DEBUG=True

# Base de datos (solo producción necesita esto)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/logistica_db

# Hosts permitidos (separados por coma)
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (separados por coma)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 11. Alcance MVP vs Post-MVP

### MVP — implementar en fase actual

- [x] Schema de base de datos diseñado (`docs/database-schema.md`)
- [x] Documento de arquitectura (`docs/architecture.md`)
- [ ] Setup de proyecto (settings por entorno, `.env`, paquetes adicionales)
- [ ] CRUD completo para los 8 módulos
- [ ] Autenticación JWT (login, refresh, verify)
- [ ] Paginación estándar en todos los listados
- [ ] Filtros básicos por módulo (ver sección 8)
- [ ] Documentación Swagger automática (`/api/schema/swagger-ui/`)
- [ ] Django Admin configurado para todos los modelos
- [ ] Tests de integración para el módulo `shipments` (entidad central)

### Post-MVP — no planificar aún

| Funcionalidad | Razón de diferir |
|---|---|
| Cálculo automático de `total_cost` | Requiere definir reglas de negocio de tarificación |
| Notificaciones de cambio de estado | Requiere Celery + Redis + canal (email/push) |
| Roles y permisos granulares | Conductor ve solo sus envíos, etc. — requiere diseño adicional |
| Subida de documentos | Requiere almacenamiento externo (S3) |
| Tracking en tiempo real | Requiere WebSocket (Django Channels) |
| Dashboard / métricas | Requiere definir KPIs con el negocio |
| App móvil para conductores | Proyecto separado |

---

## 12. Orden de Implementación

### Fase 1 — Setup base

1. Crear estructura `config/settings/` con base/development/production
2. Crear `common/` con pagination, exceptions, mixins
3. Crear `.env` y `.env.example`
4. Instalar paquetes adicionales y actualizar `requirements/`
5. Configurar `INSTALLED_APPS` y `REST_FRAMEWORK` en `base.py`
6. Configurar `config/urls.py` con prefijo `/api/v1/` y rutas de schema
7. Reubicar `products/` → `apps/products/`

### Fase 2 — Apps sin dependencias (pueden hacerse en paralelo)

- `apps.customers` — modelo → serializers → viewset → urls → admin → filtros
- `apps.suppliers` — ídem

### Fase 3 — Apps con dependencias simples

- `apps.products` — depende de `suppliers`
- `apps.warehouses` — depende de `auth_user`
- `apps.drivers` — depende de `auth_user`

### Fase 4 — Apps con dependencias cruzadas

- `apps.transport` — depende de `drivers`
- `apps.routes` + `RouteStop` — dependencia interna

### Fase 5 — Entidad central

- `apps.shipments` — depende de todos los módulos anteriores
- `ShipmentProduct` (tabla pivote M2M)

### Fase 6 — Cierre MVP

1. Autenticación JWT — urls en `config/urls.py`
2. Verificar Swagger UI en `/api/schema/swagger-ui/`
3. Tests de integración para `shipments`
4. Ejecutar `makemigrations` + `migrate` final
5. Crear superusuario y verificar Admin

---

*Referencia cruzada: ver `docs/database-schema.md` para definición completa de modelos, columnas y relaciones antes de implementar cualquier app.*
