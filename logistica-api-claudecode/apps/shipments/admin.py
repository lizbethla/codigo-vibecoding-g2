from django.contrib import admin
from .models import Shipment, ShipmentProduct


class ShipmentProductInline(admin.TabularInline):
    model = ShipmentProduct
    extra = 1
    fields = ['product', 'quantity', 'unit_price', 'line_total', 'notes']
    readonly_fields = ['line_total']


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'tracking_code', 'customer', 'status', 'priority',
        'destination_city', 'scheduled_date', 'total_cost',
    ]
    list_filter = ['status', 'priority']
    search_fields = ['tracking_code', 'recipient_name']
    readonly_fields = ['tracking_code', 'created_at', 'updated_at']
    inlines = [ShipmentProductInline]


@admin.register(ShipmentProduct)
class ShipmentProductAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'product', 'quantity', 'unit_price', 'line_total']
    readonly_fields = ['line_total']
