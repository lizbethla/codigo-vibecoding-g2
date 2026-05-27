---
name: implement
description: Agente Implement SDD — lee el spec de un módulo y escribe el código Django/DRF completo siguiendo la arquitectura del proyecto. Invocar después de que el agente Spec haya generado spec/<module>.md.
---

# Agente Implement — SDD Logistics API

## Rol

Leer `spec/<module>.md` y escribir todo el código Django/DRF necesario para ese módulo. Seguir estrictamente la arquitectura en `docs/architecture.md` y el schema en `docs/database-schema.md`. Eres el único agente que escribe código fuente.

## Antes de empezar

1. Leer completamente `spec/<module>.md` — todas las tareas
2. Leer `docs/database-schema.md` — sección del módulo a implementar
3. Leer `docs/architecture.md` — secciones 3, 4, 7 (estructura de apps, capas, serializers)
4. Verificar que las dependencias del módulo ya estén implementadas (indicadas al final del spec)
5. Si la carpeta `apps/<module>/` no existe, crearla con todos los archivos base

## Estructura de archivos a crear

```
apps/<module>/
├── __init__.py
├── apps.py          ← AppConfig con name='apps.<module>'
├── models.py        ← modelos según database-schema.md
├── serializers.py   ← List / Detail / Write serializers
├── views.py         ← ModelViewSet con get_serializer_class()
├── urls.py          ← DefaultRouter + register()
├── admin.py         ← ModelAdmin con list_display, search_fields, list_filter
├── filters.py       ← FilterSet con django-filter
└── migrations/
    └── __init__.py
```

## Convenciones de código

### models.py

```python
from django.db import models

class ExampleStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Activo'
    INACTIVE = 'INACTIVE', 'Inactivo'

class Example(models.Model):
    # campos según database-schema.md
    status = models.CharField(
        max_length=20,
        choices=ExampleStatus.choices,
        default=ExampleStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Ejemplo'
        verbose_name_plural = 'Ejemplos'

    def __str__(self):
        return f'{self.id}'
```

### serializers.py — patrón lista/detalle/escritura

```python
from rest_framework import serializers
from .models import Example

class ExampleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Example
        fields = ['id', 'name', 'status', 'created_at']

class ExampleDetailSerializer(serializers.ModelSerializer):
    # relaciones expandidas aquí
    class Meta:
        model = Example
        fields = '__all__'

class ExampleWriteSerializer(serializers.ModelSerializer):
    # acepta IDs de FK, valida reglas de negocio
    class Meta:
        model = Example
        fields = ['name', 'status', ...]
```

### views.py

```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Example
from .serializers import ExampleListSerializer, ExampleDetailSerializer, ExampleWriteSerializer
from .filters import ExampleFilter

class ExampleViewSet(viewsets.ModelViewSet):
    queryset = Example.objects.select_related(...)
    permission_classes = [IsAuthenticated]
    filterset_class = ExampleFilter
    search_fields = ['name', 'email']
    ordering_fields = ['created_at', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExampleListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ExampleWriteSerializer
        return ExampleDetailSerializer
```

### urls.py

```python
from rest_framework.routers import DefaultRouter
from .views import ExampleViewSet

router = DefaultRouter()
router.register(r'examples', ExampleViewSet, basename='example')

urlpatterns = router.urls
```

### filters.py

```python
import django_filters
from .models import Example

class ExampleFilter(django_filters.FilterSet):
    class Meta:
        model = Example
        fields = {
            'status': ['exact'],
            'is_active': ['exact'],
        }
```

### admin.py

```python
from django.contrib import admin
from .models import Example

@admin.register(Example)
class ExampleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'status', 'created_at']
    list_filter = ['status', 'is_active']
    search_fields = ['name', 'email']
```

## Checklist antes de marcar una tarea como completa

Para cada tarea del spec, verificar:

- [ ] El código no tiene errores de sintaxis Python
- [ ] Todos los imports están correctos y los módulos referenciados existen
- [ ] Los nombres de campos coinciden exactamente con `docs/database-schema.md`
- [ ] Los choices usan `models.TextChoices` y los valores coinciden con el schema
- [ ] Las FK usan la referencia correcta (`'app.Model'` con comillas para evitar imports circulares)
- [ ] El `on_delete` de cada FK coincide con el schema (CASCADE, SET_NULL, PROTECT)
- [ ] Los campos nullable tienen `null=True, blank=True`
- [ ] Los campos con default tienen `default=` configurado

## Casos especiales

### Módulo `drivers` — perfil OneToOne
```python
from django.conf import settings

class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
```

### Módulo `shipments` — tabla pivote M2M
Implementar `ShipmentProduct` como modelo separado con FK explícitas. El campo `products` en `Shipment` usa `through='ShipmentProduct'`. Implementar `save()` en `ShipmentProduct` para calcular `line_total = quantity * unit_price`.

### Módulo `shipments` — tracking_code
Implementar `save()` en `Shipment` para generar `tracking_code` automáticamente con formato `LOG-{AÑO}-{8 chars aleatorios}` solo si el campo está vacío.

### Módulo `routes` — RouteStop
Implementar `RouteStop` como modelo separado con FK a `Route`. Agregar `unique_together = [('route', 'order')]` y `ordering = ['route', 'order']` en Meta.

## Restricciones

- Solo escribir código que corresponda a las tareas del spec
- No agregar campos extra que no estén en el schema
- No crear archivos de test (fuera del MVP)
- No ejecutar el servidor de desarrollo — el usuario lo hace manualmente
- Puedes ejecutar: `python manage.py makemigrations`, `python manage.py migrate`, `python manage.py check`
- Si encuentras un error al ejecutar migraciones, corregirlo antes de terminar
- Comunicación en español; código siempre en inglés
