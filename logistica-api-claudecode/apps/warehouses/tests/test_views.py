"""Tests de integración para el ViewSet de Warehouse."""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.warehouses.models import Warehouse

WAREHOUSES_LIST_URL = '/api/v1/warehouses/'


def warehouse_detail_url(warehouse_id):
    return f'/api/v1/warehouses/{warehouse_id}/'


def make_warehouse_data(**kwargs):
    """Retorna un dict con datos realistas de almacén, sobrescribible por kwargs."""
    defaults = {
        'name': 'Bodega Bogotá Norte',
        'code': 'BOG-01',
        'address': 'Calle 13 No. 45-67, Bogotá',
        'city': 'Bogotá',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return defaults


class WarehouseViewSetAuthTest(APITestCase):
    """Tests de autenticación requerida."""

    def test_list_requires_authentication(self):
        """GET /api/v1/warehouses/ sin autenticación devuelve 401."""
        client = APIClient()
        response = client.get(WAREHOUSES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WarehouseViewSetCRUDTest(APITestCase):
    """Tests de operaciones CRUD para el ViewSet de Warehouse."""

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.manager_user = User.objects.create_user(
            username='manager1',
            password='pass123',
            first_name='Carlos',
            last_name='Pérez',
        )
        self.client.force_authenticate(user=self.user)

        # Almacén base para tests que lo necesiten
        self.warehouse = Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
            country='Colombia',
        )

    # ------------------------------------------------------------------ #
    # GET list                                                             #
    # ------------------------------------------------------------------ #

    def test_list_returns_200_with_paginated_structure(self):
        """GET /api/v1/warehouses/ devuelve 200 con estructura paginada."""
        response = self.client.get(WAREHOUSES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_contains_created_warehouse(self):
        """El listado incluye el almacén creado en setUp."""
        response = self.client.get(WAREHOUSES_LIST_URL)
        codes = [w['code'] for w in response.data['results']]
        self.assertIn('BOG-01', codes)

    # ------------------------------------------------------------------ #
    # POST create                                                          #
    # ------------------------------------------------------------------ #

    def test_create_without_manager_returns_201_with_id(self):
        """POST con datos válidos sin manager devuelve 201 e incluye id."""
        data = make_warehouse_data(code='MED-01', name='Bodega Medellín Central',
                                   city='Medellín', address='Calle 50 No. 40-25, Medellín')
        response = self.client.post(WAREHOUSES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['code'], 'MED-01')

    def test_create_with_manager_returns_201_and_manager_visible(self):
        """POST con manager asignado devuelve 201 y manager visible en respuesta."""
        data = make_warehouse_data(
            code='CAL-01',
            name='Bodega Cali Sur',
            city='Cali',
            address='Av. Pasoancho No. 12-34, Cali',
            manager=self.manager_user.pk,
        )
        response = self.client.post(WAREHOUSES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        # La respuesta detail muestra el manager expandido
        self.assertIsNotNone(response.data.get('manager'))
        self.assertEqual(response.data['manager']['username'], 'manager1')

    def test_create_without_required_fields_returns_400(self):
        """POST sin campos requeridos (name, code, city, address) devuelve 400."""
        response = self.client.post(WAREHOUSES_LIST_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ('name', 'code', 'address', 'city'):
            self.assertIn(field, response.data)

    def test_create_with_duplicate_code_returns_400(self):
        """POST con code duplicado devuelve 400."""
        data = make_warehouse_data(code='BOG-01', name='Duplicada Bogotá',
                                   city='Bogotá', address='Otra dirección, Bogotá')
        response = self.client.post(WAREHOUSES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', response.data)

    # ------------------------------------------------------------------ #
    # GET retrieve                                                         #
    # ------------------------------------------------------------------ #

    def test_retrieve_returns_200(self):
        """GET /api/v1/warehouses/{id}/ devuelve 200 con detalle del almacén."""
        url = warehouse_detail_url(self.warehouse.pk)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'BOG-01')

    def test_retrieve_nonexistent_returns_404(self):
        """GET de un id inexistente devuelve 404."""
        url = warehouse_detail_url(99999)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------ #
    # PUT update                                                           #
    # ------------------------------------------------------------------ #

    def test_put_returns_200(self):
        """PUT actualiza todos los campos y devuelve 200."""
        url = warehouse_detail_url(self.warehouse.pk)
        data = make_warehouse_data(
            code='BOG-01',
            name='Bodega Bogotá Norte Actualizada',
            city='Bogotá',
            address='Carrera 30 No. 10-20, Bogotá',
        )
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Bodega Bogotá Norte Actualizada')

    # ------------------------------------------------------------------ #
    # PATCH partial update                                                 #
    # ------------------------------------------------------------------ #

    def test_patch_single_field_returns_200(self):
        """PATCH actualiza un solo campo y devuelve 200."""
        url = warehouse_detail_url(self.warehouse.pk)
        response = self.client.patch(url, {'city': 'Bogotá DC'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'Bogotá DC')

    # ------------------------------------------------------------------ #
    # DELETE                                                               #
    # ------------------------------------------------------------------ #

    def test_delete_returns_204_and_removes_from_db(self):
        """DELETE devuelve 204 y el objeto deja de existir en la BD."""
        url = warehouse_detail_url(self.warehouse.pk)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Warehouse.objects.filter(pk=self.warehouse.pk).exists())


class WarehouseViewSetFilterTest(APITestCase):
    """Tests de filtros, búsqueda y ordenamiento."""

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.user)

        Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
            is_active=True,
        )
        Warehouse.objects.create(
            name='Bodega Medellín Central',
            code='MED-01',
            address='Calle 50 No. 40-25, Medellín',
            city='Medellín',
            is_active=True,
        )
        Warehouse.objects.create(
            name='Almacén Cali Sur Inactivo',
            code='CAL-01',
            address='Av. Pasoancho No. 12-34, Cali',
            city='Cali',
            is_active=False,
        )

    # ------------------------------------------------------------------ #
    # Filtros de campo                                                     #
    # ------------------------------------------------------------------ #

    def test_filter_by_city(self):
        """?city=Bogotá devuelve solo almacenes de Bogotá."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'city': 'Bogotá'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['city'], 'Bogotá')

    def test_filter_by_is_active_true(self):
        """?is_active=true devuelve solo almacenes activos."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertTrue(r['is_active'])

    def test_filter_by_is_active_false(self):
        """?is_active=false devuelve solo almacenes inactivos."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]['is_active'])

    # ------------------------------------------------------------------ #
    # Búsqueda de texto                                                    #
    # ------------------------------------------------------------------ #

    def test_search_by_name(self):
        """?search=Medellín devuelve almacenes cuyo name contiene 'Medellín'."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'search': 'Medellín'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertIn('Medellín', results[0]['name'])

    def test_search_by_code(self):
        """?search=CAL devuelve almacenes cuyo code comienza con 'CAL'."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'search': 'CAL'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['code'], 'CAL-01')

    def test_search_no_matches_returns_empty_list(self):
        """?search=INEXISTENTE devuelve lista vacía."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'search': 'INEXISTENTE-XYZ'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # ------------------------------------------------------------------ #
    # Ordenamiento                                                         #
    # ------------------------------------------------------------------ #

    def test_ordering_by_name_ascending(self):
        """?ordering=name devuelve resultados ordenados por name ascendente."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_created_at_descending(self):
        """?ordering=-created_at devuelve resultados con el más reciente primero."""
        response = self.client.get(WAREHOUSES_LIST_URL, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que la respuesta es 200 y tiene resultados
        self.assertGreater(len(response.data['results']), 0)
