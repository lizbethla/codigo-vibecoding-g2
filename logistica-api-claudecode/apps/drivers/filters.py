import django_filters
from .models import Driver


class DriverFilter(django_filters.FilterSet):
    class Meta:
        model = Driver
        fields = {
            'status': ['exact'],
            'license_type': ['exact'],
        }
