from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Order, OrderItem


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1, max_value=100)


class ProductCheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True, min_length=1, max_length=20)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku  = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['product_name', 'product_sku', 'quantity', 'unit_price']


class OrderListSerializer(serializers.ModelSerializer):
    items      = OrderItemSerializer(many=True, read_only=True)
    amount_usd = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = ['id', 'status', 'amount_usd', 'items', 'created_at']

    @extend_schema_field(serializers.FloatField())
    def get_amount_usd(self, obj):
        return round(obj.amount_total / 100, 2)


class CheckoutResponseSerializer(serializers.Serializer):
    order_id     = serializers.IntegerField()
    checkout_url = serializers.URLField()
    session_id   = serializers.CharField()
    amount_usd   = serializers.FloatField()
