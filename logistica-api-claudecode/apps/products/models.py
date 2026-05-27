from django.db import models


class ProductCategory(models.TextChoices):
    LAPTOP = 'LAPTOP', 'Laptop'
    DESKTOP = 'DESKTOP', 'Computador de escritorio'
    MOBILE = 'MOBILE', 'Móvil'
    TABLET = 'TABLET', 'Tableta'
    PERIPHERAL = 'PERIPHERAL', 'Periférico'
    NETWORKING = 'NETWORKING', 'Redes'
    STORAGE = 'STORAGE', 'Almacenamiento'
    OTHER = 'OTHER', 'Otro'


class Product(models.Model):
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, choices=ProductCategory.choices)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3, default=0)
    dimensions_cm = models.CharField(max_length=50, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return f'{self.sku} — {self.name}'
