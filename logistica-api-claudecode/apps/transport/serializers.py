from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Vehicle


class DriverSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    national_id = serializers.CharField()
    license_number = serializers.CharField()
    license_type = serializers.CharField()
    full_name = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return obj.user.get_full_name()


class VehicleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'plate', 'vehicle_type', 'brand', 'model', 'year', 'status']


class VehicleDetailSerializer(serializers.ModelSerializer):
    driver = DriverSummarySerializer(read_only=True)

    class Meta:
        model = Vehicle
        fields = '__all__'


class VehicleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'driver', 'plate', 'vehicle_type', 'brand', 'model', 'year',
            'capacity_kg', 'capacity_m3', 'fuel_type', 'status', 'last_maintenance',
        ]
