from rest_framework import serializers
from .models import Product


class SupplierSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'category', 'unit_price', 'stock_quantity', 'is_active']


class ProductDetailSerializer(serializers.ModelSerializer):
    supplier = SupplierSummarySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'supplier', 'sku', 'name', 'description', 'category',
            'unit_price', 'weight_kg', 'dimensions_cm', 'stock_quantity', 'is_active',
        ]
