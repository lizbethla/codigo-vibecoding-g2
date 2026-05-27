"""Tests para los serializers del módulo warehouses."""

from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from apps.warehouses.models import Warehouse
from apps.warehouses.serializers import (
    WarehouseDetailSerializer,
    WarehouseListSerializer,
    WarehouseWriteSerializer,
)


class WarehouseListSerializerTest(TestCase):
    """Tests para WarehouseListSerializer (campos mínimos)."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
            country='Colombia',
        )

    def test_contains_expected_fields(self):
        """WarehouseListSerializer expone solo campos mínimos."""
        serializer = WarehouseListSerializer(self.warehouse)
        expected_fields = {'id', 'code', 'name', 'city', 'country', 'is_active'}
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_does_not_expose_address_or_coordinates(self):
        """WarehouseListSerializer no expone address, latitude, longitude ni capacity."""
        serializer = WarehouseListSerializer(self.warehouse)
        for field in ('address', 'latitude', 'longitude', 'capacity_m3', 'manager'):
            self.assertNotIn(field, serializer.data)


class WarehouseDetailSerializerTest(TestCase):
    """Tests para WarehouseDetailSerializer (todos los campos + manager expandido)."""

    def setUp(self):
        self.manager_user = User.objects.create_user(
            username='manager1',
            password='pass123',
            first_name='Carlos',
            last_name='Pérez',
        )
        self.warehouse_with_manager = Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
            manager=self.manager_user,
        )
        self.warehouse_no_manager = Warehouse.objects.create(
            name='Bodega Medellín Central',
            code='MED-01',
            address='Calle 50 No. 40-25, Medellín',
            city='Medellín',
        )

    def test_includes_all_fields(self):
        """WarehouseDetailSerializer incluye todos los campos del modelo."""
        serializer = WarehouseDetailSerializer(self.warehouse_with_manager)
        expected_fields = {
            'id', 'manager', 'name', 'code', 'address', 'city', 'country',
            'latitude', 'longitude', 'capacity_m3', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_manager_expanded_when_assigned(self):
        """manager se serializa como objeto con id, username, first_name, last_name."""
        serializer = WarehouseDetailSerializer(self.warehouse_with_manager)
        manager_data = serializer.data['manager']
        self.assertIsNotNone(manager_data)
        self.assertIn('id', manager_data)
        self.assertIn('username', manager_data)
        self.assertIn('first_name', manager_data)
        self.assertIn('last_name', manager_data)
        self.assertEqual(manager_data['username'], 'manager1')

    def test_manager_null_when_not_assigned(self):
        """manager es null cuando el almacén no tiene encargado."""
        serializer = WarehouseDetailSerializer(self.warehouse_no_manager)
        self.assertIsNone(serializer.data['manager'])


class WarehouseWriteSerializerTest(TestCase):
    """Tests para WarehouseWriteSerializer (validación y escritura)."""

    def setUp(self):
        self.manager_user = User.objects.create_user(
            username='manager1',
            password='pass123',
        )
        self.valid_data_minimal = {
            'name': 'Bodega Cali Sur',
            'code': 'CAL-01',
            'address': 'Av. Pasoancho No. 12-34, Cali',
            'city': 'Cali',
        }

    # ------------------------------------------------------------------ #
    # Happy paths                                                          #
    # ------------------------------------------------------------------ #

    def test_valid_data_without_manager(self):
        """Serializer válido con datos mínimos sin manager."""
        serializer = WarehouseWriteSerializer(data=self.valid_data_minimal)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_manager(self):
        """Serializer válido cuando se proporciona un user id existente como manager."""
        data = {**self.valid_data_minimal, 'manager': self.manager_user.pk}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_save_creates_warehouse(self):
        """serializer.save() crea el objeto en la base de datos."""
        serializer = WarehouseWriteSerializer(data=self.valid_data_minimal)
        self.assertTrue(serializer.is_valid())
        warehouse = serializer.save()
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.code, 'CAL-01')

    # ------------------------------------------------------------------ #
    # Unhappy paths — campos requeridos                                    #
    # ------------------------------------------------------------------ #

    def test_fails_without_name(self):
        """Serializer falla cuando falta el campo name."""
        data = {k: v for k, v in self.valid_data_minimal.items() if k != 'name'}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_fails_without_address(self):
        """Serializer falla cuando falta el campo address."""
        data = {k: v for k, v in self.valid_data_minimal.items() if k != 'address'}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_fails_without_city(self):
        """Serializer falla cuando falta el campo city."""
        data = {k: v for k, v in self.valid_data_minimal.items() if k != 'city'}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_fails_without_code(self):
        """Serializer falla cuando falta el campo code."""
        data = {k: v for k, v in self.valid_data_minimal.items() if k != 'code'}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    # ------------------------------------------------------------------ #
    # Unhappy paths — unicidad y FK                                        #
    # ------------------------------------------------------------------ #

    def test_fails_with_duplicate_code(self):
        """Serializer falla cuando el code ya existe (unique constraint)."""
        Warehouse.objects.create(
            name='Bodega Existente',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
        )
        data = {**self.valid_data_minimal, 'code': 'BOG-01'}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_fails_with_nonexistent_manager(self):
        """Serializer falla cuando el manager FK apunta a un user inexistente."""
        data = {**self.valid_data_minimal, 'manager': 99999}
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('manager', serializer.errors)
