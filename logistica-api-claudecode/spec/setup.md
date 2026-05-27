# Spec: Setup Base — Fase 1

**Scope:** Infraestructura del proyecto. No es un módulo de negocio sino el prerequisito para todos los módulos.
**Output:** Proyecto Django configurado con settings por entorno, DRF integrado, common/ creado, apps/ preparada.

---

## Tareas

### T-01: Instalar paquetes adicionales
- [ ] `pip install djangorestframework-simplejwt django-cors-headers django-filter drf-spectacular dj-database-url`
- [ ] Verificar que todos quedan en `pip freeze`

### T-02: Crear estructura `requirements/`
- [ ] `requirements/base.txt` — todas las dependencias del proyecto
- [ ] `requirements/development.txt` — extiende base, herramientas de desarrollo
- [ ] `requirements/production.txt` — extiende base, gunicorn, dj-database-url

### T-03: Crear `.env` y `.env.example`
- [ ] `.env` — variables reales para desarrollo local (SECRET_KEY, DJANGO_ENV=development)
- [ ] `.env.example` — plantilla con todas las variables requeridas (sin valores reales)

### T-04: Reemplazar `config/settings.py` por paquete `config/settings/`
- [ ] Eliminar `config/settings.py`
- [ ] Crear `config/settings/__init__.py` — selecciona base o producción según `DJANGO_ENV`
- [ ] Crear `config/settings/base.py` — settings comunes: INSTALLED_APPS, MIDDLEWARE, REST_FRAMEWORK, SIMPLE_JWT, SPECTACULAR_SETTINGS
- [ ] Crear `config/settings/development.py` — SQLite, DEBUG=True, CORS permisivo
- [ ] Crear `config/settings/production.py` — PostgreSQL via DATABASE_URL, DEBUG=False, ALLOWED_HOSTS

Verificar que `INSTALLED_APPS` en `base.py` incluya:
- Todos los built-ins de Django
- `rest_framework`, `rest_framework_simplejwt`, `corsheaders`, `django_filters`, `drf_spectacular`
- `apps.products` (único módulo en Fase 1)

### T-05: Crear módulo `common/`
- [ ] `common/__init__.py`
- [ ] `common/pagination.py` — clase `StandardPagination(PageNumberPagination)` con page_size=20, max=100
- [ ] `common/exceptions.py` — handler global de excepciones DRF
- [ ] `common/mixins.py` — mixins reutilizables de ViewSet (placeholder vacío por ahora)
- [ ] `common/permissions.py` — permisos reutilizables (placeholder vacío por ahora)

### T-06: Mover `products/` → `apps/products/`
- [ ] Crear `apps/__init__.py`
- [ ] Crear `apps/products/` con todos los archivos del patrón estándar de app
- [ ] `apps/products/apps.py` — `AppConfig.name = 'apps.products'`
- [ ] `apps/products/models.py` — vacío (se implementa en Fase 3)
- [ ] `apps/products/serializers.py` — vacío (placeholder)
- [ ] `apps/products/views.py` — vacío (placeholder)
- [ ] `apps/products/urls.py` — router vacío
- [ ] `apps/products/admin.py` — vacío
- [ ] `apps/products/filters.py` — vacío (placeholder)
- [ ] `apps/products/migrations/__init__.py`
- [ ] Eliminar directorio `products/` del nivel raíz

### T-07: Actualizar `config/urls.py`
- [ ] Montar `/api/v1/` como prefijo base
- [ ] Incluir `apps.products.urls` bajo `/api/v1/`
- [ ] Agregar endpoints JWT: `/api/v1/auth/token/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/token/verify/`
- [ ] Agregar endpoints drf-spectacular: `/api/schema/`, `/api/schema/swagger-ui/`, `/api/schema/redoc/`
- [ ] Mantener `/admin/`

### T-08: Verificar configuración
- [ ] Ejecutar `python manage.py check` — sin errores
- [ ] Verificar que `python manage.py migrate` corre sin errores

---

## Dependencias previas
Ninguna — esta es la Fase 1, prerequisito de todo.

## Estado
- [x] Spec generado
- [x] Implementado
- [x] Validado — `python manage.py check` 0 errores, migraciones aplicadas
