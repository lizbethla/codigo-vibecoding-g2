"""
Tests de serializers del módulo customers.

Cubre: CustomerListSerializer, CustomerDetailSerializer, CustomerWriteSerializer.
Valida campos presentes, happy paths y unhappy paths de validación.
"""
from django.test import TestCase

from apps.customers.models import Customer, CustomerType
from apps.customers.serializers import (
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerWriteSerializer,
)


class CustomerListSerializerTest(TestCase):
    """Pruebas del serializer de listado (campos mínimos)."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Logística Express del Sur SAS',
            email='contacto@logisticaexpress.com',
            customer_type=CustomerType.COMPANY,
            country='Colombia',
            is_active=True,
        )
        self.serializer = CustomerListSerializer(instance=self.customer)

    def test_list_serializer_contains_minimum_fields(self):
        """CustomerListSerializer debe contener id, name, customer_type, email, is_active."""
        data = self.serializer.data
        expected_fields = {'id', 'name', 'customer_type', 'email', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_list_serializer_values_are_correct(self):
        """Los valores serializados deben coincidir con los datos del modelo."""
        data = self.serializer.data
        self.assertEqual(data['name'], 'Logística Express del Sur SAS')
        self.assertEqual(data['email'], 'contacto@logisticaexpress.com')
        self.assertEqual(data['customer_type'], 'COMPANY')
        self.assertTrue(data['is_active'])

    def test_list_serializer_excludes_detail_fields(self):
        """El serializer de lista no debe incluir campos de detalle como phone, address, city."""
        data = self.serializer.data
        self.assertNotIn('phone', data)
        self.assertNotIn('address', data)
        self.assertNotIn('city', data)
        self.assertNotIn('country', data)
        self.assertNotIn('tax_id', data)
        self.assertNotIn('created_at', data)
        self.assertNotIn('updated_at', data)


class CustomerDetailSerializerTest(TestCase):
    """Pruebas del serializer de detalle (todos los campos)."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Distribuidora de Tecnología Antioquia SAS',
            email='info@distecantioquia.com',
            customer_type=CustomerType.COMPANY,
            tax_id='860012345-2',
            phone='+57 4 4441234',
            address='Carrera 43A #1-50 Medellín',
            city='Medellín',
            country='Colombia',
            is_active=True,
        )
        self.serializer = CustomerDetailSerializer(instance=self.customer)

    def test_detail_serializer_includes_all_fields(self):
        """CustomerDetailSerializer debe incluir todos los campos del modelo."""
        data = self.serializer.data
        expected_fields = {
            'id', 'name', 'customer_type', 'tax_id', 'email',
            'phone', 'address', 'city', 'country', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_detail_serializer_timestamps_are_present(self):
        """created_at y updated_at deben estar presentes en el detalle."""
        data = self.serializer.data
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        self.assertIsNotNone(data['created_at'])
        self.assertIsNotNone(data['updated_at'])

    def test_detail_serializer_all_values_correct(self):
        """Todos los valores del serializer de detalle deben ser correctos."""
        data = self.serializer.data
        self.assertEqual(data['name'], 'Distribuidora de Tecnología Antioquia SAS')
        self.assertEqual(data['email'], 'info@distecantioquia.com')
        self.assertEqual(data['tax_id'], '860012345-2')
        self.assertEqual(data['phone'], '+57 4 4441234')
        self.assertEqual(data['city'], 'Medellín')
        self.assertEqual(data['country'], 'Colombia')


class CustomerWriteSerializerValidTest(TestCase):
    """Pruebas del serializer de escritura — happy paths."""

    def test_write_serializer_valid_with_required_fields(self):
        """Happy path: serializer válido con campos mínimos requeridos."""
        data = {
            'name': 'Sistemas Integrados del Oriente SAS',
            'email': 'sistemas@orientesas.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_valid_with_all_fields(self):
        """Happy path: serializer válido con todos los campos especificados."""
        data = {
            'name': 'Importaciones Cali SAS',
            'customer_type': 'COMPANY',
            'tax_id': '890123456-3',
            'email': 'compras@importacionescali.com',
            'phone': '+57 2 6789012',
            'address': 'Av 6N #23-45, Cali',
            'city': 'Cali',
            'country': 'Colombia',
            'is_active': True,
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_individual_type(self):
        """Happy path: tipo INDIVIDUAL es válido."""
        data = {
            'name': 'Pedro Alejandro Torres',
            'customer_type': 'INDIVIDUAL',
            'email': 'pedro.torres@correo.co',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_saves_customer(self):
        """El serializer válido debe crear el objeto en BD correctamente."""
        data = {
            'name': 'Compañía de Envíos Rapidos Ltda',
            'email': 'rapidos@envios.co',
            'country': 'Colombia',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        customer = serializer.save()
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.name, 'Compañía de Envíos Rapidos Ltda')


class CustomerWriteSerializerInvalidTest(TestCase):
    """Pruebas del serializer de escritura — unhappy paths y edge cases."""

    def test_write_serializer_fails_without_name(self):
        """Unhappy path: serializer inválido cuando falta el campo name."""
        data = {'email': 'sinname@empresa.com'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_write_serializer_fails_without_email(self):
        """Unhappy path: serializer inválido cuando falta el campo email."""
        data = {'name': 'Empresa Sin Email SAS'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_write_serializer_fails_with_invalid_customer_type(self):
        """Edge case: customer_type con valor no permitido debe fallar."""
        data = {
            'name': 'Empresa Tipo Inválido SAS',
            'email': 'tipo@invalido.com',
            'customer_type': 'UNKNOWN_TYPE',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_write_serializer_fails_with_malformed_email(self):
        """Edge case: email malformado debe fallar la validación."""
        data = {
            'name': 'Empresa Email Malformado SAS',
            'email': 'esto-no-es-un-email',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_write_serializer_fails_with_email_missing_domain(self):
        """Edge case: email sin dominio debe fallar la validación."""
        data = {
            'name': 'Empresa Email Sin Dominio SAS',
            'email': 'usuario@',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_write_serializer_fails_with_duplicate_email(self):
        """Unhappy path: email duplicado debe fallar la validación a nivel de serializer."""
        Customer.objects.create(
            name='Empresa Existente SA',
            email='existente@empresa.com',
        )
        data = {
            'name': 'Empresa Nueva con Email Igual SAS',
            'email': 'existente@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_write_serializer_fails_with_duplicate_tax_id(self):
        """Unhappy path: tax_id duplicado debe fallar la validación a nivel de serializer."""
        Customer.objects.create(
            name='Empresa Existente NIT SAS',
            email='nit@existente.com',
            tax_id='700987654-1',
        )
        data = {
            'name': 'Otra Empresa Mismo NIT SAS',
            'email': 'otro@email.com',
            'tax_id': '700987654-1',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tax_id', serializer.errors)
