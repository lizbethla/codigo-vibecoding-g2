"""
Tests de vistas para el módulo shipments.
Cubre ShipmentViewSet (CRUD, filtros, búsqueda, ordenamiento)
y ShipmentProductViewSet (endpoint anidado).
"""
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentProduct
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse

SHIPMENTS_URL = '/api/v1/shipments/'


def shipment_detail_url(shipment_id):
    return f'/api/v1/shipments/{shipment_id}/'


def shipment_products_url(shipment_id):
    return f'/api/v1/shipments/{shipment_id}/products/'


def shipment_product_detail_url(shipment_id, product_pk):
    return f'/api/v1/shipments/{shipment_id}/products/{product_pk}/'


class ViewsSetUpMixin:
    """Mixin con setUp completo para tests de vistas."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.user)

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
        self.shipment_data = {
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


class ShipmentViewSetListCreateTest(ViewsSetUpMixin, APITestCase):
    """Tests de GET list y POST create para ShipmentViewSet."""

    def test_list_returns_200_with_paginated_structure(self):
        """GET /api/v1/shipments/ retorna 200 con estructura paginada."""
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_create_valid_shipment_returns_201(self):
        """POST con datos válidos retorna 201."""
        response = self.client.post(SHIPMENTS_URL, self.shipment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_returns_id_in_response(self):
        """POST exitoso retorna el campo id en la respuesta."""
        response = self.client.post(SHIPMENTS_URL, self.shipment_data, format='json')
        self.assertIn('id', response.data)

    def test_create_returns_tracking_code_in_response(self):
        """POST exitoso retorna tracking_code generado automáticamente."""
        response = self.client.post(SHIPMENTS_URL, self.shipment_data, format='json')
        self.assertIn('tracking_code', response.data)
        self.assertTrue(response.data['tracking_code'].startswith('LOG-'))

    def test_create_shipment_persisted_in_db(self):
        """POST exitoso persiste el envío en la base de datos."""
        self.client.post(SHIPMENTS_URL, self.shipment_data, format='json')
        self.assertEqual(Shipment.objects.count(), 1)


class ShipmentViewSetRetrieveUpdateDeleteTest(ViewsSetUpMixin, APITestCase):
    """Tests de GET retrieve, PATCH y DELETE para ShipmentViewSet."""

    def setUp(self):
        super().setUp()
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

    def test_retrieve_returns_200_with_expanded_relations(self):
        """GET /api/v1/shipments/{id}/ retorna 200 con relaciones expandidas."""
        url = shipment_detail_url(self.shipment.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['customer'], dict)
        self.assertIsInstance(response.data['origin_warehouse'], dict)

    def test_patch_status_returns_200_with_new_status(self):
        """PATCH status retorna 200 con el nuevo status."""
        url = shipment_detail_url(self.shipment.id)
        response = self.client.patch(url, {'status': 'CONFIRMED'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'CONFIRMED')

    def test_delete_shipment_returns_204(self):
        """DELETE retorna 204 y elimina el envío."""
        url = shipment_detail_url(self.shipment.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Shipment.objects.filter(pk=self.shipment.id).exists())


class ShipmentViewSetAuthTest(ViewsSetUpMixin, APITestCase):
    """Tests de autenticación para ShipmentViewSet."""

    def test_list_without_auth_returns_401(self):
        """GET sin autenticación retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_nonexistent_shipment_returns_404(self):
        """GET de id inexistente retorna 404."""
        url = shipment_detail_url(99999)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ShipmentViewSetValidationTest(ViewsSetUpMixin, APITestCase):
    """Tests de validación de entrada para ShipmentViewSet."""

    def test_post_without_customer_returns_400(self):
        """POST sin customer retorna 400."""
        data = self.shipment_data.copy()
        del data['customer']
        response = self.client.post(SHIPMENTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer', response.data)

    def test_post_without_origin_warehouse_returns_400(self):
        """POST sin origin_warehouse retorna 400."""
        data = self.shipment_data.copy()
        del data['origin_warehouse']
        response = self.client.post(SHIPMENTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data)

    def test_post_with_nonexistent_customer_fk_returns_400(self):
        """POST con customer FK inexistente retorna 400."""
        data = self.shipment_data.copy()
        data['customer'] = 99999
        response = self.client.post(SHIPMENTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer', response.data)


class ShipmentViewSetFilterTest(ViewsSetUpMixin, APITestCase):
    """Tests de filtros para ShipmentViewSet."""

    def setUp(self):
        super().setUp()
        # Crear un segundo cliente para filtros por customer
        self.customer2 = Customer.objects.create(
            name='Distribuidora Caribe SAS',
            email='info@caribe.com',
            country='Colombia',
        )
        # Envío PENDING con NORMAL
        self.s1 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 1',
            destination_address='Calle 2',
            destination_city='Medellín',
            destination_country='Colombia',
            recipient_name='Ana García',
            scheduled_date='2026-06-15',
            status='PENDING',
            priority='NORMAL',
        )
        # Envío CONFIRMED con HIGH
        self.s2 = Shipment.objects.create(
            customer=self.customer2,
            origin_warehouse=self.warehouse,
            origin_address='Calle 3',
            destination_address='Calle 4',
            destination_city='Cali',
            destination_country='Colombia',
            recipient_name='Juan Pérez',
            scheduled_date='2026-07-01',
            status='CONFIRMED',
            priority='HIGH',
        )

    def test_filter_by_status_pending(self):
        """Filtro ?status=PENDING retorna solo envíos con status PENDING."""
        response = self.client.get(SHIPMENTS_URL, {'status': 'PENDING'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['status'] == 'PENDING' for r in results))

    def test_filter_by_status_confirmed(self):
        """Filtro ?status=CONFIRMED retorna solo envíos confirmados."""
        response = self.client.get(SHIPMENTS_URL, {'status': 'CONFIRMED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['status'] == 'CONFIRMED' for r in results))

    def test_filter_by_priority_high(self):
        """Filtro ?priority=HIGH retorna solo envíos con prioridad HIGH."""
        response = self.client.get(SHIPMENTS_URL, {'priority': 'HIGH'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['priority'], 'HIGH')

    def test_filter_by_customer_id(self):
        """Filtro ?customer={id} retorna solo envíos del cliente especificado."""
        response = self.client.get(SHIPMENTS_URL, {'customer': self.customer.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        # Todos los resultados deben pertenecer al customer filtrado
        for r in results:
            self.assertEqual(r['customer']['id'], self.customer.id)


class ShipmentViewSetSearchTest(ViewsSetUpMixin, APITestCase):
    """Tests de búsqueda de texto para ShipmentViewSet."""

    def setUp(self):
        super().setUp()
        self.s1 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 1',
            destination_address='Calle 2',
            destination_city='Medellín',
            destination_country='Colombia',
            recipient_name='Lucía Fernández',
            scheduled_date='2026-06-15',
        )
        # Forzar un tracking_code conocido
        self.s1.tracking_code = 'LOG-2026-ABCD1234'
        self.s1.save()

        self.s2 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 3',
            destination_address='Calle 4',
            destination_city='Barranquilla',
            destination_country='Colombia',
            recipient_name='Marco Antonio Rueda',
            scheduled_date='2026-07-10',
        )

    def test_search_by_tracking_code(self):
        """Búsqueda ?search=LOG-2026-ABCD1234 retorna el envío correcto."""
        response = self.client.get(SHIPMENTS_URL, {'search': 'LOG-2026-ABCD1234'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # El envío con ese tracking_code debe estar en los resultados
        tracking_codes = [r['tracking_code'] for r in response.data['results']]
        self.assertIn('LOG-2026-ABCD1234', tracking_codes)

    def test_search_by_recipient_name(self):
        """Búsqueda ?search=Marco retorna envíos que coincidan en recipient_name."""
        response = self.client.get(SHIPMENTS_URL, {'search': 'Marco'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)

    def test_search_no_results(self):
        """Búsqueda sin coincidencias retorna lista vacía."""
        response = self.client.get(SHIPMENTS_URL, {'search': 'XYZNOEXISTE999'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


class ShipmentViewSetOrderingTest(ViewsSetUpMixin, APITestCase):
    """Tests de ordenamiento para ShipmentViewSet."""

    def setUp(self):
        super().setUp()
        self.s1 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 1',
            destination_address='Calle 2',
            destination_city='Medellín',
            destination_country='Colombia',
            recipient_name='Receptor A',
            scheduled_date='2026-05-01',
        )
        self.s2 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Calle 3',
            destination_address='Calle 4',
            destination_city='Cali',
            destination_country='Colombia',
            recipient_name='Receptor B',
            scheduled_date='2026-08-01',
        )

    def test_ordering_by_scheduled_date_asc(self):
        """?ordering=scheduled_date retorna 200 con envíos ordenados."""
        response = self.client.get(SHIPMENTS_URL, {'ordering': 'scheduled_date'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        if len(results) >= 2:
            self.assertLessEqual(results[0]['scheduled_date'], results[-1]['scheduled_date'])

    def test_ordering_by_created_at_desc(self):
        """?ordering=-created_at retorna 200."""
        response = self.client.get(SHIPMENTS_URL, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)


# ---------------------------------------------------------------------------
# ShipmentProductViewSet tests (endpoint anidado)
# ---------------------------------------------------------------------------

class ShipmentProductViewSetSetUpMixin(ViewsSetUpMixin):
    """Mixin que añade un Shipment base para tests de ShipmentProductViewSet."""

    def setUp(self):
        super().setUp()
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
        self.product_data = {
            'product': self.product.id,
            'quantity': 2,
            'unit_price': '1850000.00',
        }


class ShipmentProductViewSetListCreateTest(ShipmentProductViewSetSetUpMixin, APITestCase):
    """Tests de GET list y POST create para ShipmentProductViewSet."""

    def test_list_products_returns_200(self):
        """GET /api/v1/shipments/{id}/products/ retorna 200."""
        url = shipment_products_url(self.shipment.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_product_returns_201(self):
        """POST producto válido retorna 201."""
        url = shipment_products_url(self.shipment.id)
        response = self.client.post(url, self.product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_product_returns_id(self):
        """POST exitoso retorna campo id en la respuesta."""
        url = shipment_products_url(self.shipment.id)
        response = self.client.post(url, self.product_data, format='json')
        self.assertIn('id', response.data)

    def test_create_product_line_total_auto_calculated(self):
        """POST exitoso: line_total se calcula automáticamente = quantity * unit_price."""
        url = shipment_products_url(self.shipment.id)
        response = self.client.post(url, self.product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expected_line_total = Decimal('2') * Decimal('1850000.00')
        self.assertEqual(Decimal(response.data['line_total']), expected_line_total)

    def test_create_product_without_auth_returns_401(self):
        """POST sin autenticación retorna 401."""
        self.client.force_authenticate(user=None)
        url = shipment_products_url(self.shipment.id)
        response = self.client.post(url, self.product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentProductViewSetRetrieveUpdateDeleteTest(ShipmentProductViewSetSetUpMixin, APITestCase):
    """Tests de GET retrieve, PATCH y DELETE para ShipmentProductViewSet."""

    def setUp(self):
        super().setUp()
        self.sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('1850000.00'),
        )

    def test_retrieve_product_returns_200(self):
        """GET /api/v1/shipments/{id}/products/{pk}/ retorna 200."""
        url = shipment_product_detail_url(self.shipment.id, self.sp.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.sp.id)

    def test_patch_quantity_returns_200_with_recalculated_line_total(self):
        """PATCH quantity retorna 200 y line_total queda recalculado."""
        url = shipment_product_detail_url(self.shipment.id, self.sp.id)
        response = self.client.patch(url, {'quantity': 5, 'unit_price': '1850000.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sp.refresh_from_db()
        self.assertEqual(self.sp.line_total, Decimal('5') * Decimal('1850000.00'))

    def test_delete_product_returns_204(self):
        """DELETE /api/v1/shipments/{id}/products/{pk}/ retorna 204."""
        url = shipment_product_detail_url(self.shipment.id, self.sp.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ShipmentProduct.objects.filter(pk=self.sp.id).exists())


class ShipmentProductViewSetValidationTest(ShipmentProductViewSetSetUpMixin, APITestCase):
    """Tests de validación para ShipmentProductViewSet."""

    def test_create_duplicate_product_in_same_shipment_returns_400(self):
        """POST con producto duplicado en el mismo envío debe retornar 400."""
        ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price=Decimal('1850000.00'),
        )
        url = shipment_products_url(self.shipment.id)
        response = self.client.post(url, self.product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_nonexistent_product_fk_returns_400(self):
        """POST con product FK inexistente retorna 400."""
        url = shipment_products_url(self.shipment.id)
        data = {
            'product': 99999,
            'quantity': 1,
            'unit_price': '1000000.00',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
