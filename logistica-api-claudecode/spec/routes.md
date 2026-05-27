# Spec: Routes

**App Django:** `apps.routes`
**Modelos:** `Route` + `RouteStop`
**Tablas:** `routes_route` + `routes_routestop`
**Dependencias FK:** ninguna de apps custom (solo dependencia interna entre Route y RouteStop)

---

## Tareas

### T-01: Modelo Route
- [ ] Crear `apps/routes/models.py`
- [ ] Definir clase `Route` con campos:
  - `name` — `CharField(max_length=150)`
  - `code` — `CharField(max_length=30, unique=True)`
  - `origin_city` — `CharField(max_length=100)`
  - `destination_city` — `CharField(max_length=100)`
  - `distance_km` — `DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)`
  - `estimated_hours` — `DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)`
  - `is_active` — `BooleanField(default=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`: `ordering = ['name']`, `verbose_name = 'Ruta'`, `verbose_name_plural = 'Rutas'`
- [ ] `__str__` retorna `f'{self.code} — {self.origin_city} → {self.destination_city}'`

### T-02: Modelo RouteStop
- [ ] En el mismo `models.py`, definir clase `RouteStop` con campos:
  - `route` — `ForeignKey('routes.Route', on_delete=CASCADE, related_name='stops')`
  - `stop_name` — `CharField(max_length=150)`
  - `order` — `PositiveSmallIntegerField()`
  - `estimated_arrival_hours` — `DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)`
  - `notes` — `TextField(null=True, blank=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`:
  - `unique_together = [('route', 'order')]`
  - `ordering = ['route', 'order']`
  - `verbose_name = 'Parada'`
  - `verbose_name_plural = 'Paradas'`
- [ ] `__str__` retorna `f'Parada {self.order}: {self.stop_name}'`

### T-03: Migración
- [ ] Ejecutar `python manage.py makemigrations routes`
- [ ] Verificar que el archivo genera ambas tablas y la FK de RouteStop a Route

### T-04: Admin
- [ ] Crear `apps/routes/admin.py`
- [ ] Definir `RouteStopInline(admin.TabularInline)` con `model = RouteStop`, `extra = 1`
- [ ] `@admin.register(Route)` con:
  - `list_display = ['code', 'name', 'origin_city', 'destination_city', 'is_active']`
  - `list_filter = ['is_active', 'origin_city', 'destination_city']`
  - `search_fields = ['name', 'code']`
  - `inlines = [RouteStopInline]`
- [ ] `@admin.register(RouteStop)` con:
  - `list_display = ['route', 'order', 'stop_name', 'estimated_arrival_hours']`

### T-05: Serializers
- [ ] Crear `apps/routes/serializers.py`
- [ ] `RouteStopSerializer` — campos: `id`, `stop_name`, `order`, `estimated_arrival_hours`, `notes` (usado en list y detail de stops)
- [ ] `RouteStopWriteSerializer` — campos: `stop_name`, `order`, `estimated_arrival_hours`, `notes`
- [ ] `RouteListSerializer` — campos: `id`, `code`, `name`, `origin_city`, `destination_city`, `is_active`
- [ ] `RouteDetailSerializer` — campos: todos los de Route + campo `stops` como lista nested con `RouteStopSerializer` (many=True, read_only=True, source='stops.all')
- [ ] `RouteWriteSerializer` — campos: `name`, `code`, `origin_city`, `destination_city`, `distance_km`, `estimated_hours`, `is_active`

### T-06: Filtros
- [ ] Crear `apps/routes/filters.py`
- [ ] `RouteFilter(django_filters.FilterSet)` con:
  - `origin_city` — filtro exacto
  - `destination_city` — filtro exacto
  - `is_active` — filtro exacto

### T-07: ViewSets
- [ ] Crear `apps/routes/views.py`
- [ ] `RouteViewSet(viewsets.ModelViewSet)`:
  - `queryset = Route.objects.prefetch_related('stops')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = RouteFilter`
  - `search_fields = ['name', 'code']`
  - `ordering_fields = ['name', 'code', 'origin_city', 'destination_city', 'created_at']`
  - `get_serializer_class()` con lógica list/write/detail
- [ ] `RouteStopViewSet(viewsets.ModelViewSet)`:
  - `permission_classes = [IsAuthenticated]`
  - `get_queryset()` filtra por `route_pk` del URL kwargs: `RouteStop.objects.filter(route_id=self.kwargs['route_pk'])`
  - `perform_create()` inyecta `route_id=self.kwargs['route_pk']`
  - `get_serializer_class()`: write actions → `RouteStopWriteSerializer`, resto → `RouteStopSerializer`

### T-08: URLs con rutas anidadas
- [ ] Crear `apps/routes/urls.py`
- [ ] Usar dos routers:
  - `router = DefaultRouter()` → `router.register(r'', RouteViewSet, basename='route')`
  - `stops_router = NestedSimpleRouter` o implementación manual con `routes_router`:
    - Ruta anidada manual: `path('<int:route_pk>/stops/', RouteStopViewSet.as_view({...}))` y `path('<int:route_pk>/stops/<int:pk>/', RouteStopViewSet.as_view({...}))`
  - **Nota:** sin instalar `drf-nested-routers`, implementar las rutas anidadas manualmente con `path()`

**Implementación manual de rutas anidadas:**
```python
stops_list = RouteStopViewSet.as_view({'get': 'list', 'post': 'create'})
stops_detail = RouteStopViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = router.urls + [
    path('<int:route_pk>/stops/', stops_list, name='route-stops-list'),
    path('<int:route_pk>/stops/<int:pk>/', stops_detail, name='route-stops-detail'),
]
```

### T-09: Registro en proyecto
- [ ] Agregar `'apps.routes'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/routes/', include('apps.routes.urls'))` en `config/urls.py`
- [ ] Crear `apps/routes/apps.py` con `name = 'apps.routes'`, `verbose_name = 'Rutas'`

---

## Dependencias previas
Ninguna de otras apps custom. Puede implementarse en paralelo con `transport`.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
