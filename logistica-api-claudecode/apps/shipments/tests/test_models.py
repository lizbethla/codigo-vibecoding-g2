"""
Tests de modelos para el módulo shipments.
Cubre Shipment y ShipmentProduct: campos, lógica de save(), constraints y relaciones.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import (
    Shipment,
    ShipmentPriority,
    ShipmentProduct,
    ShipmentStatus,
)
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ShipmentModelSetUpMixin:
    """Mixin con setUp compartido para tests de Shipment."""

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
        self.base_data = {
            'customer': self.customer,
            'origin_warehouse': self.warehouse,
            'origin_address': 'Calle 13 No. 45-67, Bogotá',
            'destination_address': 'Carrera 80 No. 12-34, Medellín',
            'destination_city': 'Medellín',
            'destination_country': 'Colombia',
            'recipient_name': 'Carlos Rodríguez',
            'scheduled_date': '2026-06-15',
        }


class ShipmentModelCreationTest(ShipmentModelSetUpMixin, TestCase):
    """Tests de creación válida del modelo Shipment."""

    def test_shipment_creation_with_required_fields(self):
        """Happy path: crear un envío con los campos mínimos requeridos."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNotNone(shipment.pk)
        self.assertEqual(shipment.customer, self.customer)
        self.assertEqual(shipment.origin_warehouse, self.warehouse)
        self.assertEqual(shipment.recipient_name, 'Carlos Rodríguez')

    def test_tracking_code_auto_generated_on_save(self):
        """Happy path: tracking_code se genera automáticamente con prefijo LOG-."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertTrue(shipment.tracking_code.startswith('LOG-'))

    def test_tracking_code_format_includes_year(self):
        """El tracking_code generado incluye el año actual en su formato."""
        from datetime import datetime
        shipment = Shipment.objects.create(**self.base_data)
        current_year = str(datetime.now().year)
        self.assertIn(current_year, shipment.tracking_code)

    def test_tracking_code_unique_across_two_shipments(self):
        """Edge case: dos envíos distintos generan tracking_codes distintos."""
        shipment1 = Shipment.objects.create(**self.base_data)
        data2 = self.base_data.copy()
        data2['recipient_name'] = 'Ana Martínez'
        data2['destination_city'] = 'Cali'
        shipment2 = Shipment.objects.create(**data2)
        self.assertNotEqual(shipment1.tracking_code, shipment2.tracking_code)

    def test_tracking_code_not_regenerated_if_already_set(self):
        """Edge case: save() no sobreescribe tracking_code si ya tiene valor."""
        shipment = Shipment.objects.create(**self.base_data)
        original_code = shipment.tracking_code
        shipment.recipient_name = 'Pedro Gómez'
        shipment.save()
        shipment.refresh_from_db()
        self.assertEqual(shipment.tracking_code, original_code)

    def test_default_status_is_pending(self):
        """El status por defecto es PENDING."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertEqual(shipment.status, ShipmentStatus.PENDING)

    def test_default_priority_is_normal(self):
        """La prioridad por defecto es NORMAL."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertEqual(shipment.priority, ShipmentPriority.NORMAL)

    def test_default_total_weight_is_zero(self):
        """El peso total por defecto es 0."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertEqual(shipment.total_weight_kg, Decimal('0'))

    def test_default_base_cost_is_zero(self):
        """El costo base por defecto es 0."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertEqual(shipment.base_cost, Decimal('0'))

    def test_default_total_cost_is_zero(self):
        """El costo total por defecto es 0."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertEqual(shipment.total_cost, Decimal('0'))


class ShipmentModelUniqueConstraintTest(ShipmentModelSetUpMixin, TestCase):
    """Tests de restricciones únicas del modelo Shipment."""

    def test_tracking_code_unique_constraint(self):
        """Unhappy path: IntegrityError si se intenta crear dos shipments con el mismo tracking_code."""
        Shipment.objects.create(**self.base_data)
        data2 = self.base_data.copy()
        data2['tracking_code'] = Shipment.objects.first().tracking_code
        data2['recipient_name'] = 'Otro Receptor'
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(**data2)


