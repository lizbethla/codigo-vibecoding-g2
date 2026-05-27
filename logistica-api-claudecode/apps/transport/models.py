from django.db import models


class VehicleType(models.TextChoices):
    MOTORCYCLE = 'MOTORCYCLE', 'Motocicleta'
    VAN = 'VAN', 'Furgoneta'
    TRUCK = 'TRUCK', 'Camión'
    HEAVY_TRUCK = 'HEAVY_TRUCK', 'Camión pesado'
    REFRIGERATED_TRUCK = 'REFRIGERATED_TRUCK', 'Camión refrigerado'
    CONTAINER = 'CONTAINER', 'Contenedor'


class FuelType(models.TextChoices):
    GASOLINE = 'GASOLINE', 'Gasolina'
    DIESEL = 'DIESEL', 'Diésel'
    ELECTRIC = 'ELECTRIC', 'Eléctrico'
    HYBRID = 'HYBRID', 'Híbrido'
    GAS = 'GAS', 'Gas'


class VehicleStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Disponible'
    IN_USE = 'IN_USE', 'En uso'
    MAINTENANCE = 'MAINTENANCE', 'En mantenimiento'
    RETIRED = 'RETIRED', 'Retirado'


class Vehicle(models.Model):
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=30, choices=VehicleType.choices)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    capacity_m3 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fuel_type = models.CharField(
        max_length=20,
        choices=FuelType.choices,
        default=FuelType.DIESEL,
    )
    status = models.CharField(
        max_length=20,
        choices=VehicleStatus.choices,
        default=VehicleStatus.AVAILABLE,
    )
    last_maintenance = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['plate']
        verbose_name = 'Vehículo'
        verbose_name_plural = 'Vehículos'

    def __str__(self):
        return f'{self.plate} — {self.get_vehicle_type_display()}'
