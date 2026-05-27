from django.contrib import admin
from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'license_type', 'license_number', 'status', 'license_expiry']
    list_filter = ['status', 'license_type']
    search_fields = ['national_id', 'license_number', 'user__first_name', 'user__last_name']
