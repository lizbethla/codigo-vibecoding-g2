"""Tests de la API REST del módulo drivers — endpoints, filtros, búsqueda y autenticación."""

from datetime import date

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.drivers.models import Driver, DriverStatus, LicenseType


BASE_URL = '/api/v1/drivers/'


def make_user(username, first_name='Test', last_name='User', email=None):
    """Crea un User de Django con los datos dados."""
    return User.objects.create_user(
        username=username,
        password='secure_pass_123',
        first_name=first_name,
        last_name=last_name,
        email=email or f'{username}@example.com',
    )


def make_driver(user, license_number='COL-B-123456', national_id='79854321',
                license_type=LicenseType.B, status=DriverStatus.AVAILABLE):
    """Crea un Driver con datos realistas asociado al user dado."""
    return Driver.objects.create(
        user=user,
        license_number=license_number,
        license_type=license_type,
        license_expiry=date(2027, 12, 31),
        phone='3001234567',
        national_id=national_id,
        status=status,
    )


def valid_post_data(user_id, license_number='COL-B-888888', national_id='55566677'):
    """Retorna un payload válido para POST /api/v1/drivers/."""
    return {
        'user': user_id,
        'license_number': license_number,
        'license_type': 'B',
        'license_expiry': '2027-12-31',
        'phone': '3009876543',
        'national_id': national_id,
    }


