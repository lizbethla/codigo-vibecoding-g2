# Spec: Warehouses

**App Django:** `apps.warehouses`
**Tabla principal:** `warehouses_warehouse`
**Dependencias FK:** `django.contrib.auth` (User built-in — ya disponible)

---

## Tareas

### T-01: Modelo
- [ ] Crear `apps/warehouses/models.py`
- [ ] Definir clase `Warehouse` con campos:
  - `manager` — `ForeignKey(settings.AUTH_USER_MODEL, on_delete=SET_NULL, null=True, blank=True, related_name='managed_warehouses')`
  - `name` — `CharField(max_length=150)`
  - `code` — `CharField(max_length=20, unique=True)`
  - `address` — `TextField()`
  - `city` — `CharField(max_length=100)`
  - `country` — `CharField(max_length=100, default='Colombia')`
  - `latitude` — `DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - `longitude` — `DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - `capacity_m3` — `DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)`
  - `is_active` — `BooleanField(default=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] Usar `from django.conf import settings` para referenciar AUTH_USER_MODEL
- [ ] `Meta`: `ordering = ['name']`, `verbose_name = 'Almacén'`, `verbose_name_plural = 'Almacenes'`
- [ ] `__str__` retorna `f'{self.code} — {self.name}'`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations warehouses`
- [ ] Verificar que el archivo generado incluye FK nullable a `auth_user`

### T-03: Admin
- [ ] Crear `apps/warehouses/admin.py`
- [ ] `list_display = ['code', 'name', 'city', 'manager', 'is_active', 'created_at']`
- [ ] `list_filter = ['city', 'is_active']`
- [ ] `search_fields = ['name', 'code']`

### T-04: Serializers
- [ ] Crear `apps/warehouses/serializers.py`
- [ ] `WarehouseListSerializer` — campos: `id`, `code`, `name`, `city`, `country`, `is_active`
- [ ] `WarehouseDetailSerializer` — campos: todos; campo `manager` como objeto con `id`, `username`, `first_name`, `last_name` (nested read-only)
- [ ] `WarehouseWriteSerializer` — campos: `manager`, `name`, `code`, `address`, `city`, `country`, `latitude`, `longitude`, `capacity_m3`, `is_active`; `manager` acepta ID (PrimaryKeyRelatedField, allow_null=True)

### T-05: Filtros
- [ ] Crear `apps/warehouses/filters.py`
- [ ] `WarehouseFilter(django_filters.FilterSet)` con:
  - `city` — filtro exacto
  - `is_active` — filtro exacto

### T-06: ViewSet
- [ ] Crear `apps/warehouses/views.py`
- [ ] `WarehouseViewSet(viewsets.ModelViewSet)`:
  - `queryset = Warehouse.objects.select_related('manager')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = WarehouseFilter`
  - `search_fields = ['name', 'code']`
  - `ordering_fields = ['name', 'code', 'city', 'created_at']`
  - `get_serializer_class()` con lógica list/write/detail

### T-07: URLs
- [ ] Crear `apps/warehouses/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', WarehouseViewSet, basename='warehouse')`

### T-08: Registro en proyecto
- [ ] Agregar `'apps.warehouses'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/warehouses/', include('apps.warehouses.urls'))` en `config/urls.py`
- [ ] Crear `apps/warehouses/apps.py` con `name = 'apps.warehouses'`, `verbose_name = 'Almacenes'`

---

## Dependencias previas
Solo `django.contrib.auth` (built-in, siempre disponible). Sin dependencias de otras apps custom.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
