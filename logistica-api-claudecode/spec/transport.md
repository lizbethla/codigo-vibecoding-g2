# Spec: Transport (Vehicle)

**App Django:** `apps.transport`
**Modelo:** `Vehicle` (no `Transport` — evita tabla confusa `transport_transport`)
**Tabla principal:** `transport_vehicle`
**Dependencias FK:** `apps.drivers` (debe estar implementada)

---

## Tareas

### T-01: Modelo
- [ ] Crear `apps/transport/models.py`
- [ ] Definir `VehicleType(models.TextChoices)` con:
  - `MOTORCYCLE = 'MOTORCYCLE', 'Motocicleta'`
  - `VAN = 'VAN', 'Furgoneta'`
  - `TRUCK = 'TRUCK', 'Camión'`
  - `HEAVY_TRUCK = 'HEAVY_TRUCK', 'Camión pesado'`
  - `REFRIGERATED_TRUCK = 'REFRIGERATED_TRUCK', 'Camión refrigerado'`
  - `CONTAINER = 'CONTAINER', 'Contenedor'`
- [ ] Definir `FuelType(models.TextChoices)` con:
  - `GASOLINE = 'GASOLINE', 'Gasolina'`
  - `DIESEL = 'DIESEL', 'Diésel'`
  - `ELECTRIC = 'ELECTRIC', 'Eléctrico'`
  - `HYBRID = 'HYBRID', 'Híbrido'`
  - `GAS = 'GAS', 'Gas'`
- [ ] Definir `VehicleStatus(models.TextChoices)` con:
  - `AVAILABLE = 'AVAILABLE', 'Disponible'`
  - `IN_USE = 'IN_USE', 'En uso'`
  - `MAINTENANCE = 'MAINTENANCE', 'En mantenimiento'`
  - `RETIRED = 'RETIRED', 'Retirado'`
- [ ] Definir clase `Vehicle` con campos:
  - `driver` — `ForeignKey('drivers.Driver', on_delete=SET_NULL, null=True, blank=True, related_name='vehicles')`
  - `plate` — `CharField(max_length=20, unique=True)`
  - `vehicle_type` — `CharField(max_length=30, choices=VehicleType.choices)`
  - `brand` — `CharField(max_length=100)`
  - `model` — `CharField(max_length=100)`
  - `year` — `PositiveSmallIntegerField()`
  - `capacity_kg` — `DecimalField(max_digits=10, decimal_places=2)`
  - `capacity_m3` — `DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)`
  - `fuel_type` — `CharField(max_length=20, choices=FuelType.choices, default=FuelType.DIESEL)`
  - `status` — `CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.AVAILABLE)`
  - `last_maintenance` — `DateField(null=True, blank=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`: `ordering = ['plate']`, `verbose_name = 'Vehículo'`, `verbose_name_plural = 'Vehículos'`
- [ ] `__str__` retorna `f'{self.plate} — {self.get_vehicle_type_display()}'`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations transport`
- [ ] Verificar que el archivo generado incluye FK a `drivers_driver`

### T-03: Admin
- [ ] Crear `apps/transport/admin.py`
- [ ] `list_display = ['plate', 'vehicle_type', 'brand', 'model', 'year', 'status', 'driver']`
- [ ] `list_filter = ['vehicle_type', 'status', 'fuel_type']`
- [ ] `search_fields = ['plate']`

### T-04: Serializers
- [ ] Crear `apps/transport/serializers.py`
- [ ] `DriverSummarySerializer` — solo lectura: campos `id`, `national_id`, `license_number`, `license_type`; campo calculado `full_name` via `SerializerMethodField` que retorna `obj.user.get_full_name()`
- [ ] `VehicleListSerializer` — campos: `id`, `plate`, `vehicle_type`, `brand`, `model`, `year`, `status`
- [ ] `VehicleDetailSerializer` — campos: todos; `driver` expandido con `DriverSummarySerializer`
- [ ] `VehicleWriteSerializer` — campos: `driver`, `plate`, `vehicle_type`, `brand`, `model`, `year`, `capacity_kg`, `capacity_m3`, `fuel_type`, `status`, `last_maintenance`; `driver` acepta ID (PrimaryKeyRelatedField, allow_null=True)

### T-05: Filtros
- [ ] Crear `apps/transport/filters.py`
- [ ] `VehicleFilter(django_filters.FilterSet)` con:
  - `vehicle_type` — filtro exacto
  - `status` — filtro exacto
  - `fuel_type` — filtro exacto

### T-06: ViewSet
- [ ] Crear `apps/transport/views.py`
- [ ] `VehicleViewSet(viewsets.ModelViewSet)`:
  - `queryset = Vehicle.objects.select_related('driver', 'driver__user')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = VehicleFilter`
  - `search_fields = ['plate']`
  - `ordering_fields = ['plate', 'year', 'status', 'created_at']`
  - `get_serializer_class()` con lógica list/write/detail

### T-07: URLs
- [ ] Crear `apps/transport/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', VehicleViewSet, basename='vehicle')`

### T-08: Registro en proyecto
- [ ] Agregar `'apps.transport'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/vehicles/', include('apps.transport.urls'))` en `config/urls.py`
- [ ] Crear `apps/transport/apps.py` con `name = 'apps.transport'`, `verbose_name = 'Vehículos'`

---

## Dependencias previas
`apps.drivers` — debe estar implementada y migrada.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
