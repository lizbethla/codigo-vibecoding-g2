from django.contrib import admin
from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'origin_city', 'destination_city', 'is_active']
    list_filter = ['is_active', 'origin_city', 'destination_city']
    search_fields = ['name', 'code']
    inlines = [RouteStopInline]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['route', 'order', 'stop_name', 'estimated_arrival_hours']
