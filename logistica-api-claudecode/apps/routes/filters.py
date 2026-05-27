import django_filters
from .models import Route


class RouteFilter(django_filters.FilterSet):
    class Meta:
        model = Route
        fields = {
            'origin_city': ['exact'],
            'destination_city': ['exact'],
            'is_active': ['exact'],
        }
