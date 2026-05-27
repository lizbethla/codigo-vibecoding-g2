"""Tests para los ViewSets del módulo transport (Vehicle)."""
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.drivers.models import Driver
from apps.transport.models import Vehicle, VehicleType, FuelType, VehicleStatus

BASE_URL = '/api/v1/vehicles/'


def make_driver(username='conductor1', license_number='COL-B-123456', national_id='79854321'):
    """Crea un usuario y un perfil Driver para usar en tests."""
    user = User.objects.create_user(
        username=username,
        first_name='Carlos',
        last_name='Pérez',
        password='pass123',
    )
    driver = Driver.objects.create(
        user=user,
        license_number=license_number,
        license_type='B',
        license_expiry='2027-12-31',
        phone='3001234567',
        national_id=national_id,
    )
    return driver


def make_vehicle(**kwargs):
    """Crea un Vehicle con valores por defecto sobreescribibles."""
    defaults = {
        'plate': 'ABC-123',
        'vehicle_type': VehicleType.VAN,
        'brand': 'Chevrolet',
        'model': 'NHR',
        'year': 2022,
        'capacity_kg': '1500.00',
    }
    defaults.update(kwargs)
    return Vehicle.objects.create(**defaults)


VALID_POST_DATA = {
    'plate': 'SRL-456',
    'vehicle_type': 'VAN',
    'brand': 'Chevrolet',
    'model': 'NHR',
    'year': 2022,
    'capacity_kg': '1500.00',
    'fuel_type': 'DIESEL',
    'status': 'AVAILABLE',
}


