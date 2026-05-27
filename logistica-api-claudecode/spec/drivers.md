# Spec: Drivers

**App Django:** `apps.drivers`
**Tabla principal:** `drivers_driver`
**Dependencias FK:** `django.contrib.auth` (User built-in — ya disponible)

**Patrón especial:** perfil OneToOne sobre `auth_user`. El nombre, email e `is_active` del conductor se leen de `driver.user.*` — no se duplican en este modelo.

---

## Tareas

### T-01: Modelo
- [ ] Crear `apps/drivers/models.py`
- [ ] Definir `LicenseType(models.TextChoices)` con:
  - `A = 'A', 'Motocicletas'`
  - `B = 'B', 'Vehículos livianos'`
  - `C = 'C', 'Vehículos pesados'`
  - `CE = 'CE', 'Vehículos articulados pesados'`
  - `BTP = 'BTP', 'Transporte público'`
- [ ] Definir `DriverStatus(models.TextChoices)` con:
  - `AVAILABLE = 'AVAILABLE', 'Disponible'`
  - `ON_ROUTE = 'ON_ROUTE', 'En ruta'`
  - `OFF_DUTY = 'OFF_DUTY', 'Fuera de servicio'`
  - `SUSPENDED = 'SUSPENDED', 'Suspendido'`
- [ ] Definir clase `Driver` con campos:
  - `user` — `OneToOneField(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name='driver_profile')`
  - `license_number` — `CharField(max_length=50, unique=True)`
  - `license_type` — `CharField(max_length=20, choices=LicenseType.choices)`
  - `license_expiry` — `DateField()`
  - `phone` — `CharField(max_length=20)`
  - `status` — `CharField(max_length=20, choices=DriverStatus.choices, default=DriverStatus.AVAILABLE)`
  - `date_of_birth` — `DateField(null=True, blank=True)`
  - `national_id` — `CharField(max_length=50, unique=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] Usar `from django.conf import settings` para referenciar AUTH_USER_MODEL
- [ ] `Meta`: `ordering = ['user__last_name', 'user__first_name']`, `verbose_name = 'Conductor'`, `verbose_name_plural = 'Conductores'`
- [ ] `__str__` retorna `f'{self.user.get_full_name()} — {self.license_number}'`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations drivers`
- [ ] Verificar que el archivo generado incluye OneToOne a `auth_user`

### T-03: Admin
- [ ] Crear `apps/drivers/admin.py`
- [ ] `list_display = ['__str__', 'license_type', 'license_number', 'status', 'license_expiry']`
- [ ] `list_filter = ['status', 'license_type']`
- [ ] `search_fields = ['national_id', 'license_number', 'user__first_name', 'user__last_name']`

### T-04: Serializers
- [ ] Crear `apps/drivers/serializers.py`
- [ ] `DriverUserSerializer` — serializer de solo lectura para el campo `user`: campos `id`, `username`, `first_name`, `last_name`, `email`
- [ ] `DriverListSerializer` — campos: `id`, `user` (nested con `DriverUserSerializer`), `license_type`, `status`, `national_id`
- [ ] `DriverDetailSerializer` — campos: todos los del Driver + `user` expandido con `DriverUserSerializer`
- [ ] `DriverWriteSerializer` — campos: `user`, `license_number`, `license_type`, `license_expiry`, `phone`, `status`, `date_of_birth`, `national_id`; `user` acepta ID (PrimaryKeyRelatedField)

### T-05: Filtros
- [ ] Crear `apps/drivers/filters.py`
- [ ] `DriverFilter(django_filters.FilterSet)` con:
  - `status` — filtro exacto
  - `license_type` — filtro exacto

### T-06: ViewSet
- [ ] Crear `apps/drivers/views.py`
- [ ] `DriverViewSet(viewsets.ModelViewSet)`:
  - `queryset = Driver.objects.select_related('user')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = DriverFilter`
  - `search_fields = ['national_id', 'license_number']`
  - `ordering_fields = ['status', 'license_expiry', 'created_at']`
  - `get_serializer_class()` con lógica list/write/detail

### T-07: URLs
- [ ] Crear `apps/drivers/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', DriverViewSet, basename='driver')`

### T-08: Registro en proyecto
- [ ] Agregar `'apps.drivers'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/drivers/', include('apps.drivers.urls'))` en `config/urls.py`
- [ ] Crear `apps/drivers/apps.py` con `name = 'apps.drivers'`, `verbose_name = 'Conductores'`

---

## Dependencias previas
Solo `django.contrib.auth` (built-in). Sin dependencias de otras apps custom. Puede implementarse en paralelo con `warehouses`.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
