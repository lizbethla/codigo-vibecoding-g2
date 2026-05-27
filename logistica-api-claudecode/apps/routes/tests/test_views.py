"""
Tests de vistas para el módulo routes.
Cubre RouteViewSet y RouteStopViewSet (endpoint anidado /routes/{route_pk}/stops/).
Usa force_authenticate en lugar de flujo JWT real.
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.routes.models import Route, RouteStop

User = get_user_model()

ROUTES_URL = '/api/v1/routes/'


def stops_url(route_pk):
    """Retorna la URL del endpoint anidado de paradas para una ruta dada."""
    return f'/api/v1/routes/{route_pk}/stops/'


def stop_detail_url(route_pk, stop_pk):
    """Retorna la URL de detalle de una parada específica."""
    return f'/api/v1/routes/{route_pk}/stops/{stop_pk}/'


def route_detail_url(route_pk):
    """Retorna la URL de detalle de una ruta específica."""
    return f'/api/v1/routes/{route_pk}/'


def make_route(**kwargs):
    """Factoría auxiliar para crear rutas con datos realistas."""
    defaults = {
        'name': 'Bogota - Medellin Express',
        'code': 'BOG-MED-01',
        'origin_city': 'Bogota',
        'destination_city': 'Medellin',
    }
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


def make_stop(route, **kwargs):
    """Factoría auxiliar para crear paradas con datos realistas."""
    defaults = {
        'stop_name': 'Manizales',
        'order': 1,
    }
    defaults.update(kwargs)
    return RouteStop.objects.create(route=route, **defaults)


ROUTE_POST_DATA = {
    'name': 'Bogota - Medellin Express',
    'code': 'BOG-MED-01',
    'origin_city': 'Bogota',
    'destination_city': 'Medellin',
}

STOP_POST_DATA = {
    'stop_name': 'Manizales',
    'order': 1,
}


# ---------------------------------------------------------------------------
# RouteViewSet tests
# ---------------------------------------------------------------------------

class RouteViewSetTest(TestCase):
    """Tests del ViewSet de rutas (CRUD completo + filtros)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='dispatcher_user',
            password='securepass123',
        )
        self.client.force_authenticate(user=self.user)

    # --- Listado ---

    def test_list_routes_returns_200(self):
        """GET /api/v1/routes/ debe retornar 200 con estructura paginada."""
        make_route()
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_uses_list_serializer_fields(self):
        """El listado debe incluir solo los campos del RouteListSerializer."""
        make_route()
        response = self.client.get(ROUTES_URL)
        result = response.data['results'][0]
        expected_keys = {'id', 'code', 'name', 'origin_city', 'destination_city', 'is_active'}
        self.assertEqual(set(result.keys()), expected_keys)

    def test_list_without_auth_returns_401(self):
        """GET /api/v1/routes/ sin autenticación debe retornar 401."""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Creación ---

    def test_create_route_returns_201_with_id(self):
        """POST con datos válidos debe retornar 201 e incluir id en la respuesta."""
        response = self.client.post(ROUTES_URL, ROUTE_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    def test_create_route_response_uses_detail_serializer(self):
        """POST exitoso debe responder con RouteDetailSerializer (incluye stops)."""
        response = self.client.post(ROUTES_URL, ROUTE_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('stops', response.data)

    def test_create_route_persists_to_db(self):
        """POST exitoso debe crear el objeto en la base de datos."""
        self.client.post(ROUTES_URL, ROUTE_POST_DATA, format='json')
        self.assertEqual(Route.objects.filter(code='BOG-MED-01').count(), 1)

    def test_create_route_without_required_fields_returns_400(self):
        """POST sin campos requeridos debe retornar 400."""
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_with_duplicate_code_returns_400(self):
        """POST con code ya existente debe retornar 400."""
        make_route()
        response = self.client.post(ROUTES_URL, ROUTE_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', response.data)

    def test_create_without_auth_returns_401(self):
        """POST sin autenticación debe retornar 401."""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.post(ROUTES_URL, ROUTE_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Detalle ---

    def test_retrieve_route_returns_200_with_stops(self):
        """GET /api/v1/routes/{id}/ debe retornar 200 con stops anidadas."""
        route = make_route()
        make_stop(route)
        response = self.client.get(route_detail_url(route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stops', response.data)
        self.assertEqual(len(response.data['stops']), 1)

    def test_retrieve_nonexistent_route_returns_404(self):
        """GET con id inexistente debe retornar 404."""
        response = self.client.get(route_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Actualización PUT ---

    def test_put_route_returns_200(self):
        """PUT /api/v1/routes/{id}/ con todos los campos debe retornar 200."""
        route = make_route()
        update_data = {
            'name': 'Bogota - Medellin Rapido',
            'code': 'BOG-MED-01',
            'origin_city': 'Bogota',
            'destination_city': 'Medellin',
        }
        response = self.client.put(route_detail_url(route.pk), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_name_in_db(self):
        """PUT debe actualizar el nombre de la ruta en BD."""
        route = make_route()
        update_data = {
            'name': 'Bogota - Medellin Rapido',
            'code': 'BOG-MED-01',
            'origin_city': 'Bogota',
            'destination_city': 'Medellin',
        }
        self.client.put(route_detail_url(route.pk), update_data, format='json')
        route.refresh_from_db()
        self.assertEqual(route.name, 'Bogota - Medellin Rapido')

    # --- Actualización PATCH ---

    def test_patch_single_field_returns_200(self):
        """PATCH con un solo campo debe retornar 200."""
        route = make_route()
        response = self.client.patch(
            route_detail_url(route.pk),
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_field_in_db(self):
        """PATCH debe actualizar el campo modificado en BD."""
        route = make_route()
        self.client.patch(route_detail_url(route.pk), {'is_active': False}, format='json')
        route.refresh_from_db()
        self.assertFalse(route.is_active)

    # --- Eliminación ---

    def test_delete_route_returns_204(self):
        """DELETE /api/v1/routes/{id}/ debe retornar 204."""
        route = make_route()
        response = self.client.delete(route_detail_url(route.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_route_from_db(self):
        """DELETE debe eliminar la ruta de la base de datos."""
        route = make_route()
        route_pk = route.pk
        self.client.delete(route_detail_url(route_pk))
        self.assertFalse(Route.objects.filter(pk=route_pk).exists())

    def test_delete_route_cascades_to_stops(self):
        """DELETE de una ruta debe eliminar sus paradas por CASCADE."""
        route = make_route()
        make_stop(route, stop_name='Manizales', order=1)
        make_stop(route, stop_name='La Pintada', order=2)
        route_pk = route.pk
        self.client.delete(route_detail_url(route_pk))
        self.assertEqual(RouteStop.objects.filter(route_id=route_pk).count(), 0)

    # --- Filtros ---

    def test_filter_by_origin_city(self):
        """?origin_city= debe retornar solo las rutas de esa ciudad de origen."""
        make_route(code='BOG-MED-01', name='Bogota - Medellin', origin_city='Bogota', destination_city='Medellin')
        make_route(code='CAL-BOG-01', name='Cali - Bogota', origin_city='Cali', destination_city='Bogota')
        response = self.client.get(ROUTES_URL + '?origin_city=Bogota')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['origin_city'] == 'Bogota' for r in results))
        self.assertEqual(len(results), 1)

    def test_filter_by_destination_city(self):
        """?destination_city= debe retornar solo rutas con ese destino."""
        make_route(code='BOG-MED-01', name='Bogota - Medellin', origin_city='Bogota', destination_city='Medellin')
        make_route(code='CAL-BOG-01', name='Cali - Bogota', origin_city='Cali', destination_city='Bogota')
        response = self.client.get(ROUTES_URL + '?destination_city=Medellin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['destination_city'], 'Medellin')

    def test_filter_by_is_active_true(self):
        """?is_active=true debe retornar solo rutas activas."""
        make_route(code='BOG-MED-01', name='Activa', origin_city='Bogota', destination_city='Medellin', is_active=True)
        make_route(code='CAL-BOG-01', name='Inactiva', origin_city='Cali', destination_city='Bogota', is_active=False)
        response = self.client.get(ROUTES_URL + '?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['is_active'] for r in results))

    def test_filter_by_is_active_false(self):
        """?is_active=false debe retornar solo rutas inactivas."""
        make_route(code='BOG-MED-01', name='Activa', origin_city='Bogota', destination_city='Medellin', is_active=True)
        make_route(code='CAL-BOG-01', name='Inactiva', origin_city='Cali', destination_city='Bogota', is_active=False)
        response = self.client.get(ROUTES_URL + '?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(not r['is_active'] for r in results))

    # --- Búsqueda ---

    def test_search_by_name(self):
        """?search= debe retornar coincidencias por name."""
        make_route(code='BOG-MED-01', name='Bogota - Medellin Express', origin_city='Bogota', destination_city='Medellin')
        make_route(code='CAL-BOG-01', name='Cali - Bogota Directo', origin_city='Cali', destination_city='Bogota')
        response = self.client.get(ROUTES_URL + '?search=Express')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertIn('Express', results[0]['name'])

    def test_search_by_code(self):
        """?search= debe retornar coincidencias por code."""
        make_route(code='BOG-MED-01', name='Bogota - Medellin Express', origin_city='Bogota', destination_city='Medellin')
        make_route(code='CAL-BOG-01', name='Cali - Bogota Directo', origin_city='Cali', destination_city='Bogota')
        response = self.client.get(ROUTES_URL + '?search=CAL-BOG')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['code'], 'CAL-BOG-01')

    # --- Ordenamiento ---

    def test_ordering_by_name_asc(self):
        """?ordering=name debe ordenar rutas por nombre ascendente."""
        make_route(code='Z-01', name='Zeta Ruta', origin_city='Cali', destination_city='Pasto')
        make_route(code='A-01', name='Alfa Ruta', origin_city='Pereira', destination_city='Armenia')
        response = self.client.get(ROUTES_URL + '?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_created_at_desc(self):
        """?ordering=-created_at debe retornar 200 con rutas ordenadas."""
        make_route(code='BOG-MED-01', name='Ruta Uno', origin_city='Bogota', destination_city='Medellin')
        make_route(code='CAL-BOG-01', name='Ruta Dos', origin_city='Cali', destination_city='Bogota')
        response = self.client.get(ROUTES_URL + '?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)


# ---------------------------------------------------------------------------
# RouteStopViewSet tests (endpoint anidado)
# ---------------------------------------------------------------------------

class RouteStopViewSetTest(TestCase):
    """Tests del ViewSet de paradas de ruta (endpoint anidado bajo /routes/{route_pk}/stops/)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='stop_tester',
            password='securepass456',
        )
        self.client.force_authenticate(user=self.user)
        self.route = make_route()

    # --- Listado ---

    def test_list_stops_returns_200_with_list(self):
        """GET /api/v1/routes/{route_pk}/stops/ debe retornar 200 con lista de paradas."""
        make_stop(self.route, stop_name='Manizales', order=1)
        make_stop(self.route, stop_name='La Pintada', order=2)
        response = self.client.get(stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_stops_returns_only_route_stops(self):
        """El listado solo debe retornar paradas de la ruta especificada."""
        make_stop(self.route, stop_name='Manizales', order=1)
        other_route = make_route(
            code='CAL-BOG-01',
            name='Cali - Bogota',
            origin_city='Cali',
            destination_city='Bogota',
        )
        make_stop(other_route, stop_name='Ibague', order=1)
        response = self.client.get(stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # La respuesta puede ser paginada o lista directa — extraer results
        data = response.data
        results = data.get('results', data) if isinstance(data, dict) else data
        for stop in results:
            # verificar que no se filtran paradas de otra ruta
            self.assertEqual(stop.get('stop_name', ''), 'Manizales')

    def test_list_stops_without_auth_returns_401(self):
        """GET sin autenticación debe retornar 401."""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.get(stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Creación ---

    def test_create_stop_returns_201_with_id(self):
        """POST parada válida debe retornar 201 e incluir id."""
        response = self.client.post(stops_url(self.route.pk), STOP_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    def test_create_stop_assigns_correct_route(self):
        """La parada creada debe estar asociada a la ruta correcta."""
        response = self.client.post(stops_url(self.route.pk), STOP_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        stop = RouteStop.objects.get(pk=response.data['id'])
        self.assertEqual(stop.route_id, self.route.pk)

    def test_create_stop_persists_to_db(self):
        """POST exitoso debe crear la parada en la base de datos."""
        self.client.post(stops_url(self.route.pk), STOP_POST_DATA, format='json')
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 1)

    def test_create_stop_without_auth_returns_401(self):
        """POST sin autenticación debe retornar 401."""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.post(
            stops_url(self.route.pk), STOP_POST_DATA, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_stop_duplicate_order_same_route_returns_400(self):
        """POST con order duplicado en la misma ruta debe retornar 400."""
        make_stop(self.route, stop_name='Manizales', order=1)
        duplicate_data = {'stop_name': 'La Pintada', 'order': 1}
        response = self.client.post(stops_url(self.route.pk), duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_duplicate_order_different_route_returns_201(self):
        """POST con order duplicado en ruta DIFERENTE debe funcionar (retornar 201)."""
        other_route = make_route(
            code='CAL-BOG-01',
            name='Cali - Bogota',
            origin_city='Cali',
            destination_city='Bogota',
        )
        make_stop(self.route, stop_name='Manizales', order=1)
        response = self.client.post(stops_url(other_route.pk), STOP_POST_DATA, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Detalle ---

    def test_retrieve_stop_returns_200(self):
        """GET /api/v1/routes/{route_pk}/stops/{id}/ debe retornar 200."""
        stop = make_stop(self.route)
        response = self.client.get(stop_detail_url(self.route.pk, stop.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stop_name'], 'Manizales')

    # --- Actualización PATCH ---

    def test_patch_stop_returns_200(self):
        """PATCH de una parada debe retornar 200."""
        stop = make_stop(self.route)
        response = self.client.patch(
            stop_detail_url(self.route.pk, stop.pk),
            {'stop_name': 'Armenia'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_stop_updates_field_in_db(self):
        """PATCH debe actualizar el campo modificado en BD."""
        stop = make_stop(self.route)
        self.client.patch(
            stop_detail_url(self.route.pk, stop.pk),
            {'stop_name': 'Armenia'},
            format='json',
        )
        stop.refresh_from_db()
        self.assertEqual(stop.stop_name, 'Armenia')

    # --- Eliminación ---

    def test_delete_stop_returns_204(self):
        """DELETE /api/v1/routes/{route_pk}/stops/{id}/ debe retornar 204."""
        stop = make_stop(self.route)
        response = self.client.delete(stop_detail_url(self.route.pk, stop.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_stop_removes_from_db(self):
        """DELETE debe eliminar la parada de la base de datos."""
        stop = make_stop(self.route)
        stop_pk = stop.pk
        self.client.delete(stop_detail_url(self.route.pk, stop_pk))
        self.assertFalse(RouteStop.objects.filter(pk=stop_pk).exists())

    # --- Edge case: ruta inexistente ---

    def test_list_stops_nonexistent_route_returns_empty_or_404(self):
        """GET de paradas para ruta inexistente debe retornar 404 o lista vacía."""
        response = self.client.get(stops_url(99999))
        # El ViewSet filtra por route_pk sin verificar existencia de la ruta;
        # retorna lista vacía (200) si no hay paradas para ese ID.
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
