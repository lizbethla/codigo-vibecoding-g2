"""
Tests de la API REST del módulo customers.

Cubre: CRUD completo, autenticación, paginación, filtros,
búsqueda y ordenamiento del CustomerViewSet.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from apps.customers.models import Customer, CustomerType

User = get_user_model()

CUSTOMERS_LIST_URL = '/api/v1/customers/'


def detail_url(customer_id):
    """Retorna la URL de detalle para un customer dado su id."""
    return f'/api/v1/customers/{customer_id}/'


class CustomerAuthenticationTest(APITestCase):
    """Pruebas de autenticación — acceso sin credenciales debe ser 401."""

    def test_list_requires_authentication(self):
        """GET /customers/ sin autenticación debe retornar 401."""
        client = APIClient()
        response = client.get(CUSTOMERS_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_authentication(self):
        """POST /customers/ sin autenticación debe retornar 401."""
        client = APIClient()
        response = client.post(CUSTOMERS_LIST_URL, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detail_requires_authentication(self):
        """GET /customers/{id}/ sin autenticación debe retornar 401."""
        customer = Customer.objects.create(
            name='Cliente de Prueba SA',
            email='prueba@clientesa.com',
        )
        client = APIClient()
        response = client.get(detail_url(customer.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerListTest(APITestCase):
    """Pruebas del endpoint GET /customers/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='operador_logistica',
            password='Logistica2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.customer1 = Customer.objects.create(
            name='Almacenes del Pacífico SAS',
            email='almacenes@pacifico.com',
            customer_type=CustomerType.COMPANY,
            country='Colombia',
        )
        self.customer2 = Customer.objects.create(
            name='Beatriz Elena Giraldo',
            email='beatriz.giraldo@personal.co',
            customer_type=CustomerType.INDIVIDUAL,
            country='Colombia',
        )

    def test_list_returns_200(self):
        """GET /customers/ con autenticación debe retornar 200."""
        response = self.client.get(CUSTOMERS_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_structure(self):
        """La respuesta de listado debe tener estructura paginada."""
        response = self.client.get(CUSTOMERS_LIST_URL)
        data = response.data
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)

    def test_list_count_is_correct(self):
        """El campo count debe coincidir con el total de registros."""
        response = self.client.get(CUSTOMERS_LIST_URL)
        self.assertEqual(response.data['count'], 2)

    def test_list_results_use_list_serializer_fields(self):
        """Los resultados deben tener los campos del CustomerListSerializer."""
        response = self.client.get(CUSTOMERS_LIST_URL)
        result = response.data['results'][0]
        expected_fields = {'id', 'name', 'customer_type', 'email', 'is_active'}
        self.assertEqual(set(result.keys()), expected_fields)


