import django_filters
from .models import Shipment


class ShipmentFilter(django_filters.FilterSet):
    scheduled_date = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Shipment
        fields = {
            'status': ['exact'],
            'priority': ['exact'],
            'customer': ['exact'],
            'vehicle': ['exact'],
        }
