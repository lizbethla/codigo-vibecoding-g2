"""
Tests del modelo Customer.

Cubre: creación válida, defaults, __str__, restricciones UNIQUE,
campos nullable y ordenamiento Meta.ordering.
"""
from django.test import TestCase
from django.db import IntegrityError

from apps.customers.models import Customer, CustomerType


class CustomerCreationTest(TestCase):
    """Pruebas de creación válida con datos mínimos requeridos."""

    def test_create_customer_with_required_fields(self):
        """Happy path: cliente creado con campos mínimos obligatorios."""
        customer = Customer.objects.create(
            name='Tecnologías del Valle SAS',
            email='contacto@tecvalle.com',
        )
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.name, 'Tecnologías del Valle SAS')
        self.assertEqual(customer.email, 'contacto@tecvalle.com')

    def test_str_returns_name(self):
        """__str__ debe retornar el nombre del cliente."""
        customer = Customer.objects.create(
            name='Distribuidora Andina Ltda',
            email='info@distribuidoraandina.com',
        )
        self.assertEqual(str(customer), 'Distribuidora Andina Ltda')

    def test_default_customer_type_is_company(self):
        """El tipo de cliente por defecto debe ser COMPANY."""
        customer = Customer.objects.create(
            name='Soluciones TI del Norte',
            email='ventas@solucionesti.co',
        )
        self.assertEqual(customer.customer_type, CustomerType.COMPANY)

    def test_default_is_active_is_true(self):
        """El campo is_active debe ser True por defecto."""
        customer = Customer.objects.create(
            name='Importaciones Pacifico SAS',
            email='admin@importacionespacifico.com',
        )
        self.assertTrue(customer.is_active)

    def test_default_country_is_colombia(self):
        """El país por defecto debe ser Colombia."""
        customer = Customer.objects.create(
            name='Red de Distribución Central',
            email='central@reddistribucion.com',
        )
        self.assertEqual(customer.country, 'Colombia')

    def test_create_individual_customer(self):
        """Cliente de tipo INDIVIDUAL se crea correctamente."""
        customer = Customer.objects.create(
            name='Carlos Andrés Ramírez',
            email='carlos.ramirez@personal.com',
            customer_type=CustomerType.INDIVIDUAL,
        )
        self.assertEqual(customer.customer_type, CustomerType.INDIVIDUAL)


class CustomerUniquenessTest(TestCase):
    """Pruebas de restricciones UNIQUE en email y tax_id."""

    def setUp(self):
        self.existing_customer = Customer.objects.create(
            name='Empresa Base SA',
            email='empresa@base.com',
            tax_id='900123456-7',
        )

    def test_duplicate_email_raises_integrity_error(self):
        """Unhappy path: email duplicado debe lanzar IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa Duplicada SAS',
                email='empresa@base.com',
            )

    def test_duplicate_tax_id_raises_integrity_error(self):
        """Unhappy path: tax_id duplicado debe lanzar IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Otra Empresa SA',
                email='otra@empresa.com',
                tax_id='900123456-7',
            )


class CustomerNullableFieldsTest(TestCase):
    """Pruebas de campos nullable: phone, tax_id, address, city."""

    def test_nullable_fields_accept_none(self):
        """Edge case: campos nullable deben aceptar None sin error."""
        customer = Customer.objects.create(
            name='Empresa Sin Datos Opcionales',
            email='sindatos@empresa.com',
            phone=None,
            tax_id=None,
            address=None,
            city=None,
        )
        self.assertIsNone(customer.phone)
        self.assertIsNone(customer.tax_id)
        self.assertIsNone(customer.address)
        self.assertIsNone(customer.city)

    def test_customer_with_all_fields(self):
        """Cliente con todos los campos poblados se crea sin error."""
        customer = Customer.objects.create(
            name='Tecnología Integrada del Caribe SAS',
            customer_type=CustomerType.COMPANY,
            email='tic@caribesas.com',
            tax_id='800654321-1',
            phone='+57 4 6543210',
            address='Calle 72 #45-30 Barranquilla',
            city='Barranquilla',
            country='Colombia',
            is_active=True,
        )
        self.assertEqual(customer.city, 'Barranquilla')
        self.assertEqual(customer.phone, '+57 4 6543210')
        self.assertEqual(customer.tax_id, '800654321-1')


class CustomerOrderingTest(TestCase):
    """Pruebas de Meta.ordering = ['name']."""

    def test_meta_ordering_by_name(self):
        """Los clientes deben retornarse ordenados por nombre ascendente."""
        Customer.objects.create(name='Zulu Distribuciones SA', email='z@zulu.com')
        Customer.objects.create(name='Alfa Logística SAS', email='a@alfa.com')
        Customer.objects.create(name='Merca Tech Ltda', email='m@mercatech.com')

        names = list(Customer.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    def test_timestamps_set_automatically(self):
        """created_at y updated_at deben asignarse automáticamente."""
        customer = Customer.objects.create(
            name='Empresa Temporal SAS',
            email='temporal@empresa.com',
        )
        self.assertIsNotNone(customer.created_at)
        self.assertIsNotNone(customer.updated_at)
