# Alcance del MVP — Logistics API

Documento que define qué entra y qué queda fuera del MVP a desplegar en Railway.

---

## Objetivo del MVP

API REST funcional para gestión logística de productos de tecnología, con autenticación JWT, ocho módulos CRUD completos, documentación Swagger automática y despliegue en Railway con PostgreSQL.

---

## Módulos incluidos (CRUD completo)

| # | Módulo | App Django | Prioridad |
|---|--------|-----------|-----------|
| 1 | Clientes | `apps.customers` | Alta |
| 2 | Proveedores | `apps.suppliers` | Alta |
| 3 | Productos | `apps.products` | Alta |
| 4 | Almacenes | `apps.warehouses` | Alta |
| 5 | Conductores | `apps.drivers` | Media |
| 6 | Vehículos | `apps.transport` | Media |
| 7 | Rutas | `apps.routes` | Media |
| 8 | Envíos | `apps.shipments` | Alta (entidad central) |

Cada módulo incluye:
- Modelo Django según `docs/database-schema.md`
- Serializers con patrón lectura/escritura (List / Detail / Write)
- ViewSet con ModelViewSet
- URLs registradas en router DRF
- Django Admin configurado
- Filtros básicos con `django-filter`

---

## Autenticación

- Sistema de usuarios: `django.contrib.auth` (User de Django built-in)
- Tokens: JWT via `djangorestframework-simplejwt`
- Endpoints:
  - `POST /api/v1/auth/token/` — login → access + refresh token
  - `POST /api/v1/auth/token/refresh/` — renovar access token
  - `POST /api/v1/auth/token/verify/` — verificar token
- Access token: 60 minutos
- Refresh token: 7 días
- Todos los endpoints de la API requieren autenticación (`IsAuthenticated` por defecto)

---

## Funcionalidades transversales

| Funcionalidad | Implementación |
|---|---|
| Paginación | `common/pagination.py` — página 20 items, máximo 100 |
| Filtros | `DjangoFilterBackend` + `SearchFilter` + `OrderingFilter` |
| Documentación API | `drf-spectacular` → `/api/schema/swagger-ui/` |
| Gestión admin | Django Admin en `/admin/` con todos los modelos |
| CORS | `django-cors-headers` — permisivo en desarrollo |
| Variables de entorno | `python-decouple` con archivo `.env` |

---

## Estructura de settings por entorno

| Entorno | Archivo | DB | DEBUG |
|---|---|---|---|
| Desarrollo | `config/settings/development.py` | SQLite | True |
| Producción (Railway) | `config/settings/production.py` | PostgreSQL | False |

---

## Despliegue en Railway

Variables de entorno requeridas en Railway:

```env
DJANGO_ENV=production
SECRET_KEY=<clave segura generada>
DATABASE_URL=<postgresql://... provisto por Railway>
ALLOWED_HOSTS=<dominio.railway.app>
CORS_ALLOWED_ORIGINS=<frontend-url>
```

Pasos de despliegue:
1. `pip install gunicorn` y añadir a `requirements/production.txt`
2. `Procfile` con `web: gunicorn config.wsgi:application`
3. `python manage.py collectstatic --noinput` en build command
4. `python manage.py migrate` en release command

---

## Fuera del MVP (Post-MVP)

| Funcionalidad | Razón de diferir |
|---|---|
| Cálculo automático de `total_cost` | Requiere definir reglas de negocio de tarificación |
| Notificaciones de cambio de estado | Requiere Celery + Redis + canal (email/push) |
| Roles granulares por usuario | Conductor ve solo sus envíos — requiere diseño adicional |
| Subida de documentos / imágenes | Requiere almacenamiento externo (S3 / Railway Volumes) |
| Tracking en tiempo real | Requiere WebSocket (Django Channels) |
| Dashboard / métricas | Requiere definir KPIs con el negocio |
| App móvil para conductores | Proyecto separado |
| Rate limiting | Configurado en `production.py` pero no prioritario para MVP |

---

## Orden de implementación (siguiendo SDD)

Fase 1 — Setup base (prerequisito para todo lo demás):
- Restructurar settings en `config/settings/`
- Crear `common/` con pagination y exceptions
- Instalar paquetes adicionales
- Configurar `INSTALLED_APPS` y `REST_FRAMEWORK`
- Mover `products/` → `apps/products/`

Fase 2 — Apps sin dependencias:
- `customers`, `suppliers`

Fase 3 — Apps con dependencias simples:
- `products` (depende de suppliers), `warehouses`, `drivers`

Fase 4 — Apps con dependencias cruzadas:
- `transport` (depende de drivers), `routes`

Fase 5 — Entidad central:
- `shipments` (depende de todo lo anterior)

Fase 6 — Cierre MVP:
- Auth JWT, Swagger, migraciones finales, superusuario, verificación Railway
