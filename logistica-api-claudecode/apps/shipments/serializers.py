from rest_framework import serializers
from .models import Shipment, ShipmentProduct


# Serializers de resumen para relaciones — sin imports cruzados entre apps
class CustomerSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    customer_type = serializers.CharField()


class WarehouseSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    city = serializers.CharField()


class RouteSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    origin_city = serializers.CharField()
    destination_city = serializers.CharField()


class VehicleSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    plate = serializers.CharField()
    vehicle_type = serializers.CharField()


class ProductSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sku = serializers.CharField()
    name = serializers.CharField()


# Serializers de ShipmentProduct
class ShipmentProductSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)

    class Meta:
        model = ShipmentProduct
        fields = ['id', 'product', 'quantity', 'unit_price', 'line_total', 'notes']


class ShipmentProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentProduct
        fields = ['product', 'quantity', 'unit_price', 'notes']


# Serializers de Shipment
class ShipmentListSerializer(serializers.ModelSerializer):
    customer = CustomerSummarySerializer(read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_code', 'customer', 'status', 'priority',
            'destination_city', 'scheduled_date', 'total_cost',
        ]


class ShipmentDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSummarySerializer(read_only=True)
    origin_warehouse = WarehouseSummarySerializer(read_only=True)
    route = RouteSummarySerializer(read_only=True)
    vehicle = VehicleSummarySerializer(read_only=True)
    shipment_products = ShipmentProductSerializer(
        many=True, read_only=True, source='shipment_products.all'
    )

    class Meta:
        model = Shipment
        fields = '__all__'


class ShipmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = [
            'customer', 'origin_warehouse', 'route', 'vehicle',
            'status', 'priority',
            'origin_address', 'destination_address', 'destination_city', 'destination_country',
            'recipient_name', 'recipient_phone',
            'scheduled_date', 'estimated_delivery', 'actual_delivery',
            'total_weight_kg', 'total_volume_m3',
            'base_cost', 'tax_amount', 'total_cost',
            'notes',
        ]
