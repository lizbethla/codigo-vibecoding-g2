"""Tests para los modelos del módulo transport (Vehicle)."""
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.models import User
from apps.drivers.models import Driver
from apps.transport.models import Vehicle, VehicleType, FuelType, VehicleStatus


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


class VehicleCreationWithoutDriverTest(TestCase):
    """Tests de creación válida de Vehicle sin conductor asignado."""

    def test_create_vehicle_without_driver(self):
        """Crea un vehículo sin driver (campo nullable)."""
        vehicle = make_vehicle()
        self.assertIsNotNone(vehicle.pk)
        self.assertIsNone(vehicle.driver)

    def test_defaults_status_available(self):
        """El status por defecto debe ser AVAILABLE."""
        vehicle = make_vehicle()
        self.assertEqual(vehicle.status, VehicleStatus.AVAILABLE)

    def test_defaults_fuel_type_diesel(self):
        """El fuel_type por defecto debe ser DIESEL."""
        vehicle = make_vehicle()
        self.assertEqual(vehicle.fuel_type, FuelType.DIESEL)

    def test_nullable_capacity_m3(self):
        """capacity_m3 puede ser None."""
        vehicle = make_vehicle()
        self.assertIsNone(vehicle.capacity_m3)

    def test_nullable_last_maintenance(self):
        """last_maintenance puede ser None."""
        vehicle = make_vehicle()
        self.assertIsNone(vehicle.last_maintenance)

    def test_timestamps_set_on_creation(self):
        """created_at y updated_at se asignan automáticamente."""
        vehicle = make_vehicle()
        self.assertIsNotNone(vehicle.created_at)
        self.assertIsNotNone(vehicle.updated_at)


class VehicleCreationWithDriverTest(TestCase):
    """Tests de creación válida de Vehicle con conductor asignado."""

    def setUp(self):
        self.driver = make_driver()

    def test_create_vehicle_with_driver(self):
        """Crea un vehículo con driver asignado correctamente."""
        vehicle = make_vehicle(driver=self.driver)
        self.assertEqual(vehicle.driver, self.driver)

    def test_vehicle_str_with_driver(self):
        """__str__ retorna plate — tipo legible del vehículo."""
        vehicle = make_vehicle(driver=self.driver)
        expected = f'{vehicle.plate} — {vehicle.get_vehicle_type_display()}'
        self.assertEqual(str(vehicle), expected)


class VehicleStrTest(TestCase):
    """Tests del método __str__ de Vehicle."""

    def test_str_without_driver(self):
        """__str__ funciona aunque el driver sea None."""
        vehicle = make_vehicle(plate='XYZ-999', vehicle_type=VehicleType.TRUCK)
        expected = f'XYZ-999 — {vehicle.get_vehicle_type_display()}'
        self.assertEqual(str(vehicle), expected)


class VehicleUniquePlateTest(TestCase):
    """Tests de restricción UNIQUE en plate."""

    def test_duplicate_plate_raises_error(self):
        """Crear dos vehículos con la misma placa lanza IntegrityError."""
        make_vehicle(plate='DUP-001')
        with self.assertRaises(IntegrityError):
            make_vehicle(plate='DUP-001')


class VehicleNullableFieldsTest(TestCase):
    """Tests de campos nullable."""

    def test_driver_nullable(self):
        """driver acepta None explícito."""
        vehicle = make_vehicle(driver=None)
        self.assertIsNone(vehicle.driver)

    def test_capacity_m3_nullable(self):
        """capacity_m3 acepta None explícito."""
        vehicle = make_vehicle(capacity_m3=None)
        self.assertIsNone(vehicle.capacity_m3)

    def test_last_maintenance_nullable(self):
        """last_maintenance acepta None explícito."""
        vehicle = make_vehicle(last_maintenance=None)
        self.assertIsNone(vehicle.last_maintenance)


class VehicleMetaOrderingTest(TestCase):
    """Tests del orden definido en Meta."""

    def test_meta_ordering_by_plate(self):
        """Los vehículos se ordenan por plate ascendente."""
        make_vehicle(plate='ZZZ-001')
        make_vehicle(plate='AAA-002')
        make_vehicle(plate='MMM-003')
        plates = list(Vehicle.objects.values_list('plate', flat=True))
        self.assertEqual(plates, sorted(plates))


class VehicleSetNullOnDriverDeleteTest(TestCase):
    """Tests del comportamiento SET_NULL al eliminar el driver."""

    def test_set_null_when_driver_deleted(self):
        """Al eliminar el driver, vehicle.driver queda en None."""
        driver = make_driver()
        vehicle = make_vehicle(driver=driver)
        driver_user = driver.user
        driver.delete()
        vehicle.refresh_from_db()
        self.assertIsNone(vehicle.driver)


class VehicleChoicesTest(TestCase):
    """Tests que verifican que todos los choices son válidos en el modelo."""

    def test_all_vehicle_type_choices(self):
        """Todos los VehicleType choices pueden guardarse en BD."""
        plates = iter([f'V{i:03d}-001' for i in range(10)])
        for choice in VehicleType.values:
            vehicle = make_vehicle(plate=next(plates), vehicle_type=choice)
            vehicle.refresh_from_db()
            self.assertEqual(vehicle.vehicle_type, choice)

    def test_all_fuel_type_choices(self):
        """Todos los FuelType choices pueden guardarse en BD."""
        plates = iter([f'F{i:03d}-002' for i in range(10)])
        for choice in FuelType.values:
            vehicle = make_vehicle(plate=next(plates), fuel_type=choice)
            vehicle.refresh_from_db()
            self.assertEqual(vehicle.fuel_type, choice)

    def test_all_vehicle_status_choices(self):
        """Todos los VehicleStatus choices pueden guardarse en BD."""
        plates = iter([f'S{i:03d}-003' for i in range(10)])
        for choice in VehicleStatus.values:
            vehicle = make_vehicle(plate=next(plates), status=choice)
            vehicle.refresh_from_db()
            self.assertEqual(vehicle.status, choice)
