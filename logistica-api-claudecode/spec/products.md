# Spec: Products

**App Django:** `apps.products`
**Tabla principal:** `products_product`
**Dependencias FK:** `apps.suppliers` (debe estar implementada)

---

## Tareas

### T-01: Modelo
- [ ] Editar `apps/products/models.py`
- [ ] Definir `ProductCategory(models.TextChoices)` con:
  - `LAPTOP = 'LAPTOP', 'Laptop'`
  - `DESKTOP = 'DESKTOP', 'Computador de escritorio'`
  - `MOBILE = 'MOBILE', 'Móvil'`
  - `TABLET = 'TABLET', 'Tableta'`
  - `PERIPHERAL = 'PERIPHERAL', 'Periférico'`
  - `NETWORKING = 'NETWORKING', 'Redes'`
  - `STORAGE = 'STORAGE', 'Almacenamiento'`
  - `OTHER = 'OTHER', 'Otro'`
- [ ] Definir clase `Product` con campos:
  - `supplier` — `ForeignKey('suppliers.Supplier', on_delete=SET_NULL, null=True, blank=True, related_name='products')`
  - `sku` — `CharField(max_length=100, unique=True)`
  - `name` — `CharField(max_length=200)`
  - `description` — `TextField(null=True, blank=True)`
  - `category` — `CharField(max_length=50, choices=ProductCategory.choices)`
  - `unit_price` — `DecimalField(max_digits=12, decimal_places=2)`
  - `weight_kg` — `DecimalField(max_digits=8, decimal_places=3, default=0)`
  - `dimensions_cm` — `CharField(max_length=50, null=True, blank=True)`
  - `stock_quantity` — `PositiveIntegerField(default=0)`
  - `is_active` — `BooleanField(default=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] `Meta`: `ordering = ['name']`, `verbose_name = 'Producto'`, `verbose_name_plural = 'Productos'`
- [ ] `__str__` retorna `f'{self.sku} — {self.name}'`

### T-02: Migración
- [ ] Ejecutar `python manage.py makemigrations products`
- [ ] Verificar que el archivo generado incluye FK a `suppliers_supplier`

### T-03: Admin
- [ ] Editar `apps/products/admin.py`
- [ ] `list_display = ['sku', 'name', 'category', 'supplier', 'unit_price', 'stock_quantity', 'is_active']`
- [ ] `list_filter = ['category', 'is_active', 'supplier']`
- [ ] `search_fields = ['name', 'sku']`

### T-04: Serializers
- [ ] Editar `apps/products/serializers.py`
- [ ] `ProductListSerializer` — campos: `id`, `sku`, `name`, `category`, `unit_price`, `stock_quantity`, `is_active`
- [ ] `ProductDetailSerializer` — campos: todos (`__all__`); campo `supplier` como objeto anidado con `id` y `name` (usar `SerializerMethodField` o nested serializer de solo lectura)
- [ ] `ProductWriteSerializer` — campos: `supplier`, `sku`, `name`, `description`, `category`, `unit_price`, `weight_kg`, `dimensions_cm`, `stock_quantity`, `is_active`; `supplier` acepta ID (PrimaryKeyRelatedField)

### T-05: Filtros
- [ ] Editar `apps/products/filters.py`
- [ ] `ProductFilter(django_filters.FilterSet)` con:
  - `category` — filtro exacto
  - `supplier` — filtro exacto (por id)
  - `is_active` — filtro exacto

### T-06: ViewSet
- [ ] Editar `apps/products/views.py`
- [ ] `ProductViewSet(viewsets.ModelViewSet)`:
  - `queryset = Product.objects.select_related('supplier')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = ProductFilter`
  - `search_fields = ['name', 'sku']`
  - `ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']`
  - `get_serializer_class()` con lógica list/write/detail

### T-07: URLs
- [ ] Editar `apps/products/urls.py`
- [ ] `DefaultRouter` con `router.register(r'', ProductViewSet, basename='product')`

### T-08: Registro en proyecto
- [ ] Verificar que `'apps.products'` ya está en `INSTALLED_APPS` (fue agregado en Fase 1)
- [ ] Verificar que `config/urls.py` ya incluye `apps.products.urls` (fue agregado en Fase 1)
- [ ] Verificar que `apps/products/apps.py` tiene `name = 'apps.products'`

---

## Dependencias previas
`apps.suppliers` — debe estar implementada y migrada antes de correr `makemigrations products`.

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada
