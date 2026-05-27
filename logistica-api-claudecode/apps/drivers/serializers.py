from rest_framework import serializers
from .models import Driver


class DriverUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()


class DriverListSerializer(serializers.ModelSerializer):
    user = DriverUserSerializer(read_only=True)

    class Meta:
        model = Driver
        fields = ['id', 'user', 'license_type', 'status', 'national_id']


class DriverDetailSerializer(serializers.ModelSerializer):
    user = DriverUserSerializer(read_only=True)

    class Meta:
        model = Driver
        fields = '__all__'


class DriverWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            'user', 'license_number', 'license_type', 'license_expiry',
            'phone', 'status', 'date_of_birth', 'national_id',
        ]
