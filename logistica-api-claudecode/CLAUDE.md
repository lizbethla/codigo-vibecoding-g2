# CLAUDE.md

Este archivo proporciona instrucciones a Claude Code (claude.ai/code) para trabajar con este repositorio.

## Reglas de idioma

- **Comunicación y documentación** (respuestas, comentarios, docstrings, archivos `.md`): siempre en **español**.
- **Código y desarrollo** (nombres de variables, funciones, clases, carpetas, archivos, tablas, columnas, rutas, ramas git, mensajes de commit): siempre en **inglés**.

## Proyecto

API REST con Django 6.0 para gestión logística/productos. Python 3.13. DRF 3.17, JWT, CORS, django-filter, drf-spectacular integrados. Entorno virtual en `.venv/`.

**Documentación de referencia** — leer antes de cualquier tarea de desarrollo:

@docs/architecture.md
@docs/database-schema.md
@docs/mvp-scope.md

## Alcance y módulos

API REST Full siguiendo buenas prácticas de DRF. Ocho módulos principales:

| Módulo | App Django | Descripción |
|--------|-----------|-------------|
| Cliente | `apps.customers` | Empresa o persona que genera envíos |
| Envío | `apps.shipments` | Unidad central de negocio: origen, destino, estado, fecha de entrega, costo calculado |
| Producto | `apps.products` | Productos de tecnología a enviar |
| Transporte | `apps.transport` | Medio de entrega de productos al cliente |
| Conductor | `apps.drivers` | Persona asignada al transporte |
| Ruta | `apps.routes` | Secuencia de paradas del transporte |
| Almacén | `apps.warehouses` | Punto de partida y almacenamiento de productos |
| Proveedor | `apps.suppliers` | Empresas que venden los productos |

**Estado:** Fase 1 (setup) completada. Listo para implementar módulos vía SDD.

## Comandos

**Entorno virtual:** Siempre activar antes de ejecutar cualquier comando en el proyecto.

```bash
# Activar entorno virtual (Windows)
.venv\Scripts\activate

# Activar entorno virtual (Unix/Mac)
source .venv/bin/activate
```

**Servidor de desarrollo — SIEMPRE MANUAL, Claude nunca lo ejecuta:**
```bash
python manage.py runserver   # http://127.0.0.1:8000 — el usuario lo inicia manualmente
```

Claude puede ejecutar todos los demás comandos:

```bash
# Migraciones (siempre ambos pasos tras cambios en modelos)
python manage.py makemigrations
python manage.py migrate

# Tests
python manage.py test

# Superusuario admin
python manage.py createsuperuser

# Validar configuración
python manage.py check
```

## Settings y variables de entorno

Settings divididos por entorno en `config/settings/`:
- `base.py` — común a todos los entornos
- `development.py` — SQLite, DEBUG=True, CORS permisivo
- `production.py` — PostgreSQL via DATABASE_URL, DEBUG=False

Variables de entorno en `.env` (ver `.env.example`). Usar `decouple.config()` para cualquier valor sensible.

## Convención de estructura de apps

Todas las apps van dentro de `apps/`. Cada app sigue:
```
apps/<module>/
  apps.py          # AppConfig con name='apps.<module>'
  models.py
  serializers.py   # List / Detail / Write serializers
  views.py         # ModelViewSet con get_serializer_class()
  urls.py          # DefaultRouter + register()
  admin.py
  filters.py       # FilterSet con django-filter
  migrations/
```

Las URLs de cada app se incluyen en `config/urls.py` con `include('apps.<module>.urls')` bajo el prefijo `api/v1/`.

## Base de datos

SQLite en desarrollo (`db.sqlite3`). PostgreSQL en producción via `DATABASE_URL` en `.env`.

## Módulo common/

Código compartido en `common/`:
- `pagination.py` — `StandardPagination` (page_size=20, max=100)
- `exceptions.py` — handler global de excepciones DRF
- `mixins.py` — mixins reutilizables de ViewSet
- `permissions.py` — permisos reutilizables

## Sin Git ni CI

El repo no tiene historial git ni pipeline CI. Inicializar con `git init` y crear `.gitignore` (incluir `db.sqlite3`, `.venv/`, `*.pyc`, `.env`) antes del primer commit.

## Metodología de desarrollo — SDD

Todo desarrollo de módulos sigue el flujo **Spec Driven Development** gestionado por el agente Orquestador.

**Flujo obligatorio por módulo:** `Spec → Implement → Validate`

El agente Orquestador coordina este flujo. Consultar `.claude/agents/orchestrator.md` antes de iniciar cualquier módulo.

Los cuatro agentes del proyecto:

| Agente | Archivo | Responsabilidad |
|--------|---------|----------------|
| Orquestador | `.claude/agents/orchestrator.md` | Coordina el flujo SDD, no escribe código |
| Spec | `.claude/agents/spec.md` | Genera `spec/<module>.md` con tareas exactas |
| Implement | `.claude/agents/implement.md` | Escribe el código Django/DRF |
| Validator | `.claude/agents/validator.md` | Revisa el código, reporta errores en `spec/validation/` |

**Alcance MVP:** ver `docs/mvp-scope.md`
