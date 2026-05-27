from rest_framework import serializers
from .models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'customer_type', 'email', 'is_active']


class CustomerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'name', 'customer_type', 'tax_id', 'email',
            'phone', 'address', 'city', 'country', 'is_active',
        ]
