# Spec: Customers

**App Django:** `apps.customers`
**Tabla principal:** `customers_customer`
**Dependencias FK:** ninguna (sin dependencias de otras apps custom)

---

## Tareas

### T-01: Modelo
- [ ] Crear `apps/customers/models.py`
- [ ] Definir `CustomerType(models.TextChoices)` con:
  - `COMPANY = 'COMPANY', 'Empresa'`
  - `INDIVIDUAL = 'INDIVIDUAL', 'Persona natural'`
- [ ] Definir clase `Customer` con campos:
  - `name` — `CharField(max_length=200)`, NOT NULL
  - `customer_type` — `CharField(max_length=10, choices=CustomerType.choices, default=CustomerType.COMPANY)`
  - `tax_id` — `CharField(max_length=50, unique=True, null=True, blank=True)`
  - `email` — `EmailField(unique=True)`, NOT NULL
  - `phone` — `CharField(max_length=20, null=True, blank=True)`
  - `address` — `TextField(null=True, blank=True)`
  - `city` — `CharField(max_length=100, null=True, blank=True)`
  - `country` — `CharField(max_length=100, default='Colombia')`
  - `is_active` — `BooleanField(default=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`: `ordering = ['name']`, `verbose_name = 'Cliente'`, `verbose_name_plural = 'Clientes'`
- [ ] `__str__` retorna `self.name`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations customers`
- [ ] Verificar que el archivo generado contiene todos los campos

### T-03: Admin
- [ ] Registrar `Customer` en `apps/customers/admin.py` con `@admin.register`
- [ ] `list_display = ['name', 'customer_type', 'email', 'country', 'is_active', 'created_at']`
- [ ] `list_filter = ['customer_type', 'is_active', 'country']`
- [ ] `search_fields = ['name', 'email', 'tax_id']`

### T-04: Serializers
- [ ] Crear `apps/customers/serializers.py`
- [ ] `CustomerListSerializer` — campos: `id`, `name`, `customer_type`, `email`, `is_active`
- [ ] `CustomerDetailSerializer` — campos: todos (`__all__`)
- [ ] `CustomerWriteSerializer` — campos: `name`, `customer_type`, `tax_id`, `email`, `phone`, `address`, `city`, `country`, `is_active`; validar que `email` no esté duplicado

### T-05: Filtros
- [ ] Crear `apps/customers/filters.py`
- [ ] `CustomerFilter(django_filters.FilterSet)` con:
  - `customer_type` — filtro exacto
  - `is_active` — filtro exacto
  - `country` — filtro exacto

### T-06: ViewSet
- [ ] Crear `apps/customers/views.py`
- [ ] `CustomerViewSet(viewsets.ModelViewSet)`:
  - `queryset = Customer.objects.all()`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = CustomerFilter`
  - `search_fields = ['name', 'email']`
  - `ordering_fields = ['name', 'created_at']`
  - `get_serializer_class()` con lógica list → `CustomerListSerializer`, create/update → `CustomerWriteSerializer`, retrieve → `CustomerDetailSerializer`

### T-07: URLs
- [ ] Crear `apps/customers/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', CustomerViewSet, basename='customer')`
- [ ] `urlpatterns = router.urls`

### T-08: Registro en proyecto
- [ ] Agregar `'apps.customers'` a `INSTALLED_APPS` en `config/settings/base.py`
- [ ] Agregar `path('api/v1/customers/', include('apps.customers.urls'))` en `config/urls.py`
- [ ] Crear `apps/customers/apps.py` con `name = 'apps.customers'`, `verbose_name = 'Clientes'`

---

## Dependencias previas
Ninguna — puede implementarse directamente sobre el setup base (Fase 1).

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
