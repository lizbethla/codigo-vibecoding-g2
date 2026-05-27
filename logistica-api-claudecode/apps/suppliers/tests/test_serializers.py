"""Tests de serializers de Supplier — validación de campos, errores y estructura de respuesta."""
from django.test import TestCase
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import (
    SupplierListSerializer,
    SupplierDetailSerializer,
    SupplierWriteSerializer,
)


class SupplierListSerializerTest(TestCase):
    """Verifica los campos mínimos que expone SupplierListSerializer."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
            is_active=True,
        )

    def test_list_serializer_contains_expected_fields(self):
        """SupplierListSerializer incluye id, name, email, country e is_active."""
        serializer = SupplierListSerializer(self.supplier)
        data = serializer.data
        expected_fields = {'id', 'name', 'email', 'country', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_list_serializer_does_not_expose_internal_fields(self):
        """SupplierListSerializer no expone contact_name, phone, address, tax_id ni timestamps."""
        serializer = SupplierListSerializer(self.supplier)
        data = serializer.data
        hidden_fields = {'contact_name', 'phone', 'address', 'city', 'tax_id', 'created_at', 'updated_at'}
        for field in hidden_fields:
            self.assertNotIn(field, data)


class SupplierDetailSerializerTest(TestCase):
    """Verifica que SupplierDetailSerializer expone todos los campos del modelo."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Electro Supply Colombia',
            contact_name='Maria Torres',
            email='mtorres@electrosupply.com',
            phone='+57 310 456 7890',
            address='Calle 80 # 45-20, Bodega 3',
            city='Bogota',
            country='Colombia',
            tax_id='900123456-7',
            is_active=True,
        )

    def test_detail_serializer_includes_all_fields(self):
        """SupplierDetailSerializer incluye todos los campos del modelo."""
        serializer = SupplierDetailSerializer(self.supplier)
        data = serializer.data
        expected_fields = {
            'id', 'name', 'contact_name', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_detail_serializer_values_match_instance(self):
        """Los valores del serializer coinciden con los del objeto."""
        serializer = SupplierDetailSerializer(self.supplier)
        data = serializer.data
        self.assertEqual(data['name'], 'Electro Supply Colombia')
        self.assertEqual(data['email'], 'mtorres@electrosupply.com')
        self.assertEqual(data['tax_id'], '900123456-7')
        self.assertEqual(data['city'], 'Bogota')


class SupplierWriteSerializerValidTest(TestCase):
    """Happy path: SupplierWriteSerializer válido con datos correctos."""

    def test_write_serializer_valid_with_minimum_data(self):
        """SupplierWriteSerializer es válido con name y email únicamente."""
        data = {
            'name': 'Distribuidora Digital SAS',
            'email': 'contacto@digidata.com',
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_valid_with_all_fields(self):
        """SupplierWriteSerializer es válido con todos los campos opcionales."""
        data = {
            'name': 'Sistemas Logisticos SA',
            'contact_name': 'Carlos Mendez',
            'email': 'cmendez@syslog.com',
            'phone': '+57 301 234 5678',
            'address': 'Carrera 15 # 90-45',
            'city': 'Medellin',
            'country': 'Colombia',
            'tax_id': '830567891-2',
            'is_active': True,
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_save_creates_supplier(self):
        """save() crea el proveedor en la base de datos."""
        data = {
            'name': 'Cargo Express LTDA',
            'email': 'ops@cargoexpress.com',
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNotNone(instance.pk)
        self.assertTrue(Supplier.objects.filter(email='ops@cargoexpress.com').exists())


class SupplierWriteSerializerInvalidTest(TestCase):
    """Unhappy paths y edge cases: SupplierWriteSerializer con datos incorrectos."""

    def test_fails_without_name(self):
        """SupplierWriteSerializer falla si no se provee name."""
        data = {'email': 'sin-nombre@proveedor.com'}
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_fails_without_email(self):
        """SupplierWriteSerializer falla si no se provee email."""
        data = {'name': 'Proveedor Sin Email'}
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_fails_with_malformed_email(self):
        """SupplierWriteSerializer falla con email con formato inválido."""
        data = {
            'name': 'Proveedor Email Invalido',
            'email': 'no-es-un-email',
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_fails_with_duplicate_tax_id(self):
        """SupplierWriteSerializer falla con tax_id ya existente en la BD."""
        Supplier.objects.create(
            name='Proveedor Original',
            email='original@proveedor.com',
            tax_id='901234567-8',
        )
        data = {
            'name': 'Proveedor Duplicado',
            'email': 'duplicado@proveedor.com',
            'tax_id': '901234567-8',
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tax_id', serializer.errors)

    def test_fails_with_duplicate_email(self):
        """SupplierWriteSerializer falla con email ya existente en la BD."""
        Supplier.objects.create(
            name='Proveedor Existente',
            email='existente@proveedor.com',
        )
        data = {
            'name': 'Proveedor Nuevo',
            'email': 'existente@proveedor.com',
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
