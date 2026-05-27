"""Tests para el modelo Product y sus choices ProductCategory."""

from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.products.models import Product, ProductCategory
from apps.suppliers.models import Supplier


class ProductModelHappyPathTests(TestCase):
    """Casos felices: creación válida y comportamiento esperado."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )

    def test_create_product_with_supplier(self):
        """Crea un producto con todos los campos obligatorios y supplier."""
        product = Product.objects.create(
            supplier=self.supplier,
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            weight_kg=Decimal('1.130'),
        )
        self.assertEqual(product.sku, 'LAP-TP-X1C-001')
        self.assertEqual(product.name, 'Laptop ThinkPad X1 Carbon')
        self.assertEqual(product.category, ProductCategory.LAPTOP)
        self.assertEqual(product.unit_price, Decimal('1850000.00'))
        self.assertEqual(product.supplier, self.supplier)

    def test_create_product_without_supplier(self):
        """Crea un producto sin supplier — supplier es nullable."""
        product = Product.objects.create(
            supplier=None,
            sku='MOB-SAM-A54-002',
            name='Samsung Galaxy A54',
            category=ProductCategory.MOBILE,
            unit_price=Decimal('950000.00'),
        )
        self.assertIsNone(product.supplier)
        self.assertEqual(product.sku, 'MOB-SAM-A54-002')

    def test_str_returns_sku_and_name(self):
        """__str__ retorna el formato 'sku — name'."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        self.assertEqual(str(product), 'LAP-TP-X1C-001 — Laptop ThinkPad X1 Carbon')

    def test_default_stock_quantity_is_zero(self):
        """stock_quantity por defecto es 0."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_default_weight_kg_is_zero(self):
        """weight_kg por defecto es 0."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        self.assertEqual(product.weight_kg, Decimal('0'))

    def test_default_is_active_is_true(self):
        """is_active por defecto es True."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        self.assertTrue(product.is_active)

    def test_nullable_fields_accept_none(self):
        """description y dimensions_cm aceptan None."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            description=None,
            dimensions_cm=None,
        )
        self.assertIsNone(product.description)
        self.assertIsNone(product.dimensions_cm)

    def test_timestamps_are_set_automatically(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        self.assertIsNotNone(product.created_at)
        self.assertIsNotNone(product.updated_at)

    def test_meta_ordering_by_name(self):
        """Los productos se ordenan por name de forma ascendente."""
        Product.objects.create(
            sku='STO-WD-1TB-003',
            name='Western Digital HDD 1TB',
            category=ProductCategory.STORAGE,
            unit_price=Decimal('220000.00'),
        )
        Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )
        Product.objects.create(
            sku='MOB-SAM-A54-002',
            name='Samsung Galaxy A54',
            category=ProductCategory.MOBILE,
            unit_price=Decimal('950000.00'),
        )
        products = list(Product.objects.values_list('name', flat=True))
        self.assertEqual(products, sorted(products))

    def test_all_product_category_choices(self):
        """Todas las opciones de ProductCategory pueden usarse al crear productos."""
        categories = [
            (ProductCategory.LAPTOP, 'LAP-TEST-001'),
            (ProductCategory.DESKTOP, 'DES-TEST-002'),
            (ProductCategory.MOBILE, 'MOB-TEST-003'),
            (ProductCategory.TABLET, 'TAB-TEST-004'),
            (ProductCategory.PERIPHERAL, 'PER-TEST-005'),
            (ProductCategory.NETWORKING, 'NET-TEST-006'),
            (ProductCategory.STORAGE, 'STO-TEST-007'),
            (ProductCategory.OTHER, 'OTH-TEST-008'),
        ]
        for category, sku in categories:
            product = Product.objects.create(
                sku=sku,
                name=f'Producto {category}',
                category=category,
                unit_price=Decimal('100000.00'),
            )
            self.assertEqual(product.category, category)


class ProductModelUnhappyPathTests(TestCase):
    """Casos negativos: unicidad, campos requeridos."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )

    def test_sku_unique_constraint_raises_integrity_error(self):
        """Crear un segundo producto con el mismo SKU lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                sku='LAP-TP-X1C-001',
                name='Laptop ThinkPad X1 Carbon Duplicado',
                category=ProductCategory.LAPTOP,
                unit_price=Decimal('1800000.00'),
            )


class ProductModelEdgeCaseTests(TestCase):
    """Casos de borde: SET_NULL en eliminación de supplier."""

    def test_supplier_set_null_on_supplier_delete(self):
        """Al eliminar el supplier, product.supplier queda en None (SET_NULL)."""
        supplier = Supplier.objects.create(
            name='Proveedor Temporal SA',
            email='temp@proveedor.com',
            country='Colombia',
        )
        product = Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            supplier=supplier,
        )
        supplier.delete()
        product.refresh_from_db()
        self.assertIsNone(product.supplier)
