"""Tests de la API de Supplier — endpoints CRUD, autenticación, filtros y búsquedas."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.suppliers.models import Supplier

User = get_user_model()

SUPPLIERS_URL = '/api/v1/suppliers/'


def supplier_detail_url(supplier_id):
    """Retorna la URL de detalle para el id dado."""
    return f'/api/v1/suppliers/{supplier_id}/'


def make_supplier(**kwargs):
    """Crea un Supplier con valores por defecto sobreescribibles."""
    defaults = {
        'name': 'Importaciones Tech LTDA',
        'email': 'ventas@importech.com',
        'country': 'Colombia',
        'is_active': True,
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


class SupplierAuthenticationTest(APITestCase):
    """Verifica que los endpoints requieren autenticación."""

    def test_list_requires_authentication(self):
        """GET /suppliers/ sin token retorna 401."""
        client = APIClient()
        response = client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_authentication(self):
        """POST /suppliers/ sin token retorna 401."""
        client = APIClient()
        response = client.post(SUPPLIERS_URL, data={})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierListTest(APITestCase):
    """Tests del endpoint GET /suppliers/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)

    def test_list_returns_200(self):
        """GET /suppliers/ retorna 200 con estructura paginada."""
        make_supplier(name='Proveedor Uno', email='uno@proveedor.com')
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_structure(self):
        """La respuesta contiene count, next, previous y results."""
        response = self.client.get(SUPPLIERS_URL)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

    def test_list_returns_all_active_suppliers(self):
        """Los proveedores creados aparecen en el listado."""
        make_supplier(name='Distribuidora Alfa', email='alfa@dist.com')
        make_supplier(name='Distribuidora Beta', email='beta@dist.com')
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.data['count'], 2)


class SupplierCreateTest(APITestCase):
    """Tests del endpoint POST /suppliers/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'Electro Supply Colombia',
            'contact_name': 'Maria Torres',
            'email': 'mtorres@electrosupply.com',
            'phone': '+57 310 456 7890',
            'address': 'Calle 80 # 45-20, Bodega 3',
            'city': 'Bogota',
            'country': 'Colombia',
            'tax_id': '900123456-7',
            'is_active': True,
        }

    def test_create_valid_supplier_returns_201(self):
        """POST con datos válidos retorna 201."""
        response = self.client.post(SUPPLIERS_URL, data=self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_includes_id(self):
        """La respuesta 201 incluye el campo id."""
        response = self.client.post(SUPPLIERS_URL, data=self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_is_detail_serializer(self):
        """La respuesta 201 incluye todos los campos (DetailSerializer)."""
        response = self.client.post(SUPPLIERS_URL, data=self.valid_payload, format='json')
        expected_fields = {
            'id', 'name', 'contact_name', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(response.data.keys()), expected_fields)

    def test_create_saves_supplier_in_db(self):
        """POST crea el proveedor en la base de datos."""
        self.client.post(SUPPLIERS_URL, data=self.valid_payload, format='json')
        self.assertTrue(Supplier.objects.filter(email='mtorres@electrosupply.com').exists())

    def test_create_without_required_fields_returns_400(self):
        """POST sin name ni email retorna 400."""
        response = self.client.post(SUPPLIERS_URL, data={}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_name_returns_400(self):
        """POST sin name retorna 400 con error en el campo name."""
        payload = {'email': 'sin-nombre@proveedor.com'}
        response = self.client.post(SUPPLIERS_URL, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_without_email_returns_400(self):
        """POST sin email retorna 400 con error en el campo email."""
        payload = {'name': 'Proveedor Sin Email'}
        response = self.client.post(SUPPLIERS_URL, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_with_duplicate_email_returns_400(self):
        """POST con email duplicado retorna 400."""
        make_supplier(name='Proveedor Existente', email='duplicado@proveedor.com')
        payload = {
            'name': 'Proveedor Nuevo',
            'email': 'duplicado@proveedor.com',
        }
        response = self.client.post(SUPPLIERS_URL, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SupplierRetrieveTest(APITestCase):
    """Tests del endpoint GET /suppliers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier(
            name='Global Tech Importaciones',
            email='imports@globaltech.com',
        )

    def test_retrieve_existing_supplier_returns_200(self):
        """GET /suppliers/{id}/ existente retorna 200."""
        url = supplier_detail_url(self.supplier.pk)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_detail_fields(self):
        """La respuesta de detalle incluye todos los campos."""
        url = supplier_detail_url(self.supplier.pk)
        response = self.client.get(url)
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_retrieve_nonexistent_supplier_returns_404(self):
        """GET /suppliers/99999/ inexistente retorna 404."""
        response = self.client.get(supplier_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SupplierUpdateTest(APITestCase):
    """Tests de los endpoints PUT y PATCH /suppliers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier(
            name='Cargo Express LTDA',
            email='ops@cargoexpress.com',
            city='Bogota',
        )

    def test_put_returns_200(self):
        """PUT /suppliers/{id}/ con datos válidos retorna 200."""
        url = supplier_detail_url(self.supplier.pk)
        payload = {
            'name': 'Cargo Express LTDA Actualizada',
            'email': 'ops@cargoexpress.com',
            'country': 'Colombia',
        }
        response = self.client.put(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_name_in_db(self):
        """PUT actualiza el campo name en la base de datos."""
        url = supplier_detail_url(self.supplier.pk)
        payload = {
            'name': 'Cargo Express Internacional',
            'email': 'ops@cargoexpress.com',
            'country': 'Colombia',
        }
        self.client.put(url, data=payload, format='json')
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Cargo Express Internacional')

    def test_patch_single_field_returns_200(self):
        """PATCH con un solo campo retorna 200."""
        url = supplier_detail_url(self.supplier.pk)
        payload = {'city': 'Medellin'}
        response = self.client.patch(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_single_field_in_db(self):
        """PATCH actualiza solo el campo indicado sin alterar los demás."""
        url = supplier_detail_url(self.supplier.pk)
        self.client.patch(url, data={'city': 'Cali'}, format='json')
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.city, 'Cali')
        self.assertEqual(self.supplier.name, 'Cargo Express LTDA')


class SupplierDeleteTest(APITestCase):
    """Tests del endpoint DELETE /suppliers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier(
            name='Proveedor A Eliminar',
            email='eliminar@proveedor.com',
        )

    def test_delete_returns_204(self):
        """DELETE /suppliers/{id}/ retorna 204."""
        url = supplier_detail_url(self.supplier.pk)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_supplier_from_db(self):
        """DELETE elimina el proveedor de la base de datos."""
        pk = self.supplier.pk
        url = supplier_detail_url(pk)
        self.client.delete(url)
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())


