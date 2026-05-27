from django.db import models


class CustomerType(models.TextChoices):
    COMPANY = 'COMPANY', 'Empresa'
    INDIVIDUAL = 'INDIVIDUAL', 'Persona natural'


class Customer(models.Model):
    name = models.CharField(max_length=200)
    customer_type = models.CharField(
        max_length=10,
        choices=CustomerType.choices,
        default=CustomerType.COMPANY,
    )
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, default='Colombia')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.name