class ShipmentModelNullableFieldsTest(ShipmentModelSetUpMixin, TestCase):
    """Tests de campos nullable en Shipment."""

    def test_route_nullable(self):
        """El campo route acepta None."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNone(shipment.route)

    def test_vehicle_nullable(self):
        """El campo vehicle acepta None."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNone(shipment.vehicle)

    def test_estimated_delivery_nullable(self):
        """El campo estimated_delivery acepta None."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNone(shipment.estimated_delivery)

    def test_actual_delivery_nullable(self):
        """El campo actual_delivery acepta None."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNone(shipment.actual_delivery)

    def test_notes_nullable(self):
        """El campo notes acepta None."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNone(shipment.notes)


class ShipmentModelMetaTest(ShipmentModelSetUpMixin, TestCase):
    """Tests de comportamiento de Meta en Shipment."""

    def test_ordering_by_created_at_desc(self):
        """Meta.ordering=['-created_at'] se respeta al consultar múltiples envíos."""
        s1 = Shipment.objects.create(**self.base_data)
        data2 = self.base_data.copy()
        data2['recipient_name'] = 'María López'
        data2['destination_city'] = 'Barranquilla'
        s2 = Shipment.objects.create(**data2)
        shipments = list(Shipment.objects.all())
        self.assertEqual(shipments[0].pk, s2.pk)
        self.assertEqual(shipments[1].pk, s1.pk)

    def test_timestamps_auto_assigned(self):
        """created_at y updated_at se asignan automáticamente."""
        shipment = Shipment.objects.create(**self.base_data)
        self.assertIsNotNone(shipment.created_at)
        self.assertIsNotNone(shipment.updated_at)


class ShipmentChoicesTest(ShipmentModelSetUpMixin, TestCase):
    """Tests de validez de choices para ShipmentStatus y ShipmentPriority."""

    def test_all_status_choices_valid(self):
        """Todos los valores de ShipmentStatus son válidos."""
        valid_statuses = [
            'PENDING', 'CONFIRMED', 'IN_WAREHOUSE', 'IN_TRANSIT',
            'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED', 'RETURNED',
        ]
        choice_values = [c[0] for c in ShipmentStatus.choices]
        for status in valid_statuses:
            self.assertIn(status, choice_values, f'Status {status} no encontrado en choices')

    def test_all_priority_choices_valid(self):
        """Todos los valores de ShipmentPriority son válidos."""
        valid_priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
        choice_values = [c[0] for c in ShipmentPriority.choices]
        for priority in valid_priorities:
            self.assertIn(priority, choice_values, f'Priority {priority} no encontrado en choices')

    def test_create_shipment_with_each_status(self):
        """Se puede crear un envío con cada valor de ShipmentStatus."""
        for i, status_value in enumerate(ShipmentStatus.values):
            data = self.base_data.copy()
            data['status'] = status_value
            data['recipient_name'] = f'Receptor {i}'
            data['destination_city'] = f'Ciudad {i}'
            shipment = Shipment.objects.create(**data)
            self.assertEqual(shipment.status, status_value)

    def test_create_shipment_with_each_priority(self):
        """Se puede crear un envío con cada valor de ShipmentPriority."""
        for i, priority_value in enumerate(ShipmentPriority.values):
            data = self.base_data.copy()
            data['priority'] = priority_value
            data['recipient_name'] = f'Receptor Prioridad {i}'
            data['destination_city'] = f'Ciudad Prio {i}'
            shipment = Shipment.objects.create(**data)
            self.assertEqual(shipment.priority, priority_value)


class ShipmentStrTest(ShipmentModelSetUpMixin, TestCase):
    """Tests del método __str__ de Shipment."""

    def test_str_includes_tracking_code_and_status(self):
        """__str__ incluye tracking_code y el display del status."""
        shipment = Shipment.objects.create(**self.base_data)
        result = str(shipment)
        self.assertIn(shipment.tracking_code, result)
        self.assertIn('Pendiente', result)


# ---------------------------------------------------------------------------
# ShipmentProduct tests
# ---------------------------------------------------------------------------

class ShipmentProductSetUpMixin(ShipmentModelSetUpMixin):
    """Mixin que añade un Shipment al setUp de ShipmentProduct."""

    def setUp(self):
        super().setUp()
        self.shipment = Shipment.objects.create(**self.base_data)


class ShipmentProductCreationTest(ShipmentProductSetUpMixin, TestCase):
    """Tests de creación válida del modelo ShipmentProduct."""

    def test_shipment_product_creation_happy_path(self):
        """Happy path: crear un ShipmentProduct con shipment, product, quantity y unit_price."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
            unit_price=Decimal('1850000.00'),
        )
        self.assertIsNotNone(sp.pk)
        self.assertEqual(sp.shipment, self.shipment)
        self.assertEqual(sp.product, self.product)
        self.assertEqual(sp.quantity, 3)

    def test_line_total_calculated_on_save(self):
        """Happy path: line_total se calcula automáticamente = quantity * unit_price."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('1500000.00'),
        )
        self.assertEqual(sp.line_total, Decimal('3000000.00'))

    def test_line_total_recalculated_on_update_quantity(self):
        """Happy path: line_total se recalcula al actualizar quantity."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price=Decimal('1000000.00'),
        )
        self.assertEqual(sp.line_total, Decimal('1000000.00'))
        sp.quantity = 5
        sp.save()
        sp.refresh_from_db()
        self.assertEqual(sp.line_total, Decimal('5000000.00'))

    def test_line_total_recalculated_on_update_unit_price(self):
        """Happy path: line_total se recalcula al actualizar unit_price."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('500000.00'),
        )
        sp.unit_price = Decimal('750000.00')
        sp.save()
        sp.refresh_from_db()
        self.assertEqual(sp.line_total, Decimal('1500000.00'))

    def test_notes_nullable(self):
        """El campo notes acepta None."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price=Decimal('100000.00'),
        )
        self.assertIsNone(sp.notes)


class ShipmentProductConstraintTest(ShipmentProductSetUpMixin, TestCase):
    """Tests de restricciones de ShipmentProduct."""

    def test_unique_together_shipment_product(self):
        """Unhappy path: unique_together impide duplicar el mismo product en el mismo shipment."""
        ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price=Decimal('1850000.00'),
        )
        with self.assertRaises(IntegrityError):
            ShipmentProduct.objects.create(
                shipment=self.shipment,
                product=self.product,
                quantity=2,
                unit_price=Decimal('1850000.00'),
            )

    def test_cascade_delete_removes_shipment_products(self):
        """CASCADE: al eliminar el shipment, sus ShipmentProducts también se eliminan."""
        ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price=Decimal('1850000.00'),
        )
        shipment_pk = self.shipment.pk
        self.shipment.delete()
        remaining = ShipmentProduct.objects.filter(shipment_id=shipment_pk)
        self.assertEqual(remaining.count(), 0)

    def test_str_includes_product_name_and_quantity(self):
        """__str__ incluye nombre del producto y la cantidad."""
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=4,
            unit_price=Decimal('1850000.00'),
        )
        result = str(sp)
        self.assertIn('Laptop ThinkPad X1 Carbon', result)
        self.assertIn('4', result)
