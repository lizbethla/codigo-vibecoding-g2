# Spec: Swagger UI — Fase 6

**Scope:** Configuración y mejora de la documentación OpenAPI automática generada por drf-spectacular.
**Nota:** Los endpoints `/api/schema/`, `/api/schema/swagger-ui/` y `/api/schema/redoc/` ya están conectados desde la Fase 1. Lo que falta es afinar la configuración para que la UI sea usable.

---

## Tareas

### T-01: Configurar SPECTACULAR_SETTINGS en `config/settings/base.py`
- [ ] Agregar `SCHEMA_PATH_PREFIX = r'/api/v1'` — strips el prefijo `/api/v1` al generar tags, así los endpoints se agrupan por recurso (`customers`, `suppliers`, etc.) y no por `v1`
- [ ] Agregar `SORT_OPERATIONS = False` — mantiene el orden natural de los endpoints (list, create, retrieve, update, destroy)
- [ ] Agregar `COMPONENT_SPLIT_REQUEST = True` — genera schemas separados para request y response, mejora la documentación de los serializers de lectura vs escritura

### T-02: Agregar tags a cada ViewSet con `extend_schema_view`
Aplicar `@extend_schema_view` en cada ViewSet para etiquetar todos sus endpoints bajo el mismo tag en español. Los tags se mostrarán como secciones colapsables en la Swagger UI.

ViewSets a etiquetar:
- `CustomerViewSet` → tag `'Clientes'`
- `SupplierViewSet` → tag `'Proveedores'`
- `ProductViewSet` → tag `'Productos'`
- `WarehouseViewSet` → tag `'Almacenes'`
- `DriverViewSet` → tag `'Conductores'`
- `VehicleViewSet` → tag `'Vehículos'`
- `RouteViewSet` → tag `'Rutas'`
- `RouteStopViewSet` → tag `'Rutas'` (misma sección que Route)
- `ShipmentViewSet` → tag `'Envíos'`
- `ShipmentProductViewSet` → tag `'Envíos'` (misma sección que Shipment)

Patrón a aplicar en cada `views.py`:
```python
from drf_spectacular.utils import extend_schema_view, extend_schema

@extend_schema_view(
    list=extend_schema(tags=['<Tag>']),
    create=extend_schema(tags=['<Tag>']),
    retrieve=extend_schema(tags=['<Tag>']),
    update=extend_schema(tags=['<Tag>']),
    partial_update=extend_schema(tags=['<Tag>']),
    destroy=extend_schema(tags=['<Tag>']),
)
class <Model>ViewSet(viewsets.ModelViewSet):
    ...
```

### T-03: Verificar generación del schema
- [ ] Ejecutar `python manage.py spectacular --validate --fail-on-warn` para validar el schema sin errores ni advertencias

---

## Dependencias previas
Todos los módulos de Fases 1–5 implementados.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `spectacular --validate --fail-on-warn` exit 0, 0 warnings, 0 errors
