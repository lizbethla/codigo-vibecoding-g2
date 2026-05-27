from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'category', 'supplier', 'unit_price', 'stock_quantity', 'is_active']
    list_filter = ['category', 'is_active', 'supplier']
    search_fields = ['name', 'sku']