class DriverListCreateTest(APITestCase):
    """Tests del endpoint GET y POST /api/v1/drivers/."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = make_user('tester', 'Admin', 'API')
        self.client.force_authenticate(user=self.auth_user)
        # Conductor existente en la base de datos
        self.driver_user = make_user('conductor_juan', 'Juan', 'Perez')
        self.driver = make_driver(self.driver_user)

    def test_list_returns_200(self):
        """GET /api/v1/drivers/ retorna HTTP 200."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_structure(self):
        """GET /api/v1/drivers/ retorna estructura paginada con count, next, previous, results."""
        response = self.client.get(BASE_URL)
        for key in ['count', 'next', 'previous', 'results']:
            self.assertIn(key, response.data)

    def test_list_contains_created_driver(self):
        """El conductor creado en setUp aparece en el listado."""
        response = self.client.get(BASE_URL)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver.pk, ids)

    def test_post_valid_data_returns_201(self):
        """POST con datos válidos retorna HTTP 201."""
        new_user = make_user('conductor_nuevo', 'Carlos', 'Ramirez')
        data = valid_post_data(new_user.pk)
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_post_response_includes_id(self):
        """La respuesta 201 incluye el campo id del conductor creado."""
        new_user = make_user('conductor_c', 'Carlos', 'Sierra')
        data = valid_post_data(new_user.pk, license_number='COL-B-111111', national_id='10000001')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertIn('id', response.data)

    def test_post_response_includes_user_expanded(self):
        """La respuesta 201 incluye el campo user expandido (DriverDetailSerializer)."""
        new_user = make_user('conductor_d', 'Diana', 'Lopez')
        data = valid_post_data(new_user.pk, license_number='COL-C-222222', national_id='20000002')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertIn('user', response.data)
        self.assertIsInstance(response.data['user'], dict)
        self.assertIn('username', response.data['user'])

    def test_post_missing_required_fields_returns_400(self):
        """POST sin campos requeridos retorna HTTP 400."""
        response = self.client.post(BASE_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_duplicate_license_number_returns_400(self):
        """POST con license_number duplicado retorna HTTP 400."""
        new_user = make_user('conductor_dup', 'Dup', 'User')
        data = valid_post_data(new_user.pk, license_number='COL-B-123456', national_id='99988877')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_duplicate_national_id_returns_400(self):
        """POST con national_id duplicado retorna HTTP 400."""
        new_user = make_user('conductor_dup2', 'Dup2', 'User')
        data = valid_post_data(new_user.pk, license_number='COL-B-UNIQUE1', national_id='79854321')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_user_already_linked_to_driver_returns_400(self):
        """POST con user que ya tiene un Driver vinculado retorna HTTP 400."""
        # self.driver_user ya está vinculado a self.driver
        data = valid_post_data(self.driver_user.pk, license_number='COL-CE-777777', national_id='77766655')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DriverRetrieveUpdateDeleteTest(APITestCase):
    """Tests de GET, PUT, PATCH y DELETE /api/v1/drivers/{id}/."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = make_user('tester', 'Admin', 'API')
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = make_user('conductor_juan', 'Juan', 'Perez')
        self.driver = make_driver(self.driver_user)
        self.detail_url = f'{BASE_URL}{self.driver.pk}/'

    def test_retrieve_returns_200(self):
        """GET /api/v1/drivers/{id}/ retorna HTTP 200."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_driver(self):
        """GET retorna los datos del conductor correcto."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.data['id'], self.driver.pk)
        self.assertEqual(response.data['license_number'], 'COL-B-123456')

    def test_retrieve_not_found_returns_404(self):
        """GET con id inexistente retorna HTTP 404."""
        response = self.client.get(f'{BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_returns_200(self):
        """PUT /api/v1/drivers/{id}/ con datos válidos retorna HTTP 200."""
        data = {
            'user': self.driver_user.pk,
            'license_number': 'COL-B-123456',
            'license_type': 'C',
            'license_expiry': '2028-06-30',
            'phone': '3119876543',
            'national_id': '79854321',
            'status': 'AVAILABLE',
        }
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_status_returns_200(self):
        """PATCH del campo status retorna HTTP 200 con el nuevo status."""
        response = self.client.patch(
            self.detail_url,
            {'status': 'ON_ROUTE'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, DriverStatus.ON_ROUTE)

    def test_delete_returns_204(self):
        """DELETE /api/v1/drivers/{id}/ retorna HTTP 204."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_db(self):
        """Tras DELETE, el conductor ya no existe en la base de datos."""
        pk = self.driver.pk
        self.client.delete(self.detail_url)
        self.assertFalse(Driver.objects.filter(pk=pk).exists())


class DriverAuthTest(APITestCase):
    """Tests de autenticación — requests sin credenciales deben retornar 401."""

    def setUp(self):
        self.client = APIClient()
        # Sin force_authenticate — cliente no autenticado

    def test_list_without_auth_returns_401(self):
        """GET /api/v1/drivers/ sin autenticación retorna HTTP 401."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_without_auth_returns_401(self):
        """POST /api/v1/drivers/ sin autenticación retorna HTTP 401."""
        response = self.client.post(BASE_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detail_without_auth_returns_401(self):
        """GET /api/v1/drivers/1/ sin autenticación retorna HTTP 401."""
        response = self.client.get(f'{BASE_URL}1/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverFilterTest(APITestCase):
    """Tests de filtros de campo por status y license_type."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = make_user('tester_filter', 'Admin', 'Filter')
        self.client.force_authenticate(user=self.auth_user)

        # Conductor disponible con licencia B
        user_available = make_user('cond_available', 'Ana', 'Gomez')
        self.driver_available = make_driver(
            user_available,
            license_number='COL-B-001001',
            national_id='10100100',
            license_type=LicenseType.B,
            status=DriverStatus.AVAILABLE,
        )

        # Conductor en ruta con licencia C
        user_on_route = make_user('cond_on_route', 'Luis', 'Herrera')
        self.driver_on_route = make_driver(
            user_on_route,
            license_number='COL-C-002002',
            national_id='20200200',
            license_type=LicenseType.C,
            status=DriverStatus.ON_ROUTE,
        )

        # Conductor suspendido con licencia CE
        user_suspended = make_user('cond_suspended', 'Pedro', 'Mora')
        self.driver_suspended = make_driver(
            user_suspended,
            license_number='COL-CE-003003',
            national_id='30300300',
            license_type=LicenseType.CE,
            status=DriverStatus.SUSPENDED,
        )

    def test_filter_by_status_available(self):
        """?status=AVAILABLE retorna solo conductores con ese status."""
        response = self.client.get(BASE_URL, {'status': 'AVAILABLE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_available.pk, result_ids)
        self.assertNotIn(self.driver_on_route.pk, result_ids)
        self.assertNotIn(self.driver_suspended.pk, result_ids)

    def test_filter_by_status_on_route(self):
        """?status=ON_ROUTE retorna solo conductores en ruta."""
        response = self.client.get(BASE_URL, {'status': 'ON_ROUTE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_on_route.pk, result_ids)
        self.assertNotIn(self.driver_available.pk, result_ids)

    def test_filter_by_license_type_b(self):
        """?license_type=B retorna solo conductores con licencia tipo B."""
        response = self.client.get(BASE_URL, {'license_type': 'B'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_available.pk, result_ids)
        self.assertNotIn(self.driver_on_route.pk, result_ids)

    def test_filter_by_license_type_ce(self):
        """?license_type=CE retorna solo conductores con licencia tipo CE."""
        response = self.client.get(BASE_URL, {'license_type': 'CE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_suspended.pk, result_ids)
        self.assertNotIn(self.driver_available.pk, result_ids)


class DriverSearchTest(APITestCase):
    """Tests de búsqueda de texto libre por national_id y license_number."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = make_user('tester_search', 'Admin', 'Search')
        self.client.force_authenticate(user=self.auth_user)

        user_a = make_user('cond_search_a', 'Beatriz', 'Castro')
        self.driver_a = make_driver(
            user_a,
            license_number='COL-B-SRCH01',
            national_id='88811100',
        )

        user_b = make_user('cond_search_b', 'Roberto', 'Vega')
        self.driver_b = make_driver(
            user_b,
            license_number='COL-C-SRCH02',
            national_id='99922233',
        )

    def test_search_by_national_id_returns_match(self):
        """?search=<national_id> retorna el conductor con ese national_id."""
        response = self.client.get(BASE_URL, {'search': '88811100'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_a.pk, result_ids)
        self.assertNotIn(self.driver_b.pk, result_ids)

    def test_search_by_license_number_returns_match(self):
        """?search=<license_number> retorna el conductor con esa licencia."""
        response = self.client.get(BASE_URL, {'search': 'COL-C-SRCH02'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_b.pk, result_ids)
        self.assertNotIn(self.driver_a.pk, result_ids)

    def test_search_partial_national_id(self):
        """?search= con parte del national_id retorna coincidencias."""
        response = self.client.get(BASE_URL, {'search': '888'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver_a.pk, result_ids)

    def test_search_no_match_returns_empty(self):
        """?search= con texto sin coincidencias retorna lista vacía."""
        response = self.client.get(BASE_URL, {'search': 'ZZZNOMATCH'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


class DriverOrderingTest(APITestCase):
    """Tests de ordenamiento por campos configurados en ordering_fields."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = make_user('tester_ord', 'Admin', 'Ordering')
        self.client.force_authenticate(user=self.auth_user)

        user_x = make_user('cond_ord_x', 'Xavier', 'Nuñez')
        self.driver_available = make_driver(
            user_x,
            license_number='COL-B-ORD001',
            national_id='41000001',
            status=DriverStatus.AVAILABLE,
        )

        user_y = make_user('cond_ord_y', 'Yolanda', 'Pinto')
        self.driver_suspended = make_driver(
            user_y,
            license_number='COL-C-ORD002',
            national_id='41000002',
            status=DriverStatus.SUSPENDED,
        )

    def test_ordering_by_status_returns_200(self):
        """?ordering=status retorna HTTP 200."""
        response = self.client.get(BASE_URL, {'ordering': 'status'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering_by_license_expiry_returns_200(self):
        """?ordering=license_expiry retorna HTTP 200."""
        response = self.client.get(BASE_URL, {'ordering': 'license_expiry'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering_by_status_desc_returns_200(self):
        """?ordering=-status retorna HTTP 200 (orden descendente)."""
        response = self.client.get(BASE_URL, {'ordering': '-status'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering_by_status_alphabetical(self):
        """?ordering=status ordena los conductores alfabéticamente por status."""
        response = self.client.get(BASE_URL, {'ordering': 'status'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [item['status'] for item in response.data['results']]
        self.assertEqual(statuses, sorted(statuses))
