"""Tests de serializers de Driver — validación de campos, errores y estructura de salida."""

from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase

from apps.drivers.models import Driver, DriverStatus, LicenseType
from apps.drivers.serializers import (
    DriverDetailSerializer,
    DriverListSerializer,
    DriverWriteSerializer,
)


def make_user(username='conductor_juan', first_name='Juan', last_name='Perez', email='juan@example.com'):
    """Crea un User de Django para usar como perfil de conductor."""
    return User.objects.create_user(
        username=username,
        password='secure_pass_123',
        first_name=first_name,
        last_name=last_name,
        email=email,
    )


def make_driver(user, license_number='COL-B-123456', national_id='79854321'):
    """Crea un Driver con datos realistas."""
    return Driver.objects.create(
        user=user,
        license_number=license_number,
        license_type=LicenseType.B,
        license_expiry=date(2027, 12, 31),
        phone='3001234567',
        national_id=national_id,
    )


def valid_write_data(user_id, license_number='COL-B-123456', national_id='79854321'):
    """Retorna un dict con datos válidos para DriverWriteSerializer."""
    return {
        'user': user_id,
        'license_number': license_number,
        'license_type': 'B',
        'license_expiry': '2027-12-31',
        'phone': '3001234567',
        'national_id': national_id,
    }


class DriverListSerializerTest(TestCase):
    """Tests del serializer de listado — verifica campos mínimos."""

    def setUp(self):
        self.driver_user = make_user()
        self.driver = make_driver(self.driver_user)

    def test_list_serializer_contains_required_fields(self):
        """DriverListSerializer expone los campos mínimos del listado."""
        serializer = DriverListSerializer(self.driver)
        data = serializer.data
        for field in ['id', 'user', 'license_type', 'status', 'national_id']:
            self.assertIn(field, data)

    def test_list_serializer_user_is_expanded(self):
        """El campo user en DriverListSerializer contiene los datos del usuario."""
        serializer = DriverListSerializer(self.driver)
        user_data = serializer.data['user']
        self.assertIn('id', user_data)
        self.assertIn('username', user_data)
        self.assertIn('first_name', user_data)
        self.assertIn('last_name', user_data)
        self.assertIn('email', user_data)

    def test_list_serializer_does_not_expose_sensitive_fields(self):
        """DriverListSerializer no expone campos de detalle como license_expiry ni phone."""
        serializer = DriverListSerializer(self.driver)
        data = serializer.data
        self.assertNotIn('license_expiry', data)
        self.assertNotIn('phone', data)
        self.assertNotIn('date_of_birth', data)


