"""Tests del modelo Supplier — validaciones de campos, constraints y comportamiento ORM."""
from django.test import TestCase
from django.db import IntegrityError
from apps.suppliers.models import Supplier


class SupplierCreationTest(TestCase):
    """Happy path: creación válida con datos mínimos requeridos."""

    def test_create_supplier_with_required_fields(self):
        """El modelo se crea correctamente con name y email."""
        supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
        )
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.name, 'Importaciones Tech LTDA')
        self.assertEqual(supplier.email, 'ventas@importech.com')

    def test_str_returns_name(self):
        """__str__ retorna el nombre del proveedor."""
        supplier = Supplier.objects.create(
            name='Distribuidora Digital SAS',
            email='contacto@digidata.com',
        )
        self.assertEqual(str(supplier), 'Distribuidora Digital SAS')

    def test_default_is_active_true(self):
        """El campo is_active tiene default True."""
        supplier = Supplier.objects.create(
            name='Proveedor Nacional SA',
            email='info@provnacional.com',
        )
        self.assertTrue(supplier.is_active)

    def test_default_country_colombia(self):
        """El campo country tiene default 'Colombia'."""
        supplier = Supplier.objects.create(
            name='Tecnologias Andinas',
            email='soporte@tecandinas.com',
        )
        self.assertEqual(supplier.country, 'Colombia')

    def test_timestamps_assigned_on_create(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        supplier = Supplier.objects.create(
            name='Sistemas Logisticos SA',
            email='admin@syslogsa.com',
        )
        self.assertIsNotNone(supplier.created_at)
        self.assertIsNotNone(supplier.updated_at)

    def test_updated_at_changes_on_save(self):
        """updated_at cambia al actualizar el registro."""
        supplier = Supplier.objects.create(
            name='Cargo Express LTDA',
            email='ops@cargoexpress.com',
        )
        original_updated = supplier.updated_at
        supplier.contact_name = 'Juan Perez'
        supplier.save()
        self.assertGreaterEqual(supplier.updated_at, original_updated)


class SupplierNullableFieldsTest(TestCase):
    """Edge cases: campos nullable aceptan None sin error."""

    def test_nullable_fields_accept_none(self):
        """contact_name, phone, address, city y tax_id aceptan None."""
        supplier = Supplier.objects.create(
            name='Global Tech Importaciones',
            email='imports@globaltech.com',
            contact_name=None,
            phone=None,
            address=None,
            city=None,
            tax_id=None,
        )
        self.assertIsNone(supplier.contact_name)
        self.assertIsNone(supplier.phone)
        self.assertIsNone(supplier.address)
        self.assertIsNone(supplier.city)
        self.assertIsNone(supplier.tax_id)

    def test_full_creation_with_all_fields(self):
        """Creación con todos los campos opcionales completados."""
        supplier = Supplier.objects.create(
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
        self.assertEqual(supplier.contact_name, 'Maria Torres')
        self.assertEqual(supplier.city, 'Bogota')
        self.assertEqual(supplier.tax_id, '900123456-7')


class SupplierUniqueConstraintsTest(TestCase):
    """Unhappy paths: constraints UNIQUE lanzan IntegrityError."""

    def test_email_unique_raises_error(self):
        """Duplicar email lanza IntegrityError."""
        Supplier.objects.create(
            name='Proveedor Uno',
            email='duplicado@proveedores.com',
        )
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Proveedor Dos',
                email='duplicado@proveedores.com',
            )

    def test_tax_id_unique_raises_error(self):
        """Duplicar tax_id lanza IntegrityError."""
        Supplier.objects.create(
            name='Distribuidora Alfa',
            email='alfa@distribuidora.com',
            tax_id='800456789-1',
        )
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Distribuidora Beta',
                email='beta@distribuidora.com',
                tax_id='800456789-1',
            )


class SupplierOrderingTest(TestCase):
    """Verifica que Meta.ordering=['name'] se respeta."""

    def test_default_ordering_by_name(self):
        """Los proveedores se retornan ordenados por nombre ascendente."""
        Supplier.objects.create(name='Zeta Tecnologia', email='zeta@tech.com')
        Supplier.objects.create(name='Alfa Suministros', email='alfa@sum.com')
        Supplier.objects.create(name='Mega Distribuciones', email='mega@dist.com')

        suppliers = list(Supplier.objects.all())
        names = [s.name for s in suppliers]
        self.assertEqual(names, sorted(names))
