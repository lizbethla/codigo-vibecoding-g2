from django.db import models


class Route(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=30, unique=True)
    origin_city = models.CharField(max_length=100)
    destination_city = models.CharField(max_length=100)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Ruta'
        verbose_name_plural = 'Rutas'

    def __str__(self):
        return f'{self.code} — {self.origin_city} → {self.destination_city}'


class RouteStop(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops',
    )
    stop_name = models.CharField(max_length=150)
    order = models.PositiveSmallIntegerField()
    estimated_arrival_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('route', 'order')]
        ordering = ['route', 'order']
        verbose_name = 'Parada'
        verbose_name_plural = 'Paradas'

    def __str__(self):
        return f'Parada {self.order}: {self.stop_name}'
