from django.contrib import admin
from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'city', 'manager', 'is_active', 'created_at']
    list_filter = ['city', 'is_active']
    search_fields = ['name', 'code']