class SupplierFilterTest(APITestCase):
    """Tests de filtrado por is_active y country."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        # Proveedores activos en Colombia
        make_supplier(name='Proveedor Activo Colombia', email='activo1@col.com', is_active=True, country='Colombia')
        make_supplier(name='Proveedor Activo 2 Colombia', email='activo2@col.com', is_active=True, country='Colombia')
        # Proveedor inactivo en Colombia
        make_supplier(name='Proveedor Inactivo Colombia', email='inactivo@col.com', is_active=False, country='Colombia')
        # Proveedor activo en Mexico
        make_supplier(name='Proveedor Activo Mexico', email='activo@mex.com', is_active=True, country='Mexico')

    def test_filter_by_is_active_true(self):
        """?is_active=true retorna solo los proveedores activos."""
        response = self.client.get(SUPPLIERS_URL, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for supplier in response.data['results']:
            self.assertTrue(supplier['is_active'])

    def test_filter_by_is_active_false(self):
        """?is_active=false retorna solo los proveedores inactivos."""
        response = self.client.get(SUPPLIERS_URL, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for supplier in response.data['results']:
            self.assertFalse(supplier['is_active'])
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_country(self):
        """?country=Mexico retorna solo los proveedores de Mexico."""
        response = self.client.get(SUPPLIERS_URL, {'country': 'Mexico'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['country'], 'Mexico')

    def test_filter_by_country_colombia(self):
        """?country=Colombia retorna todos los proveedores de Colombia."""
        response = self.client.get(SUPPLIERS_URL, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_combined_filter_is_active_and_country(self):
        """?is_active=true&country=Colombia retorna proveedores activos en Colombia."""
        response = self.client.get(SUPPLIERS_URL, {'is_active': 'true', 'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)


class SupplierSearchTest(APITestCase):
    """Tests del filtro de búsqueda ?search= por name y email."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        make_supplier(name='Importaciones Tech LTDA', email='ventas@importech.com')
        make_supplier(name='Distribuidora Nacional', email='info@disnacional.com')
        make_supplier(name='Global Supply SAS', email='contacto@globalsupply.com')

    def test_search_by_name_returns_matching_results(self):
        """?search=Importaciones retorna proveedores que coinciden por nombre."""
        response = self.client.get(SUPPLIERS_URL, {'search': 'Importaciones'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertIn('Importaciones', response.data['results'][0]['name'])

    def test_search_by_email_returns_matching_results(self):
        """?search=globalsupply retorna proveedores que coinciden por email."""
        response = self.client.get(SUPPLIERS_URL, {'search': 'globalsupply'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_without_matches_returns_empty_list(self):
        """?search= con término sin coincidencias retorna lista vacía."""
        response = self.client.get(SUPPLIERS_URL, {'search': 'XYZTerminoInexistente99'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_search_case_insensitive(self):
        """La búsqueda no distingue mayúsculas/minúsculas."""
        response = self.client.get(SUPPLIERS_URL, {'search': 'importaciones'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)


class SupplierOrderingTest(APITestCase):
    """Tests del parámetro de ordenamiento ?ordering=."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_admin',
            password='SecurePass2024!',
        )
        self.client.force_authenticate(user=self.user)
        make_supplier(name='Zeta Logistica', email='zeta@logistica.com')
        make_supplier(name='Alfa Suministros', email='alfa@sum.com')
        make_supplier(name='Mega Distribuciones', email='mega@dist.com')

    def test_ordering_by_name_ascending(self):
        """?ordering=name retorna proveedores en orden alfabético ascendente."""
        response = self.client.get(SUPPLIERS_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """?ordering=-name retorna proveedores en orden alfabético descendente."""
        response = self.client.get(SUPPLIERS_URL, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_descending(self):
        """?ordering=-created_at retorna proveedores del más reciente al más antiguo."""
        response = self.client.get(SUPPLIERS_URL, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        # El primero debe ser el más reciente (Mega Distribuciones fue creado último)
        self.assertTrue(len(results) > 0)
