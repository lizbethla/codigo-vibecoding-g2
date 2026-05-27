"""
Tests de serializers para el módulo shipments.
Cubre ShipmentListSerializer, ShipmentDetailSerializer, ShipmentWriteSerializer,
ShipmentProductSerializer y ShipmentProductWriteSerializer.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentProduct
from apps.shipments.serializers import (
    ShipmentDetailSerializer,
    ShipmentListSerializer,
    ShipmentProductSerializer,
    ShipmentProductWriteSerializer,
    ShipmentWriteSerializer,
)
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class SerializerSetUpMixin:
    """Mixin con datos de prueba compartidos para serializers."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Tecnologías del Valle SAS',
            email='contacto@tecvalle.com',
            country='Colombia',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67',
            city='Bogotá',
            country='Colombia',
        )
        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        self.product = Product.objects.create(
            name='Laptop ThinkPad X1 Carbon',
            sku='LAP-TP-X1C-001',
            category='LAPTOP',
            unit_price='1850000.00',
            weight_kg='1.130',
            supplier=self.supplier,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 13 No. 45-67, Bogotá',
            destination_address='Carrera 80 No. 12-34, Medellín',
            destination_city='Medellín',
            destination_country='Colombia',
            recipient_name='Carlos Rodríguez',
            scheduled_date='2026-06-15',
        )
        self.valid_write_data = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'origin_address': 'Calle 13 No. 45-67, Bogotá',
            'destination_address': 'Carrera 80 No. 12-34, Medellín',
            'destination_city': 'Medellín',
            'destination_country': 'Colombia',
            'recipient_name': 'Carlos Rodríguez',
            'scheduled_date': '2026-06-15',
            'priority': 'NORMAL',
        }


class ShipmentListSerializerTest(SerializerSetUpMixin, TestCase):
    """Tests para ShipmentListSerializer."""

    def test_list_serializer_contains_minimum_fields(self):
        """ShipmentListSerializer contiene los campos mínimos esperados para listados."""
        serializer = ShipmentListSerializer(self.shipment)
        data = serializer.data
        expected_fields = ['id', 'tracking_code', 'customer', 'status', 'priority',
                           'destination_city', 'scheduled_date', 'total_cost']
        for field in expected_fields:
            self.assertIn(field, data, f'Campo {field} no encontrado en ShipmentListSerializer')

    def test_list_serializer_customer_is_summary(self):
        """El campo customer en ShipmentListSerializer es un objeto resumen."""
        serializer = ShipmentListSerializer(self.shipment)
        customer_data = serializer.data['customer']
        self.assertIn('id', customer_data)
        self.assertIn('name', customer_data)
        self.assertIn('customer_type', customer_data)

    def test_list_serializer_tracking_code_present(self):
        """El tracking_code generado aparece en la serialización."""
        serializer = ShipmentListSerializer(self.shipment)
        self.assertTrue(serializer.data['tracking_code'].startswith('LOG-'))


class ShipmentDetailSerializerTest(SerializerSetUpMixin, TestCase):
    """Tests para ShipmentDetailSerializer."""

    def test_detail_serializer_includes_all_fields(self):
        """ShipmentDetailSerializer incluye todos los campos del modelo."""
        serializer = ShipmentDetailSerializer(self.shipment)
        data = serializer.data
        core_fields = [
            'id', 'tracking_code', 'status', 'priority',
            'origin_address', 'destination_address', 'destination_city',
            'recipient_name', 'scheduled_date', 'total_cost',
            'customer', 'origin_warehouse',
        ]
        for field in core_fields:
            self.assertIn(field, data, f'Campo {field} no encontrado en ShipmentDetailSerializer')

    def test_detail_serializer_customer_expanded(self):
        """El campo customer en ShipmentDetailSerializer está expandido con nombre."""
        serializer = ShipmentDetailSerializer(self.shipment)
        customer_data = serializer.data['customer']
        self.assertIsInstance(customer_data, dict)
        self.assertEqual(customer_data['name'], 'Tecnologías del Valle SAS')

    def test_detail_serializer_origin_warehouse_expanded(self):
        """El campo origin_warehouse en ShipmentDetailSerializer está expandido."""
        serializer = ShipmentDetailSerializer(self.shipment)
        warehouse_data = serializer.data['origin_warehouse']
        self.assertIsInstance(warehouse_data, dict)
        self.assertIn('code', warehouse_data)
        self.assertIn('city', warehouse_data)

    def test_detail_serializer_route_null_when_not_set(self):
        """El campo route aparece como null cuando no está asignado."""
        serializer = ShipmentDetailSerializer(self.shipment)
        self.assertIsNone(serializer.data['route'])

    def test_detail_serializer_vehicle_null_when_not_set(self):
        """El campo vehicle aparece como null cuando no está asignado."""
        serializer = ShipmentDetailSerializer(self.shipment)
        self.assertIsNone(serializer.data['vehicle'])

    def test_detail_serializer_shipment_products_present(self):
        """ShipmentDetailSerializer incluye el campo shipment_products."""
        serializer = ShipmentDetailSerializer(self.shipment)
        self.assertIn('shipment_products', serializer.data)
        self.assertIsInstance(serializer.data['shipment_products'], list)


