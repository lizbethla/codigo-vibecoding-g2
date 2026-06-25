from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class OrderStatus(models.TextChoices):
    PENDING   = 'PENDING',   'Pendiente'
    COMPLETED = 'COMPLETED', 'Completado'
    CANCELLED = 'CANCELLED', 'Cancelado'
    EXPIRED   = 'EXPIRED',   'Expirado'


class Order(models.Model):
    user                  = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    stripe_session_id     = models.CharField(max_length=200, unique=True)
    stripe_payment_intent = models.CharField(max_length=200, null=True, blank=True)
    status                = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    amount_total          = models.PositiveIntegerField(default=0, help_text='Total en centavos de USD')
    checkout_url          = models.URLField(max_length=500, blank=True)
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'
        indexes = [
            models.Index(fields=['stripe_session_id']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f'Order #{self.pk} [{self.get_status_display()}]'


class OrderItem(models.Model):
    order     = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product   = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='order_items')
    quantity  = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, help_text='Precio snapshot al momento de la compra')

    class Meta:
        unique_together = [('order', 'product')]
        verbose_name = 'Ítem de orden'
        verbose_name_plural = 'Ítems de orden'

    def __str__(self):
        return f'{self.quantity}x {self.product.name} (Order #{self.order_id})'