class DriverDetailSerializerTest(TestCase):
    """Tests del serializer de detalle — verifica todos los campos y user expandido."""

    def setUp(self):
        self.driver_user = make_user()
        self.driver = make_driver(self.driver_user)

    def test_detail_serializer_includes_all_fields(self):
        """DriverDetailSerializer incluye todos los campos del modelo."""
        serializer = DriverDetailSerializer(self.driver)
        data = serializer.data
        expected_fields = [
            'id', 'user', 'license_number', 'license_type', 'license_expiry',
            'phone', 'status', 'date_of_birth', 'national_id',
            'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, data)

    def test_detail_serializer_user_nested(self):
        """El campo user en DriverDetailSerializer está completamente expandido."""
        serializer = DriverDetailSerializer(self.driver)
        user_data = serializer.data['user']
        self.assertEqual(user_data['username'], 'conductor_juan')
        self.assertEqual(user_data['first_name'], 'Juan')
        self.assertEqual(user_data['last_name'], 'Perez')

    def test_detail_serializer_values_correct(self):
        """Los valores retornados coinciden con los datos guardados en el modelo."""
        serializer = DriverDetailSerializer(self.driver)
        data = serializer.data
        self.assertEqual(data['license_number'], 'COL-B-123456')
        self.assertEqual(data['national_id'], '79854321')
        self.assertEqual(data['phone'], '3001234567')
        self.assertEqual(data['status'], DriverStatus.AVAILABLE)


class DriverWriteSerializerHappyPathTest(TestCase):
    """Tests del happy path del serializer de escritura."""

    def setUp(self):
        self.driver_user = make_user()

    def test_write_serializer_valid_with_complete_data(self):
        """DriverWriteSerializer es válido cuando se proveen todos los campos requeridos."""
        data = valid_write_data(self.driver_user.pk)
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_saves_driver(self):
        """DriverWriteSerializer.save() crea un Driver en base de datos."""
        data = valid_write_data(self.driver_user.pk)
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        driver = serializer.save()
        self.assertIsInstance(driver, Driver)
        self.assertEqual(driver.license_number, 'COL-B-123456')

    def test_write_serializer_optional_date_of_birth(self):
        """date_of_birth es opcional y puede omitirse en la escritura."""
        data = valid_write_data(self.driver_user.pk)
        # date_of_birth no está incluido — debe ser válido igualmente
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_with_date_of_birth(self):
        """El serializer acepta date_of_birth cuando se provee."""
        data = valid_write_data(self.driver_user.pk)
        data['date_of_birth'] = '1985-06-15'
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class DriverWriteSerializerMissingFieldsTest(TestCase):
    """Tests de campos requeridos faltantes en DriverWriteSerializer."""

    def setUp(self):
        self.driver_user = make_user()
        self.base_data = valid_write_data(self.driver_user.pk)

    def _assert_invalid_without(self, field):
        """Verifica que el serializer es inválido cuando falta el campo dado."""
        data = {k: v for k, v in self.base_data.items() if k != field}
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn(field, serializer.errors)

    def test_missing_user_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo user."""
        self._assert_invalid_without('user')

    def test_missing_license_number_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo license_number."""
        self._assert_invalid_without('license_number')

    def test_missing_license_type_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo license_type."""
        self._assert_invalid_without('license_type')

    def test_missing_license_expiry_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo license_expiry."""
        self._assert_invalid_without('license_expiry')

    def test_missing_phone_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo phone."""
        self._assert_invalid_without('phone')

    def test_missing_national_id_is_invalid(self):
        """DriverWriteSerializer falla si no se provee el campo national_id."""
        self._assert_invalid_without('national_id')


class DriverWriteSerializerEdgeCasesTest(TestCase):
    """Tests de edge cases e inputs inválidos en DriverWriteSerializer."""

    def setUp(self):
        self.driver_user = make_user()

    def test_invalid_license_type_raises_error(self):
        """license_type con un valor fuera de los choices es inválido."""
        data = valid_write_data(self.driver_user.pk)
        data['license_type'] = 'X'
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_type', serializer.errors)

    def test_invalid_status_raises_error(self):
        """status con un valor fuera de los choices es inválido."""
        data = valid_write_data(self.driver_user.pk)
        data['status'] = 'FLYING'
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_nonexistent_user_fk_raises_error(self):
        """Un user ID que no existe en la base de datos provoca error de validación."""
        data = valid_write_data(user_id=99999)
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)

    def test_duplicate_license_number_raises_error(self):
        """license_number ya registrado en otro Driver es inválido (UNIQUE)."""
        # Crear primer conductor
        make_driver(self.driver_user, license_number='COL-B-123456', national_id='79854321')
        # Intentar crear segundo conductor con la misma licencia
        second_user = make_user(username='conductor_pedro', email='pedro@example.com')
        data = valid_write_data(second_user.pk, license_number='COL-B-123456', national_id='11223344')
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_duplicate_national_id_raises_error(self):
        """national_id ya registrado en otro Driver es inválido (UNIQUE)."""
        make_driver(self.driver_user, license_number='COL-B-123456', national_id='79854321')
        second_user = make_user(username='conductor_maria', email='maria@example.com')
        data = valid_write_data(second_user.pk, license_number='COL-C-999999', national_id='79854321')
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('national_id', serializer.errors)
