from django.conf import settings
from django.db import models


class LicenseType(models.TextChoices):
    A = 'A', 'Motocicletas'
    B = 'B', 'Vehículos livianos'
    C = 'C', 'Vehículos pesados'
    CE = 'CE', 'Vehículos articulados pesados'
    BTP = 'BTP', 'Transporte público'


class DriverStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Disponible'
    ON_ROUTE = 'ON_ROUTE', 'En ruta'
    OFF_DUTY = 'OFF_DUTY', 'Fuera de servicio'
    SUSPENDED = 'SUSPENDED', 'Suspendido'


class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_type = models.CharField(max_length=20, choices=LicenseType.choices)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE,
    )
    date_of_birth = models.DateField(null=True, blank=True)
    national_id = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        verbose_name = 'Conductor'
        verbose_name_plural = 'Conductores'

    def __str__(self):
        return f'{self.user.get_full_name()} — {self.license_number}'
