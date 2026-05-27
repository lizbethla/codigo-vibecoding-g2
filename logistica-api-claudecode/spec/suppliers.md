# Spec: Suppliers

**App Django:** `apps.suppliers`
**Tabla principal:** `suppliers_supplier`
**Dependencias FK:** ninguna (sin dependencias de otras apps custom)

---

## Tareas

### T-01: Modelo
- [ ] Crear `apps/suppliers/models.py`
- [ ] Definir clase `Supplier` con campos:
  - `name` — `CharField(max_length=200)`, NOT NULL
  - `contact_name` — `CharField(max_length=150, null=True, blank=True)`
  - `email` — `EmailField(unique=True)`, NOT NULL
  - `phone` — `CharField(max_length=20, null=True, blank=True)`
  - `address` — `TextField(null=True, blank=True)`
  - `city` — `CharField(max_length=100, null=True, blank=True)`
  - `country` — `CharField(max_length=100, default='Colombia')`
  - `tax_id` — `CharField(max_length=50, unique=True, null=True, blank=True)`
  - `is_active` — `BooleanField(default=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`: `ordering = ['name']`, `verbose_name = 'Proveedor'`, `verbose_name_plural = 'Proveedores'`
- [ ] `__str__` retorna `self.name`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations suppliers`
- [ ] Verificar que el archivo generado contiene todos los campos

### T-03: Admin
- [ ] Registrar `Supplier` en `apps/suppliers/admin.py` con `@admin.register`
- [ ] `list_display = ['name', 'contact_name', 'email', 'country', 'is_active', 'created_at']`
- [ ] `list_filter = ['is_active', 'country']`
- [ ] `search_fields = ['name', 'email', 'tax_id']`

### T-04: Serializers
- [ ] Crear `apps/suppliers/serializers.py`
- [ ] `SupplierListSerializer` — campos: `id`, `name`, `email`, `country`, `is_active`
- [ ] `SupplierDetailSerializer` — campos: todos (`__all__`)
- [ ] `SupplierWriteSerializer` — campos: `name`, `contact_name`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `is_active`; validar que `email` no esté duplicado

### T-05: Filtros
- [ ] Crear `apps/suppliers/filters.py`
- [ ] `SupplierFilter(django_filters.FilterSet)` con:
  - `is_active` — filtro exacto
  - `country` — filtro exacto

### T-06: ViewSet
- [ ] Crear `apps/suppliers/views.py`
- [ ] `SupplierViewSet(viewsets.ModelViewSet)`:
  - `queryset = Supplier.objects.all()`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = SupplierFilter`
  - `search_fields = ['name', 'email']`
  - `ordering_fields = ['name', 'created_at']`
  - `get_serializer_class()` con lógica list → `SupplierListSerializer`, create/update → `SupplierWriteSerializer`, retrieve → `SupplierDetailSerializer`

### T-07: URLs
- [ ] Crear `apps/suppliers/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', SupplierViewSet, basename='supplier')`
- [ ] `urlpatterns = router.urls`

### T-08: Registro en proyecto
- [ ] Agregar `'apps.suppliers'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/suppliers/', include('apps.suppliers.urls'))` en `config/urls.py`
- [ ] Crear `apps/suppliers/apps.py` con `name = 'apps.suppliers'`, `verbose_name = 'Proveedores'`

---

## Dependencias previas
Ninguna — puede implementarse directamente sobre el setup base (Fase 1).

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