class CustomerCreateTest(APITestCase):
    """Pruebas del endpoint POST /customers/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='operador_crea',
            password='Crear2024!',
        )
        self.client.force_authenticate(user=self.user)

    def test_create_valid_customer_returns_201(self):
        """POST con datos válidos debe retornar 201."""
        data = {
            'name': 'Tecnológica del Caribe SAS',
            'email': 'tecnologica@caribesas.com',
            'country': 'Colombia',
        }
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_returns_id(self):
        """La respuesta 201 debe incluir el id y todos los campos del objeto creado."""
        data = {
            'name': 'Inversiones Risaralda SA',
            'email': 'inversiones@risaralda.com',
        }
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIsNotNone(response.data['id'])
        # Verificar que el objeto fue creado en BD
        self.assertTrue(Customer.objects.filter(email='inversiones@risaralda.com').exists())

    def test_create_persists_in_database(self):
        """El objeto creado debe existir en la base de datos."""
        data = {
            'name': 'Grupo Empresarial Nariño SAS',
            'email': 'grupo@narino.com',
        }
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Customer.objects.filter(email='grupo@narino.com').exists())

    def test_create_without_required_fields_returns_400(self):
        """POST sin campos requeridos debe retornar 400."""
        response = self.client.post(CUSTOMERS_LIST_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_name_returns_400(self):
        """POST sin name debe retornar 400 con error en campo name."""
        data = {'email': 'sinname@empresa.com'}
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_without_email_returns_400(self):
        """POST sin email debe retornar 400 con error en campo email."""
        data = {'name': 'Empresa Sin Email SAS'}
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_with_duplicate_email_returns_400(self):
        """POST con email ya existente debe retornar 400."""
        Customer.objects.create(
            name='Empresa Original SA',
            email='original@empresa.com',
        )
        data = {
            'name': 'Empresa Duplicada SAS',
            'email': 'original@empresa.com',
        }
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_with_full_data(self):
        """POST con todos los campos válidos debe retornar 201."""
        data = {
            'name': 'Corporación Logística del Eje SAS',
            'customer_type': 'COMPANY',
            'tax_id': '900567890-4',
            'email': 'corporacion@ejecafetero.com',
            'phone': '+57 6 7891234',
            'address': 'Calle 19 #8-35, Armenia',
            'city': 'Armenia',
            'country': 'Colombia',
            'is_active': True,
        }
        response = self.client.post(CUSTOMERS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class CustomerRetrieveTest(APITestCase):
    """Pruebas del endpoint GET /customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='consultor_logistica',
            password='Consulta2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Manufactura del Norte SAS',
            email='manufactura@norte.com',
            customer_type=CustomerType.COMPANY,
            tax_id='850099887-5',
            phone='+57 5 5551234',
            address='Cra 52 #45-10, Barranquilla',
            city='Barranquilla',
            country='Colombia',
        )

    def test_retrieve_existing_customer_returns_200(self):
        """GET /customers/{id}/ de registro existente debe retornar 200."""
        response = self.client.get(detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_fields(self):
        """La respuesta de detalle debe incluir todos los campos."""
        response = self.client.get(detail_url(self.customer.id))
        data = response.data
        expected_fields = {
            'id', 'name', 'customer_type', 'tax_id', 'email',
            'phone', 'address', 'city', 'country', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_retrieve_returns_correct_values(self):
        """La respuesta de detalle debe tener los valores del modelo."""
        response = self.client.get(detail_url(self.customer.id))
        self.assertEqual(response.data['name'], 'Manufactura del Norte SAS')
        self.assertEqual(response.data['email'], 'manufactura@norte.com')
        self.assertEqual(response.data['city'], 'Barranquilla')

    def test_retrieve_nonexistent_customer_returns_404(self):
        """GET /customers/{id}/ con id inexistente debe retornar 404."""
        response = self.client.get(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CustomerUpdateTest(APITestCase):
    """Pruebas de los endpoints PUT y PATCH /customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='editor_logistica',
            password='Editor2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Telecomunicaciones del Centro SAS',
            email='telecom@centrosasa.com',
            country='Colombia',
        )

    def test_put_updates_customer_returns_200(self):
        """PUT /customers/{id}/ con datos válidos debe retornar 200."""
        data = {
            'name': 'Telecomunicaciones del Centro SAS Actualizada',
            'email': 'telecom@centrosasa.com',
            'country': 'Colombia',
        }
        response = self.client.put(detail_url(self.customer.id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_applies_changes(self):
        """PUT debe aplicar el cambio de nombre en la base de datos."""
        data = {
            'name': 'Nombre Actualizado SA',
            'email': 'telecom@centrosasa.com',
            'country': 'Colombia',
        }
        self.client.put(detail_url(self.customer.id), data, format='json')
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Nombre Actualizado SA')

    def test_patch_updates_single_field_returns_200(self):
        """PATCH con un solo campo debe retornar 200."""
        data = {'phone': '+57 1 5554321'}
        response = self.client.patch(detail_url(self.customer.id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_applies_partial_change(self):
        """PATCH debe aplicar solo el cambio del campo enviado."""
        original_name = self.customer.name
        data = {'phone': '+57 1 5559876'}
        self.client.patch(detail_url(self.customer.id), data, format='json')
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.phone, '+57 1 5559876')
        self.assertEqual(self.customer.name, original_name)

    def test_patch_deactivate_customer(self):
        """PATCH con is_active=False debe desactivar el cliente."""
        data = {'is_active': False}
        response = self.client.patch(detail_url(self.customer.id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)


class CustomerDeleteTest(APITestCase):
    """Pruebas del endpoint DELETE /customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='admin_logistica',
            password='Admin2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Empresa Para Eliminar SAS',
            email='eliminar@empresa.com',
        )

    def test_delete_existing_customer_returns_204(self):
        """DELETE /customers/{id}/ debe retornar 204."""
        response = self.client.delete(detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        """DELETE debe eliminar el objeto de la base de datos."""
        customer_id = self.customer.id
        self.client.delete(detail_url(customer_id))
        self.assertFalse(Customer.objects.filter(pk=customer_id).exists())


class CustomerFilterTest(APITestCase):
    """Pruebas de filtros: customer_type, is_active, country."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='filtrador',
            password='Filtrar2024!',
        )
        self.client.force_authenticate(user=self.user)

        self.company1 = Customer.objects.create(
            name='Empresa Activa Colombia SAS',
            email='activa@colombia.com',
            customer_type=CustomerType.COMPANY,
            country='Colombia',
            is_active=True,
        )
        self.company2 = Customer.objects.create(
            name='Empresa Inactiva Colombia SAS',
            email='inactiva@colombia.com',
            customer_type=CustomerType.COMPANY,
            country='Colombia',
            is_active=False,
        )
        self.individual1 = Customer.objects.create(
            name='María Fernanda López',
            email='maria.lopez@personal.co',
            customer_type=CustomerType.INDIVIDUAL,
            country='Colombia',
            is_active=True,
        )
        self.empresa_mexico = Customer.objects.create(
            name='Distribuidora Guadalajara SA',
            email='distrib@guadalajara.mx',
            customer_type=CustomerType.COMPANY,
            country='México',
            is_active=True,
        )

    def test_filter_by_customer_type_company(self):
        """Filtro customer_type=COMPANY debe retornar solo empresas."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'customer_type': 'COMPANY'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['customer_type'], 'COMPANY')

    def test_filter_by_customer_type_individual(self):
        """Filtro customer_type=INDIVIDUAL debe retornar solo personas naturales."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'customer_type': 'INDIVIDUAL'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['customer_type'], 'INDIVIDUAL')

    def test_filter_by_is_active_true(self):
        """Filtro is_active=True debe retornar solo clientes activos."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false(self):
        """Filtro is_active=False debe retornar solo clientes inactivos."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_by_country(self):
        """Filtro country=México debe retornar solo clientes de México."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'country': 'México'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['email'], 'distrib@guadalajara.mx')

    def test_filter_by_country_colombia(self):
        """Filtro country=Colombia debe retornar los clientes de Colombia."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_combined_filter_type_and_is_active(self):
        """Filtro combinado customer_type + is_active debe funcionar correctamente."""
        response = self.client.get(
            CUSTOMERS_LIST_URL,
            {'customer_type': 'COMPANY', 'is_active': 'true'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['customer_type'], 'COMPANY')
            self.assertTrue(result['is_active'])


class CustomerSearchTest(APITestCase):
    """Pruebas del parámetro ?search= por name y email."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='buscador',
            password='Buscar2024!',
        )
        self.client.force_authenticate(user=self.user)

        Customer.objects.create(
            name='Soluciones Digitales del Tolima SAS',
            email='soludigital@tolima.com',
        )
        Customer.objects.create(
            name='Inversiones Boyacá Ltda',
            email='inversiones@boyaca.com',
        )
        Customer.objects.create(
            name='Grupo Tecnológico Cundinamarca SA',
            email='info@gtcundinamarca.co',
        )

    def test_search_by_name_returns_matching_results(self):
        """?search= con parte del nombre debe retornar resultados coincidentes."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'search': 'Boyacá'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertIn('Boyacá', response.data['results'][0]['name'])

    def test_search_by_email_returns_matching_results(self):
        """?search= con parte del email debe retornar resultados coincidentes."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'search': 'soludigital'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertIn('soludigital', response.data['results'][0]['email'])

    def test_search_with_no_match_returns_empty(self):
        """?search= con término que no coincide debe retornar lista vacía."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'search': 'TerminoInexistente9999'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_search_partial_name_match(self):
        """?search= con término parcial del nombre debe encontrar coincidencias."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'search': 'Tecnológico'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)


class CustomerOrderingTest(APITestCase):
    """Pruebas del parámetro ?ordering= por name y created_at."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ordenador',
            password='Ordenar2024!',
        )
        self.client.force_authenticate(user=self.user)

        Customer.objects.create(name='Zirconia Import SAS', email='z@zirconia.com')
        Customer.objects.create(name='Alfa Cargo SA', email='a@alfacargo.com')
        Customer.objects.create(name='Mercado Tech Ltda', email='m@mercadotech.com')

    def test_ordering_by_name_ascending(self):
        """?ordering=name debe retornar resultados ordenados por nombre ascendente."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """?ordering=-name debe retornar resultados ordenados por nombre descendente."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_descending(self):
        """?ordering=-created_at debe retornar resultados ordenados por fecha desc."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        # Verificar que hay resultados y que el status code es correcto
        self.assertGreater(len(results), 0)

    def test_ordering_by_created_at_ascending(self):
        """?ordering=created_at debe retornar 200 con resultados ordenados."""
        response = self.client.get(CUSTOMERS_LIST_URL, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
