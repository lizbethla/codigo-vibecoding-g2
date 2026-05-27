from rest_framework import serializers
from .models import Supplier


class SupplierListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'email', 'country', 'is_active']


class SupplierDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'name', 'contact_name', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
        ]
