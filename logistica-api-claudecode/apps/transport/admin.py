from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['plate', 'vehicle_type', 'brand', 'model', 'year', 'status', 'driver']
    list_filter = ['vehicle_type', 'status', 'fuel_type']
    search_fields = ['plate']