class ShipmentWriteSerializerValidTest(SerializerSetUpMixin, TestCase):
    """Tests de validación válida para ShipmentWriteSerializer."""

    def test_write_serializer_valid_with_minimum_fields(self):
        """Happy path: ShipmentWriteSerializer es válido con los campos mínimos requeridos."""
        serializer = ShipmentWriteSerializer(data=self.valid_write_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_optional_fields_accepted(self):
        """ShipmentWriteSerializer acepta campos opcionales como notes y recipient_phone."""
        data = self.valid_write_data.copy()
        data['notes'] = 'Envío frágil, manejar con cuidado'
        data['recipient_phone'] = '3001234567'
        serializer = ShipmentWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class ShipmentWriteSerializerInvalidTest(SerializerSetUpMixin, TestCase):
    """Tests de validación inválida para ShipmentWriteSerializer."""

    def test_write_serializer_fails_without_customer(self):
        """Unhappy path: falla si no se proporciona customer."""
        data = self.valid_write_data.copy()
        del data['customer']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_write_serializer_fails_without_origin_warehouse(self):
        """Unhappy path: falla si no se proporciona origin_warehouse."""
        data = self.valid_write_data.copy()
        del data['origin_warehouse']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_write_serializer_fails_without_origin_address(self):
        """Unhappy path: falla si no se proporciona origin_address."""
        data = self.valid_write_data.copy()
        del data['origin_address']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_address', serializer.errors)

    def test_write_serializer_fails_without_destination_address(self):
        """Unhappy path: falla si no se proporciona destination_address."""
        data = self.valid_write_data.copy()
        del data['destination_address']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_address', serializer.errors)

    def test_write_serializer_fails_without_destination_city(self):
        """Unhappy path: falla si no se proporciona destination_city."""
        data = self.valid_write_data.copy()
        del data['destination_city']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_city', serializer.errors)

    def test_write_serializer_fails_without_recipient_name(self):
        """Unhappy path: falla si no se proporciona recipient_name."""
        data = self.valid_write_data.copy()
        del data['recipient_name']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('recipient_name', serializer.errors)

    def test_write_serializer_fails_without_scheduled_date(self):
        """Unhappy path: falla si no se proporciona scheduled_date."""
        data = self.valid_write_data.copy()
        del data['scheduled_date']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('scheduled_date', serializer.errors)

    def test_write_serializer_fails_with_invalid_status(self):
        """Edge case: falla si se proporciona un status que no es un choice válido."""
        data = self.valid_write_data.copy()
        data['status'] = 'INVALID_STATUS'
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_write_serializer_fails_with_invalid_priority(self):
        """Edge case: falla si se proporciona una priority que no es un choice válido."""
        data = self.valid_write_data.copy()
        data['priority'] = 'SUPER_URGENT'
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('priority', serializer.errors)

    def test_write_serializer_fails_with_nonexistent_customer_fk(self):
        """Unhappy path: falla si customer FK apunta a un id inexistente."""
        data = self.valid_write_data.copy()
        data['customer'] = 99999
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_write_serializer_fails_with_nonexistent_origin_warehouse_fk(self):
        """Unhappy path: falla si origin_warehouse FK apunta a un id inexistente."""
        data = self.valid_write_data.copy()
        data['origin_warehouse'] = 99999
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)


class ShipmentProductSerializerTest(SerializerSetUpMixin, TestCase):
    """Tests para ShipmentProductSerializer."""

    def setUp(self):
        super().setUp()
        self.sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('1850000.00'),
        )

    def test_shipment_product_serializer_contains_expected_fields(self):
        """ShipmentProductSerializer contiene todos los campos esperados."""
        serializer = ShipmentProductSerializer(self.sp)
        data = serializer.data
        expected_fields = ['id', 'product', 'quantity', 'unit_price', 'line_total', 'notes']
        for field in expected_fields:
            self.assertIn(field, data, f'Campo {field} no encontrado en ShipmentProductSerializer')

    def test_shipment_product_serializer_product_is_summary(self):
        """El campo product es un resumen con id, sku y name."""
        serializer = ShipmentProductSerializer(self.sp)
        product_data = serializer.data['product']
        self.assertIn('id', product_data)
        self.assertIn('sku', product_data)
        self.assertIn('name', product_data)

    def test_shipment_product_serializer_line_total_correct(self):
        """line_total serializado es correcto."""
        serializer = ShipmentProductSerializer(self.sp)
        self.assertEqual(Decimal(serializer.data['line_total']), Decimal('3700000.00'))


class ShipmentProductWriteSerializerTest(SerializerSetUpMixin, TestCase):
    """Tests para ShipmentProductWriteSerializer."""

    def test_write_serializer_valid_with_required_fields(self):
        """Happy path: es válido con product, quantity y unit_price."""
        data = {
            'product': self.product.id,
            'quantity': 3,
            'unit_price': '1850000.00',
        }
        serializer = ShipmentProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_fails_without_product(self):
        """Unhappy path: falla sin product."""
        data = {
            'quantity': 2,
            'unit_price': '1850000.00',
        }
        serializer = ShipmentProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_write_serializer_fails_without_quantity(self):
        """Unhappy path: falla sin quantity."""
        data = {
            'product': self.product.id,
            'unit_price': '1850000.00',
        }
        serializer = ShipmentProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_write_serializer_fails_without_unit_price(self):
        """Unhappy path: falla sin unit_price."""
        data = {
            'product': self.product.id,
            'quantity': 1,
        }
        serializer = ShipmentProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_write_serializer_notes_optional(self):
        """El campo notes es opcional en ShipmentProductWriteSerializer."""
        data = {
            'product': self.product.id,
            'quantity': 1,
            'unit_price': '500000.00',
            'notes': 'Embalaje especial requerido',
        }
        serializer = ShipmentProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
