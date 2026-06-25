from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model         = OrderItem
    extra         = 0
    readonly_fields = ['product', 'quantity', 'unit_price']
    can_delete    = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'status', 'amount_total', 'created_at']
    list_filter     = ['status']
    search_fields   = ['stripe_session_id', 'stripe_payment_intent', 'user__username']
    readonly_fields = [
        'stripe_session_id', 'stripe_payment_intent',
        'amount_total', 'checkout_url', 'created_at', 'updated_at',
    ]
    ordering = ['-created_at']
    inlines  = [OrderItemInline]
