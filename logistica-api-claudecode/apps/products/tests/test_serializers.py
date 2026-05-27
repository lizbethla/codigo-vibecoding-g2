"""Tests para los serializers ProductListSerializer, ProductDetailSerializer y ProductWriteSerializer."""

from decimal import Decimal

from django.test import TestCase

from apps.products.models import Product, ProductCategory
from apps.products.serializers import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)
from apps.suppliers.models import Supplier


class ProductListSerializerTests(TestCase):
    """Tests para ProductListSerializer — campos mínimos para listados."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            weight_kg=Decimal('1.130'),
            stock_quantity=15,
        )

    def test_list_serializer_contains_expected_fields(self):
        """ProductListSerializer incluye exactamente los campos mínimos esperados."""
        serializer = ProductListSerializer(self.product)
        data = serializer.data
        expected_fields = {'id', 'sku', 'name', 'category', 'unit_price', 'stock_quantity', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_list_serializer_does_not_expand_supplier(self):
        """ProductListSerializer no incluye el campo supplier."""
        serializer = ProductListSerializer(self.product)
        self.assertNotIn('supplier', serializer.data)

    def test_list_serializer_correct_values(self):
        """Los valores serializados en lista son los del producto creado."""
        serializer = ProductListSerializer(self.product)
        data = serializer.data
        self.assertEqual(data['sku'], 'LAP-TP-X1C-001')
        self.assertEqual(data['name'], 'Laptop ThinkPad X1 Carbon')
        self.assertEqual(data['category'], ProductCategory.LAPTOP)
        self.assertTrue(data['is_active'])


class ProductDetailSerializerTests(TestCase):
    """Tests para ProductDetailSerializer — todos los campos y relaciones expandidas."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            description='Ultrabook empresarial con procesador Intel Core i7',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            weight_kg=Decimal('1.130'),
            dimensions_cm='36×24×1.6',
            stock_quantity=15,
        )

    def test_detail_serializer_includes_all_fields(self):
        """ProductDetailSerializer incluye todos los campos del modelo."""
        serializer = ProductDetailSerializer(self.product)
        data = serializer.data
        expected_fields = {
            'id', 'supplier', 'sku', 'name', 'description', 'category',
            'unit_price', 'weight_kg', 'dimensions_cm', 'stock_quantity',
            'is_active', 'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_detail_serializer_expands_supplier(self):
        """El campo supplier en detalle incluye id y name del proveedor."""
        serializer = ProductDetailSerializer(self.product)
        supplier_data = serializer.data['supplier']
        self.assertIn('id', supplier_data)
        self.assertIn('name', supplier_data)
        self.assertEqual(supplier_data['id'], self.supplier.id)
        self.assertEqual(supplier_data['name'], 'Importaciones Tech LTDA')

    def test_detail_serializer_supplier_is_none_when_not_set(self):
        """El campo supplier es None cuando el producto no tiene proveedor."""
        product_no_supplier = Product.objects.create(
            sku='MOB-SAM-A54-002',
            name='Samsung Galaxy A54',
            category=ProductCategory.MOBILE,
            unit_price=Decimal('950000.00'),
        )
        serializer = ProductDetailSerializer(product_no_supplier)
        self.assertIsNone(serializer.data['supplier'])


class ProductWriteSerializerHappyPathTests(TestCase):
    """Casos felices del serializer de escritura."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )

    def test_write_serializer_valid_with_all_fields(self):
        """ProductWriteSerializer acepta datos completos con supplier."""
        data = {
            'supplier': self.supplier.id,
            'sku': 'LAP-TP-X1C-001',
            'name': 'Laptop ThinkPad X1 Carbon',
            'description': 'Ultrabook empresarial con procesador Intel Core i7',
            'category': ProductCategory.LAPTOP,
            'unit_price': '1850000.00',
            'weight_kg': '1.130',
            'dimensions_cm': '36×24×1.6',
            'stock_quantity': 15,
            'is_active': True,
        }
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_valid_without_supplier(self):
        """ProductWriteSerializer acepta datos sin supplier (supplier nullable)."""
        data = {
            'sku': 'MOB-SAM-A54-002',
            'name': 'Samsung Galaxy A54',
            'category': ProductCategory.MOBILE,
            'unit_price': '950000.00',
        }
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_with_valid_supplier_fk(self):
        """ProductWriteSerializer acepta el id de un supplier existente."""
        data = {
            'supplier': self.supplier.id,
            'sku': 'NET-TP-AX6000-003',
            'name': 'TP-Link AX6000 Router',
            'category': ProductCategory.NETWORKING,
            'unit_price': '450000.00',
        }
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.supplier, self.supplier)


class ProductWriteSerializerUnhappyPathTests(TestCase):
    """Casos negativos del serializer de escritura: campos requeridos y validaciones."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        # Producto existente para test de SKU duplicado
        Product.objects.create(
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
        )

    def _base_valid_data(self):
        """Retorna un dict con los campos mínimos válidos para reusar en tests."""
        return {
            'sku': 'PER-LOG-K350-010',
            'name': 'Logitech K350 Teclado Inalámbrico',
            'category': ProductCategory.PERIPHERAL,
            'unit_price': '180000.00',
        }

    def test_write_serializer_fails_without_name(self):
        """ProductWriteSerializer falla si falta el campo name."""
        data = self._base_valid_data()
        del data['name']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_write_serializer_fails_without_sku(self):
        """ProductWriteSerializer falla si falta el campo sku."""
        data = self._base_valid_data()
        del data['sku']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_write_serializer_fails_without_category(self):
        """ProductWriteSerializer falla si falta el campo category."""
        data = self._base_valid_data()
        del data['category']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)

    def test_write_serializer_fails_without_unit_price(self):
        """ProductWriteSerializer falla si falta el campo unit_price."""
        data = self._base_valid_data()
        del data['unit_price']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_write_serializer_fails_with_invalid_category(self):
        """ProductWriteSerializer falla si category tiene un valor fuera de las opciones."""
        data = self._base_valid_data()
        data['category'] = 'INVALID_CATEGORY'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)

    def test_write_serializer_fails_with_duplicate_sku(self):
        """ProductWriteSerializer falla si el SKU ya existe en la base de datos."""
        data = self._base_valid_data()
        data['sku'] = 'LAP-TP-X1C-001'  # SKU que ya existe en setUp
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_write_serializer_fails_with_nonexistent_supplier_fk(self):
        """ProductWriteSerializer falla si el id de supplier no existe."""
        data = self._base_valid_data()
        data['supplier'] = 99999  # ID que no existe
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)