class VehicleListTest(APITestCase):
    """Tests para GET /api/v1/vehicles/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)

    def test_list_returns_200(self):
        """GET /api/v1/vehicles/ retorna 200."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_structure(self):
        """GET /api/v1/vehicles/ retorna estructura paginada."""
        response = self.client.get(BASE_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_list_includes_created_vehicle(self):
        """Los vehículos creados aparecen en el listado."""
        make_vehicle()
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_unauthenticated_returns_401(self):
        """GET sin autenticación retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class VehicleCreateTest(APITestCase):
    """Tests para POST /api/v1/vehicles/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = User.objects.create_user(
            username='conductor1',
            first_name='Carlos',
            last_name='Pérez',
            password='pass123',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='COL-B-123456',
            license_type='B',
            license_expiry='2027-12-31',
            phone='3001234567',
            national_id='79854321',
        )

    def test_post_valid_without_driver_returns_201(self):
        """POST con datos válidos sin driver retorna 201."""
        response = self.client.post(BASE_URL, VALID_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_post_response_includes_id(self):
        """La respuesta 201 de POST incluye el campo id."""
        response = self.client.post(BASE_URL, VALID_POST_DATA, format='json')
        self.assertIn('id', response.data)

    def test_post_with_driver_returns_201(self):
        """POST con driver asignado retorna 201."""
        data = dict(VALID_POST_DATA, plate='DRV-789', driver=self.driver.pk)
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_post_with_driver_response_has_driver_data(self):
        """La respuesta 201 con driver incluye driver expandido."""
        data = dict(VALID_POST_DATA, plate='DRV-790', driver=self.driver.pk)
        response = self.client.post(BASE_URL, data, format='json')
        self.assertIsNotNone(response.data.get('driver'))
        self.assertIn('license_number', response.data['driver'])

    def test_post_without_required_fields_returns_400(self):
        """POST sin campos requeridos retorna 400."""
        response = self.client.post(BASE_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_duplicate_plate_returns_400(self):
        """POST con placa duplicada retorna 400."""
        make_vehicle(plate='DUP-001')
        data = dict(VALID_POST_DATA, plate='DUP-001')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_invalid_vehicle_type_returns_400(self):
        """POST con vehicle_type inválido retorna 400."""
        data = dict(VALID_POST_DATA, plate='INV-001', vehicle_type='SPACESHIP')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VehicleRetrieveTest(APITestCase):
    """Tests para GET /api/v1/vehicles/{id}/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        self.vehicle = make_vehicle()

    def test_retrieve_returns_200(self):
        """GET /api/v1/vehicles/{id}/ retorna 200."""
        response = self.client.get(f'{BASE_URL}{self.vehicle.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        """GET retorna los datos del vehículo correcto."""
        response = self.client.get(f'{BASE_URL}{self.vehicle.pk}/')
        self.assertEqual(response.data['plate'], self.vehicle.plate)

    def test_retrieve_nonexistent_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get(f'{BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class VehicleUpdateTest(APITestCase):
    """Tests para PUT y PATCH en /api/v1/vehicles/{id}/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        self.vehicle = make_vehicle()

    def test_put_returns_200(self):
        """PUT retorna 200 con datos válidos."""
        data = {
            'plate': 'UPD-001',
            'vehicle_type': 'TRUCK',
            'brand': 'International',
            'model': '4400',
            'year': 2021,
            'capacity_kg': '8000.00',
            'fuel_type': 'DIESEL',
            'status': 'AVAILABLE',
        }
        response = self.client.put(f'{BASE_URL}{self.vehicle.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_status_returns_200(self):
        """PATCH del campo status retorna 200 con nuevo valor."""
        response = self.client.patch(
            f'{BASE_URL}{self.vehicle.pk}/',
            {'status': 'IN_USE'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_status_value_updated(self):
        """PATCH actualiza el campo status en BD."""
        self.client.patch(
            f'{BASE_URL}{self.vehicle.pk}/',
            {'status': 'MAINTENANCE'},
            format='json',
        )
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.status, VehicleStatus.MAINTENANCE)


class VehicleDeleteTest(APITestCase):
    """Tests para DELETE /api/v1/vehicles/{id}/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        self.vehicle = make_vehicle()

    def test_delete_returns_204(self):
        """DELETE retorna 204."""
        response = self.client.delete(f'{BASE_URL}{self.vehicle.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_db(self):
        """DELETE elimina el vehículo de la BD."""
        pk = self.vehicle.pk
        self.client.delete(f'{BASE_URL}{pk}/')
        self.assertFalse(Vehicle.objects.filter(pk=pk).exists())


class VehicleFilterTest(APITestCase):
    """Tests de filtros por campo en el listado de vehículos."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        make_vehicle(plate='VAN-001', vehicle_type=VehicleType.VAN, status=VehicleStatus.AVAILABLE, fuel_type=FuelType.DIESEL)
        make_vehicle(plate='TRK-001', vehicle_type=VehicleType.TRUCK, status=VehicleStatus.IN_USE, fuel_type=FuelType.GASOLINE)
        make_vehicle(plate='MTR-001', vehicle_type=VehicleType.MOTORCYCLE, status=VehicleStatus.MAINTENANCE, fuel_type=FuelType.ELECTRIC)

    def test_filter_by_vehicle_type(self):
        """Filtro ?vehicle_type= retorna solo los vehículos del tipo indicado."""
        response = self.client.get(BASE_URL, {'vehicle_type': 'VAN'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for vehicle in response.data['results']:
            self.assertEqual(vehicle['vehicle_type'], 'VAN')

    def test_filter_by_vehicle_type_excludes_others(self):
        """Filtro ?vehicle_type= excluye otros tipos."""
        response = self.client.get(BASE_URL, {'vehicle_type': 'VAN'})
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_status(self):
        """Filtro ?status= retorna solo los vehículos con ese status."""
        response = self.client.get(BASE_URL, {'status': 'IN_USE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_fuel_type(self):
        """Filtro ?fuel_type= retorna solo los vehículos con ese combustible."""
        response = self.client.get(BASE_URL, {'fuel_type': 'ELECTRIC'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)


class VehicleSearchTest(APITestCase):
    """Tests de búsqueda por texto en el listado de vehículos."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        make_vehicle(plate='CHV-001')
        make_vehicle(plate='CHV-002')
        make_vehicle(plate='XYZ-999')

    def test_search_by_plate_returns_matches(self):
        """Búsqueda ?search=CHV retorna solo las placas que coinciden."""
        response = self.client.get(BASE_URL, {'search': 'CHV'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_search_by_full_plate_returns_one(self):
        """Búsqueda por placa completa retorna exactamente uno."""
        response = self.client.get(BASE_URL, {'search': 'XYZ-999'})
        self.assertEqual(response.data['count'], 1)

    def test_search_no_match_returns_empty(self):
        """Búsqueda sin coincidencias retorna lista vacía."""
        response = self.client.get(BASE_URL, {'search': 'NONEXISTENT'})
        self.assertEqual(response.data['count'], 0)


class VehicleOrderingTest(APITestCase):
    """Tests de ordenamiento en el listado de vehículos."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.auth_user)
        make_vehicle(plate='ZZZ-001', year=2019, status=VehicleStatus.AVAILABLE)
        make_vehicle(plate='AAA-002', year=2023, status=VehicleStatus.IN_USE)
        make_vehicle(plate='MMM-003', year=2021, status=VehicleStatus.MAINTENANCE)

    def test_ordering_by_plate_asc(self):
        """?ordering=plate retorna 200."""
        response = self.client.get(BASE_URL, {'ordering': 'plate'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [v['plate'] for v in response.data['results']]
        self.assertEqual(plates, sorted(plates))

    def test_ordering_by_year_desc(self):
        """?ordering=-year retorna 200 con años descendentes."""
        response = self.client.get(BASE_URL, {'ordering': '-year'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        years = [v['year'] for v in response.data['results']]
        self.assertEqual(years, sorted(years, reverse=True))

    def test_ordering_by_status(self):
        """?ordering=status retorna 200."""
        response = self.client.get(BASE_URL, {'ordering': 'status'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
