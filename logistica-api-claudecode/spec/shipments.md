# Spec: Shipments

**App Django:** `apps.shipments`
**Modelos:** `Shipment` + `ShipmentProduct` (tabla pivote M2M)
**Tablas:** `shipments_shipment` + `shipments_shipmentproduct`
**Dependencias FK:** `apps.customers`, `apps.warehouses`, `apps.routes`, `apps.transport`, `apps.products` (todas deben estar implementadas)

---

## Tareas

### T-01: Modelo Shipment
- [ ] Crear `apps/shipments/models.py`
- [ ] Definir `ShipmentStatus(models.TextChoices)` con:
  - `PENDING = 'PENDING', 'Pendiente'`
  - `CONFIRMED = 'CONFIRMED', 'Confirmado'`
  - `IN_WAREHOUSE = 'IN_WAREHOUSE', 'En almacén'`
  - `IN_TRANSIT = 'IN_TRANSIT', 'En tránsito'`
  - `OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'En reparto'`
  - `DELIVERED = 'DELIVERED', 'Entregado'`
  - `FAILED = 'FAILED', 'Fallido'`
  - `CANCELLED = 'CANCELLED', 'Cancelado'`
  - `RETURNED = 'RETURNED', 'Devuelto'`
- [ ] Definir `ShipmentPriority(models.TextChoices)` con:
  - `LOW = 'LOW', 'Baja'`
  - `NORMAL = 'NORMAL', 'Normal'`
  - `HIGH = 'HIGH', 'Alta'`
  - `URGENT = 'URGENT', 'Urgente'`
- [ ] Definir clase `Shipment` con campos:
  - `customer` — `ForeignKey('customers.Customer', on_delete=PROTECT, related_name='shipments')`
  - `origin_warehouse` — `ForeignKey('warehouses.Warehouse', on_delete=PROTECT, related_name='outgoing_shipments')`
  - `route` — `ForeignKey('routes.Route', on_delete=PROTECT, null=True, blank=True, related_name='shipments')`
  - `vehicle` — `ForeignKey('transport.Vehicle', on_delete=SET_NULL, null=True, blank=True, related_name='shipments')`
  - `tracking_code` — `CharField(max_length=50, unique=True, blank=True)`
  - `status` — `CharField(max_length=25, choices=ShipmentStatus.choices, default=ShipmentStatus.PENDING)`
  - `priority` — `CharField(max_length=10, choices=ShipmentPriority.choices, default=ShipmentPriority.NORMAL)`
  - `origin_address` — `TextField()`
  - `destination_address` — `TextField()`
  - `destination_city` — `CharField(max_length=100)`
  - `destination_country` — `CharField(max_length=100, default='Colombia')`
  - `recipient_name` — `CharField(max_length=150)`
  - `recipient_phone` — `CharField(max_length=20, null=True, blank=True)`
  - `scheduled_date` — `DateField()`
  - `estimated_delivery` — `DateField(null=True, blank=True)`
  - `actual_delivery` — `DateTimeField(null=True, blank=True)`
  - `total_weight_kg` — `DecimalField(max_digits=10, decimal_places=3, default=0)`
  - `total_volume_m3` — `DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)`
  - `base_cost` — `DecimalField(max_digits=12, decimal_places=2, default=0)`
  - `tax_amount` — `DecimalField(max_digits=12, decimal_places=2, default=0)`
  - `total_cost` — `DecimalField(max_digits=12, decimal_places=2, default=0)`
  - `notes` — `TextField(null=True, blank=True)`
  - `products` — `ManyToManyField('products.Product', through='ShipmentProduct', blank=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] Implementar `save()` que genera `tracking_code` automáticamente si está vacío:
  - Formato: `f'LOG-{year}-{token}'` donde `token = secrets.token_hex(4).upper()` y `year = datetime.now().year`
  - Usar `import secrets` y `from datetime import datetime`
  - Solo generar si `not self.tracking_code`
- [ ] `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Envío'`
  - `verbose_name_plural = 'Envíos'`
  - `indexes = [models.Index(fields=['status']), models.Index(fields=['scheduled_date']), models.Index(fields=['vehicle', 'status'])]`
- [ ] `__str__` retorna `f'{self.tracking_code} — {self.get_status_display()}'`

### T-02: Modelo ShipmentProduct
- [ ] En el mismo `models.py`, definir clase `ShipmentProduct` con campos:
  - `shipment` — `ForeignKey('shipments.Shipment', on_delete=CASCADE, related_name='shipment_products')`
  - `product` — `ForeignKey('products.Product', on_delete=PROTECT, related_name='shipment_products')`
  - `quantity` — `PositiveIntegerField()`
  - `unit_price` — `DecimalField(max_digits=12, decimal_places=2)` — snapshot del precio al momento del envío
  - `line_total` — `DecimalField(max_digits=14, decimal_places=2)` — calculado en `save()`
  - `notes` — `CharField(max_length=200, null=True, blank=True)`
  - `created_at` — `DateTimeField(auto_now_add=True)`
  - `updated_at` — `DateTimeField(auto_now=True)`
- [ ] Implementar `save()` que calcula `self.line_total = self.quantity * self.unit_price`
- [ ] `Meta`:
  - `unique_together = [('shipment', 'product')]`
  - `verbose_name = 'Producto del envío'`
  - `verbose_name_plural = 'Productos del envío'`
- [ ] `__str__` retorna `f'{self.product.name} x{self.quantity}'`

### T-03: Migración
- [ ] Ejecutar `python manage.py makemigrations shipments`
- [ ] Verificar que el archivo genera ambas tablas con todas las FK y el campo M2M `through`
- [ ] Verificar que los índices adicionales están presentes en la migración

