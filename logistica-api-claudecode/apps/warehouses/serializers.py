from rest_framework import serializers
from .models import Warehouse


class UserSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class WarehouseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'code', 'name', 'city', 'country', 'is_active']


class WarehouseDetailSerializer(serializers.ModelSerializer):
    manager = UserSummarySerializer(read_only=True)

    class Meta:
        model = Warehouse
        fields = '__all__'


class WarehouseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'manager', 'name', 'code', 'address', 'city', 'country',
            'latitude', 'longitude', 'capacity_m3', 'is_active',
        ]
