from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'stop_name', 'order', 'estimated_arrival_hours', 'notes']


class RouteStopWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['stop_name', 'order', 'estimated_arrival_hours', 'notes']


class RouteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ['id', 'code', 'name', 'origin_city', 'destination_city', 'is_active']


class RouteDetailSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True, source='stops.all')

    class Meta:
        model = Route
        fields = '__all__'


class RouteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = [
            'name', 'code', 'origin_city', 'destination_city',
            'distance_km', 'estimated_hours', 'is_active',
        ]