### T-04: Admin
- [ ] Crear `apps/shipments/admin.py`
- [ ] Definir `ShipmentProductInline(admin.TabularInline)` con `model = ShipmentProduct`, `extra = 1`, `fields = ['product', 'quantity', 'unit_price', 'line_total', 'notes']`, `readonly_fields = ['line_total']`
- [ ] `@admin.register(Shipment)` con:
  - `list_display = ['tracking_code', 'customer', 'status', 'priority', 'destination_city', 'scheduled_date', 'total_cost']`
  - `list_filter = ['status', 'priority']`
  - `search_fields = ['tracking_code', 'recipient_name']`
  - `readonly_fields = ['tracking_code', 'created_at', 'updated_at']`
  - `inlines = [ShipmentProductInline]`
- [ ] `@admin.register(ShipmentProduct)` con:
  - `list_display = ['shipment', 'product', 'quantity', 'unit_price', 'line_total']`
  - `readonly_fields = ['line_total']`

### T-05: Serializers
- [ ] Crear `apps/shipments/serializers.py`
- [ ] Serializers de resumen para relaciones (todos read-only, sin importar desde otras apps):
  - `CustomerSummarySerializer` — campos: `id`, `name`, `customer_type`
  - `WarehouseSummarySerializer` — campos: `id`, `code`, `name`, `city`
  - `RouteSummarySerializer` — campos: `id`, `code`, `name`, `origin_city`, `destination_city`
  - `VehicleSummarySerializer` — campos: `id`, `plate`, `vehicle_type`
- [ ] `ShipmentProductSerializer` — campos: `id`, `product`, `quantity`, `unit_price`, `line_total`, `notes`; campo `product` como objeto con `id`, `sku`, `name` (nested read-only via `SerializerMethodField` o nested Serializer)
- [ ] `ShipmentProductWriteSerializer` — campos: `product`, `quantity`, `unit_price`, `notes`; `product` acepta ID
- [ ] `ShipmentListSerializer` — campos: `id`, `tracking_code`, `customer` (nested `CustomerSummarySerializer`), `status`, `priority`, `destination_city`, `scheduled_date`, `total_cost`
- [ ] `ShipmentDetailSerializer` — todos los campos + relaciones expandidas con los 4 summary serializers + campo `shipment_products` como lista nested (many=True, read_only=True, source='shipment_products.all')
- [ ] `ShipmentWriteSerializer` — campos: `customer`, `origin_warehouse`, `route`, `vehicle` (todos como IDs/PrimaryKeyRelatedField), más todos los campos de texto, fechas y costos. `route` y `vehicle` con `allow_null=True`

### T-06: Filtros
- [ ] Crear `apps/shipments/filters.py`
- [ ] `ShipmentFilter(django_filters.FilterSet)` con:
  - `status` — filtro exacto
  - `priority` — filtro exacto
  - `customer` — filtro exacto (por id)
  - `vehicle` — filtro exacto (por id)
  - `scheduled_date` — `DateFromToRangeFilter` (permite `?scheduled_date_after=YYYY-MM-DD&scheduled_date_before=YYYY-MM-DD`)

### T-07: ViewSets
- [ ] Crear `apps/shipments/views.py`
- [ ] `ShipmentViewSet(viewsets.ModelViewSet)`:
  - `queryset = Shipment.objects.select_related('customer', 'origin_warehouse', 'route', 'vehicle').prefetch_related('shipment_products__product')`
  - `permission_classes = [IsAuthenticated]`
  - `filterset_class = ShipmentFilter`
  - `search_fields = ['tracking_code', 'recipient_name']`
  - `ordering_fields = ['scheduled_date', 'created_at', 'total_cost', 'status']`
  - `get_serializer_class()` con lógica list/write/detail
- [ ] `ShipmentProductViewSet(viewsets.ModelViewSet)`:
  - `permission_classes = [IsAuthenticated]`
  - `get_queryset()` filtra por `shipment_pk`: `ShipmentProduct.objects.filter(shipment_id=self.kwargs['shipment_pk']).select_related('product')`
  - `perform_create()` inyecta `shipment_id=self.kwargs['shipment_pk']`
  - `get_serializer_class()`: write actions → `ShipmentProductWriteSerializer`, resto → `ShipmentProductSerializer`

### T-08: URLs con rutas anidadas
- [ ] Crear `apps/shipments/urls.py`
- [ ] `DefaultRouter` registra `ShipmentViewSet`
- [ ] Rutas anidadas manuales para productos del envío:
  - `GET/POST /api/v1/shipments/{shipment_pk}/products/`
  - `GET/PUT/PATCH/DELETE /api/v1/shipments/{shipment_pk}/products/{pk}/`

### T-09: Registro en proyecto
- [ ] Agregar `'apps.shipments'` a `INSTALLED_APPS` en `config/settings/base.py` (al final, después de todos los otros módulos)
- [ ] Agregar `path('api/v1/shipments/', include('apps.shipments.urls'))` en `config/urls.py`
- [ ] Crear `apps/shipments/apps.py` con `name = 'apps.shipments'`, `verbose_name = 'Envíos'`

---

## Dependencias previas
Todas las apps anteriores deben estar implementadas y migradas:
`apps.customers`, `apps.suppliers`, `apps.products`, `apps.warehouses`, `apps.drivers`, `apps.transport`, `apps.routes`

## Estado
- [x] Spec generado
- [x] Aprobado por usuario
- [x] Implementado
- [x] Validado — `manage.py check` 0 errores, migración aplicada con 3 índices adicionales
