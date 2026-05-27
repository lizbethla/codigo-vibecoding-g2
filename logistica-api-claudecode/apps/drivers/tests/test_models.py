"""Tests del modelo Driver — cobertura de campos, constraints y comportamiento."""

from datetime import date

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase

from apps.drivers.models import Driver, DriverStatus, LicenseType


def make_driver_user(username='conductor_juan', first_name='Juan', last_name='Perez'):
    """Crea un User de Django para usar como perfil de conductor."""
    return User.objects.create_user(
        username=username,
        password='secure_pass_123',
        first_name=first_name,
        last_name=last_name,
    )


def make_driver(user, license_number='COL-B-123456', national_id='79854321'):
    """Crea un Driver con datos realistas asociado al user dado."""
    return Driver.objects.create(
        user=user,
        license_number=license_number,
        license_type=LicenseType.B,
        license_expiry=date(2027, 12, 31),
        phone='3001234567',
        national_id=national_id,
    )


class DriverCreationTest(TestCase):
    """Tests del happy path de creación del modelo Driver."""

    def setUp(self):
        self.driver_user = make_driver_user()
        self.driver = make_driver(self.driver_user)

    def test_driver_created_successfully(self):
        """El conductor se crea correctamente con los datos proporcionados."""
        self.assertIsNotNone(self.driver.pk)
        self.assertEqual(self.driver.user, self.driver_user)
        self.assertEqual(self.driver.license_number, 'COL-B-123456')
        self.assertEqual(self.driver.license_type, LicenseType.B)
        self.assertEqual(self.driver.national_id, '79854321')
        self.assertEqual(self.driver.phone, '3001234567')

    def test_str_returns_full_name_and_license(self):
        """El __str__ retorna 'Nombre Apellido — licencia'."""
        expected = 'Juan Perez — COL-B-123456'
        self.assertEqual(str(self.driver), expected)

    def test_default_status_is_available(self):
        """El status por defecto al crear un conductor es AVAILABLE."""
        self.assertEqual(self.driver.status, DriverStatus.AVAILABLE)

    def test_date_of_birth_nullable(self):
        """El campo date_of_birth acepta None sin lanzar error."""
        self.assertIsNone(self.driver.date_of_birth)
        # Asignar un valor y volver a None
        self.driver.date_of_birth = date(1985, 6, 15)
        self.driver.save()
        self.driver.date_of_birth = None
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertIsNone(self.driver.date_of_birth)

    def test_timestamps_assigned_on_create(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        self.assertIsNotNone(self.driver.created_at)
        self.assertIsNotNone(self.driver.updated_at)


class DriverUniquenessTest(TestCase):
    """Tests de constraints UNIQUE del modelo Driver."""

    def setUp(self):
        self.driver_user = make_driver_user()
        make_driver(self.driver_user)

    def test_duplicate_license_number_raises_integrity_error(self):
        """Crear dos conductores con el mismo license_number lanza IntegrityError."""
        second_user = make_driver_user(username='conductor_pedro', first_name='Pedro', last_name='Lopez')
        with self.assertRaises(IntegrityError):
            make_driver(second_user, license_number='COL-B-123456', national_id='11223344')

    def test_duplicate_national_id_raises_integrity_error(self):
        """Crear dos conductores con el mismo national_id lanza IntegrityError."""
        second_user = make_driver_user(username='conductor_maria', first_name='Maria', last_name='Torres')
        with self.assertRaises(IntegrityError):
            make_driver(second_user, license_number='COL-C-999999', national_id='79854321')

    def test_duplicate_user_onetoone_raises_integrity_error(self):
        """Vincular el mismo user a un segundo Driver lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            make_driver(self.driver_user, license_number='COL-A-000001', national_id='00000001')


class DriverChoicesTest(TestCase):
    """Tests que verifican que todos los choices definidos son válidos."""

    def setUp(self):
        self.driver_user = make_driver_user()

    def _make_driver_with_license(self, license_type, suffix):
        user = make_driver_user(username=f'conductor_{suffix}', first_name='Ana', last_name='Ruiz')
        return Driver.objects.create(
            user=user,
            license_number=f'COL-{suffix}-100000',
            license_type=license_type,
            license_expiry=date(2027, 12, 31),
            phone='3009876543',
            national_id=f'9900{suffix}',
        )

    def test_license_type_a_valid(self):
        """LicenseType.A es un valor válido para el campo license_type."""
        driver = self._make_driver_with_license(LicenseType.A, 'A')
        self.assertEqual(driver.license_type, LicenseType.A)

    def test_license_type_b_valid(self):
        """LicenseType.B es un valor válido para el campo license_type."""
        driver = make_driver(self.driver_user)
        self.assertEqual(driver.license_type, LicenseType.B)

    def test_license_type_c_valid(self):
        """LicenseType.C es un valor válido para el campo license_type."""
        driver = self._make_driver_with_license(LicenseType.C, 'C')
        self.assertEqual(driver.license_type, LicenseType.C)

    def test_license_type_ce_valid(self):
        """LicenseType.CE es un valor válido para el campo license_type."""
        driver = self._make_driver_with_license(LicenseType.CE, 'CE')
        self.assertEqual(driver.license_type, LicenseType.CE)

    def test_license_type_btp_valid(self):
        """LicenseType.BTP es un valor válido para el campo license_type."""
        driver = self._make_driver_with_license(LicenseType.BTP, 'BTP')
        self.assertEqual(driver.license_type, LicenseType.BTP)

    def test_all_driver_status_choices(self):
        """Todos los valores de DriverStatus pueden guardarse correctamente."""
        driver = make_driver(self.driver_user)
        for status_value in [
            DriverStatus.AVAILABLE,
            DriverStatus.ON_ROUTE,
            DriverStatus.OFF_DUTY,
            DriverStatus.SUSPENDED,
        ]:
            driver.status = status_value
            driver.save()
            driver.refresh_from_db()
            self.assertEqual(driver.status, status_value)


class DriverOrderingAndCascadeTest(TestCase):
    """Tests de Meta.ordering y comportamiento de CASCADE."""

    def test_ordering_by_last_name_then_first_name(self):
        """Los conductores se ordenan por apellido y luego nombre del usuario."""
        user_z = make_driver_user(username='driver_z', first_name='Carlos', last_name='Zamora')
        user_a = make_driver_user(username='driver_a', first_name='Ana', last_name='Alvarez')
        user_m = make_driver_user(username='driver_m', first_name='Luis', last_name='Martinez')

        make_driver(user_z, license_number='COL-B-000001', national_id='11111111')
        make_driver(user_a, license_number='COL-B-000002', national_id='22222222')
        make_driver(user_m, license_number='COL-B-000003', national_id='33333333')

        drivers = list(Driver.objects.all())
        last_names = [d.user.last_name for d in drivers]
        self.assertEqual(last_names, ['Alvarez', 'Martinez', 'Zamora'])

    def test_cascade_delete_user_removes_driver(self):
        """Al eliminar el user vinculado, el Driver también se elimina (CASCADE)."""
        driver_user = make_driver_user(username='to_delete', first_name='Borrar', last_name='Este')
        driver = make_driver(driver_user, license_number='COL-B-DELETE1', national_id='99998888')
        driver_pk = driver.pk

        driver_user.delete()

        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())
