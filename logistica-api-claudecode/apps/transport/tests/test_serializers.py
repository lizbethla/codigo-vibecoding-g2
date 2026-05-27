"""Tests para los serializers del módulo transport (Vehicle)."""
from django.test import TestCase
from django.contrib.auth.models import User
from apps.drivers.models import Driver
from apps.transport.models import Vehicle, VehicleType, FuelType
from apps.transport.serializers import (
    VehicleListSerializer,
    VehicleDetailSerializer,
    VehicleWriteSerializer,
)


def make_driver(username='conductor1', license_number='COL-B-123456', national_id='79854321'):
    """Crea un usuario y un perfil Driver para usar en tests."""
    user = User.objects.create_user(
        username=username,
        first_name='Carlos',
        last_name='Pérez',
        password='pass123',
    )
    driver = Driver.objects.create(
        user=user,
        license_number=license_number,
        license_type='B',
        license_expiry='2027-12-31',
        phone='3001234567',
        national_id=national_id,
    )
    return driver


def make_vehicle(**kwargs):
    """Crea un Vehicle con valores por defecto sobreescribibles."""
    defaults = {
        'plate': 'ABC-123',
        'vehicle_type': VehicleType.VAN,
        'brand': 'Chevrolet',
        'model': 'NHR',
        'year': 2022,
        'capacity_kg': '1500.00',
    }
    defaults.update(kwargs)
    return Vehicle.objects.create(**defaults)


VALID_WRITE_DATA = {
    'plate': 'SRL-456',
    'vehicle_type': 'VAN',
    'brand': 'Chevrolet',
    'model': 'NHR',
    'year': 2022,
    'capacity_kg': '1500.00',
    'fuel_type': 'DIESEL',
    'status': 'AVAILABLE',
}


class VehicleListSerializerTest(TestCase):
    """Tests para VehicleListSerializer."""

    def test_list_serializer_contains_minimum_fields(self):
        """VehicleListSerializer expone solo los campos de listado."""
        vehicle = make_vehicle()
        serializer = VehicleListSerializer(vehicle)
        expected_fields = {'id', 'plate', 'vehicle_type', 'brand', 'model', 'year', 'status'}
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_list_serializer_values_correct(self):
        """VehicleListSerializer retorna los valores del objeto."""
        vehicle = make_vehicle()
        serializer = VehicleListSerializer(vehicle)
        self.assertEqual(serializer.data['plate'], 'ABC-123')
        self.assertEqual(serializer.data['vehicle_type'], 'VAN')


class VehicleDetailSerializerTest(TestCase):
    """Tests para VehicleDetailSerializer."""

    def test_detail_serializer_all_fields(self):
        """VehicleDetailSerializer incluye todos los campos del modelo."""
        vehicle = make_vehicle()
        serializer = VehicleDetailSerializer(vehicle)
        expected_fields = {
            'id', 'driver', 'plate', 'vehicle_type', 'brand', 'model', 'year',
            'capacity_kg', 'capacity_m3', 'fuel_type', 'status',
            'last_maintenance', 'created_at', 'updated_at',
        }
        self.assertTrue(expected_fields.issubset(set(serializer.data.keys())))

    def test_detail_serializer_driver_is_none_without_driver(self):
        """driver aparece como None cuando no hay conductor asignado."""
        vehicle = make_vehicle()
        serializer = VehicleDetailSerializer(vehicle)
        self.assertIsNone(serializer.data['driver'])

    def test_detail_serializer_driver_expanded(self):
        """driver aparece expandido con sus campos cuando está asignado."""
        driver = make_driver()
        vehicle = make_vehicle(driver=driver)
        serializer = VehicleDetailSerializer(vehicle)
        driver_data = serializer.data['driver']
        self.assertIsNotNone(driver_data)
        self.assertIn('id', driver_data)
        self.assertIn('license_number', driver_data)
        self.assertIn('full_name', driver_data)


class VehicleWriteSerializerValidTest(TestCase):
    """Tests de datos válidos en VehicleWriteSerializer."""

    def test_write_valid_without_driver(self):
        """VehicleWriteSerializer acepta datos válidos sin driver."""
        serializer = VehicleWriteSerializer(data=VALID_WRITE_DATA)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_valid_with_driver(self):
        """VehicleWriteSerializer acepta un driver_id válido."""
        driver = make_driver()
        data = dict(VALID_WRITE_DATA, plate='DRV-789', driver=driver.pk)
        serializer = VehicleWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_saves_vehicle(self):
        """VehicleWriteSerializer guarda el vehículo en BD."""
        serializer = VehicleWriteSerializer(data=VALID_WRITE_DATA)
        self.assertTrue(serializer.is_valid())
        vehicle = serializer.save()
        self.assertIsNotNone(vehicle.pk)
        self.assertEqual(vehicle.plate, 'SRL-456')


class VehicleWriteSerializerRequiredFieldsTest(TestCase):
    """Tests de campos requeridos en VehicleWriteSerializer."""

    def _data_without(self, field):
        data = dict(VALID_WRITE_DATA, plate=f'REQ-{hash(field) % 900 + 100}')
        data.pop(field)
        return data

    def test_fails_without_plate(self):
        """VehicleWriteSerializer falla si falta plate."""
        data = dict(VALID_WRITE_DATA)
        data.pop('plate')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate', serializer.errors)

    def test_fails_without_vehicle_type(self):
        """VehicleWriteSerializer falla si falta vehicle_type."""
        data = self._data_without('vehicle_type')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_fails_without_brand(self):
        """VehicleWriteSerializer falla si falta brand."""
        data = self._data_without('brand')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('brand', serializer.errors)

    def test_fails_without_model(self):
        """VehicleWriteSerializer falla si falta model."""
        data = self._data_without('model')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('model', serializer.errors)

    def test_fails_without_year(self):
        """VehicleWriteSerializer falla si falta year."""
        data = self._data_without('year')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('year', serializer.errors)

    def test_fails_without_capacity_kg(self):
        """VehicleWriteSerializer falla si falta capacity_kg."""
        data = self._data_without('capacity_kg')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)


class VehicleWriteSerializerEdgeCasesTest(TestCase):
    """Tests de casos extremos en VehicleWriteSerializer."""

    def test_fails_with_invalid_vehicle_type(self):
        """VehicleWriteSerializer falla con vehicle_type inválido."""
        data = dict(VALID_WRITE_DATA, plate='INV-001', vehicle_type='SPACESHIP')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_fails_with_invalid_fuel_type(self):
        """VehicleWriteSerializer falla con fuel_type inválido."""
        data = dict(VALID_WRITE_DATA, plate='INV-002', fuel_type='NUCLEAR')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('fuel_type', serializer.errors)

    def test_fails_with_duplicate_plate(self):
        """VehicleWriteSerializer falla con placa duplicada."""
        Vehicle.objects.create(
            plate='DUP-100',
            vehicle_type=VehicleType.VAN,
            brand='Toyota',
            model='Hilux',
            year=2020,
            capacity_kg='2000.00',
        )
        data = dict(VALID_WRITE_DATA, plate='DUP-100')
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate', serializer.errors)

    def test_fails_with_nonexistent_driver_fk(self):
        """VehicleWriteSerializer falla si el driver FK no existe."""
        data = dict(VALID_WRITE_DATA, plate='DRV-999', driver=99999)
        serializer = VehicleWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('driver', serializer.errors)
