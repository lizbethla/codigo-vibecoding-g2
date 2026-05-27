import secrets
from datetime import datetime

from django.db import models


class ShipmentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pendiente'
    CONFIRMED = 'CONFIRMED', 'Confirmado'
    IN_WAREHOUSE = 'IN_WAREHOUSE', 'En almacén'
    IN_TRANSIT = 'IN_TRANSIT', 'En tránsito'
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'En reparto'
    DELIVERED = 'DELIVERED', 'Entregado'
    FAILED = 'FAILED', 'Fallido'
    CANCELLED = 'CANCELLED', 'Cancelado'
    RETURNED = 'RETURNED', 'Devuelto'


class ShipmentPriority(models.TextChoices):
    LOW = 'LOW', 'Baja'
    NORMAL = 'NORMAL', 'Normal'
    HIGH = 'HIGH', 'Alta'
    URGENT = 'URGENT', 'Urgente'


class Shipment(models.Model):
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='outgoing_shipments',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='shipments',
    )
    vehicle = models.ForeignKey(
        'transport.Vehicle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    tracking_code = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(
        max_length=25,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PENDING,
    )
    priority = models.CharField(
        max_length=10,
        choices=ShipmentPriority.choices,
        default=ShipmentPriority.NORMAL,
    )
    origin_address = models.TextField()
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100, default='Colombia')
    recipient_name = models.CharField(max_length=150)
    recipient_phone = models.CharField(max_length=20, null=True, blank=True)
    scheduled_date = models.DateField()
    estimated_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    total_volume_m3 = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    base_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)
    products = models.ManyToManyField(
        'products.Product',
        through='ShipmentProduct',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Envío'
        verbose_name_plural = 'Envíos'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['vehicle', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            token = secrets.token_hex(4).upper()
            self.tracking_code = f'LOG-{datetime.now().year}-{token}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tracking_code} — {self.get_status_display()}'


class ShipmentProduct(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='shipment_products',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='shipment_products',
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('shipment', 'product')]
        ordering = ['shipment', 'created_at']
        verbose_name = 'Producto del envío'
        verbose_name_plural = 'Productos del envío'

    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'
