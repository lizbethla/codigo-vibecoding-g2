"""
Tests de modelos para el módulo routes.
Cubre Route y RouteStop: creación, validaciones, constraints y comportamiento ORM.
"""
from django.test import TestCase
from django.db import IntegrityError

from apps.routes.models import Route, RouteStop


def make_route(**kwargs):
    """Factoría auxiliar para crear rutas con datos realistas."""
    defaults = {
        'name': 'Bogotá - Medellín Express',
        'code': 'BOG-MED-01',
        'origin_city': 'Bogotá',
        'destination_city': 'Medellín',
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


# ---------------------------------------------------------------------------
# Route — tests
# ---------------------------------------------------------------------------

class RouteCreationTest(TestCase):
    """Pruebas de creación válida del modelo Route."""

    def test_create_route_happy_path(self):
        """Debe crear una ruta con campos mínimos requeridos."""
        route = make_route()
        self.assertIsNotNone(route.pk)
        self.assertEqual(route.name, 'Bogotá - Medellín Express')
        self.assertEqual(route.code, 'BOG-MED-01')
        self.assertEqual(route.origin_city, 'Bogotá')
        self.assertEqual(route.destination_city, 'Medellín')

    def test_str_returns_expected_format(self):
        """El método __str__ debe retornar código — origen → destino."""
        route = make_route()
        self.assertEqual(str(route), 'BOG-MED-01 — Bogotá → Medellín')

    def test_default_is_active_true(self):
        """El campo is_active debe ser True por defecto."""
        route = make_route()
        self.assertTrue(route.is_active)

    def test_nullable_distance_km_accepts_none(self):
        """El campo distance_km es nullable y debe aceptar None."""
        route = make_route(distance_km=None)
        self.assertIsNone(route.distance_km)

    def test_nullable_estimated_hours_accepts_none(self):
        """El campo estimated_hours es nullable y debe aceptar None."""
        route = make_route(estimated_hours=None)
        self.assertIsNone(route.estimated_hours)

    def test_code_unique_raises_on_duplicate(self):
        """Crear dos rutas con el mismo code debe lanzar IntegrityError."""
        make_route(code='BOG-MED-01')
        with self.assertRaises(IntegrityError):
            make_route(code='BOG-MED-01', name='Otra Ruta')

    def test_timestamps_assigned_automatically(self):
        """Los campos created_at y updated_at se asignan al crear."""
        route = make_route()
        self.assertIsNotNone(route.created_at)
        self.assertIsNotNone(route.updated_at)

    def test_meta_ordering_by_name(self):
        """El queryset debe ordenarse por name según Meta.ordering."""
        # Usar solo caracteres ASCII para evitar diferencias de colación en SQLite
        make_route(name='Ruta Zeta', code='Z-01', origin_city='Cali', destination_city='Pasto')
        make_route(name='Ruta Alfa', code='A-01', origin_city='Pereira', destination_city='Armenia')
        make_route(name='Bogota - Medellin Express', code='BOG-MED-02',
                   origin_city='Bogota', destination_city='Medellin')
        routes = list(Route.objects.filter(code__in=['Z-01', 'A-01', 'BOG-MED-02']))
        names = [r.name for r in routes]
        self.assertEqual(names, sorted(names))

    def test_create_route_with_all_fields(self):
        """Debe crear una ruta con todos los campos opcionales completados."""
        from decimal import Decimal
        route = make_route(
            distance_km='450.50',
            estimated_hours='5.75',
            is_active=False,
        )
        # SQLite retorna string para DecimalField; comparar con Decimal tras conversión
        self.assertEqual(Decimal(str(route.distance_km)), Decimal('450.50'))
        self.assertEqual(Decimal(str(route.estimated_hours)), Decimal('5.75'))
        self.assertFalse(route.is_active)


# ---------------------------------------------------------------------------
# RouteStop — tests
# ---------------------------------------------------------------------------

class RouteStopCreationTest(TestCase):
    """Pruebas de creación válida del modelo RouteStop."""

    def setUp(self):
        self.route = make_route()

    def test_create_stop_happy_path(self):
        """Debe crear una parada con campos mínimos requeridos."""
        stop = make_stop(self.route)
        self.assertIsNotNone(stop.pk)
        self.assertEqual(stop.stop_name, 'Manizales')
        self.assertEqual(stop.order, 1)
        self.assertEqual(stop.route, self.route)

    def test_str_returns_expected_format(self):
        """El método __str__ debe retornar 'Parada N: nombre'."""
        stop = make_stop(self.route, stop_name='La Pintada', order=2)
        self.assertEqual(str(stop), 'Parada 2: La Pintada')

    def test_unique_together_same_route_same_order_raises(self):
        """Dos paradas con misma ruta y mismo order deben lanzar IntegrityError."""
        make_stop(self.route, order=1)
        with self.assertRaises(IntegrityError):
            make_stop(self.route, stop_name='Otra Parada', order=1)

    def test_different_routes_can_share_same_order(self):
        """Paradas de rutas distintas pueden tener el mismo valor de order."""
        route2 = make_route(
            name='Cali - Bogotá Directo',
            code='CAL-BOG-01',
            origin_city='Cali',
            destination_city='Bogotá',
        )
        stop1 = make_stop(self.route, order=1)
        stop2 = make_stop(route2, order=1)
        self.assertEqual(stop1.order, stop2.order)
        self.assertNotEqual(stop1.route, stop2.route)

    def test_ordering_by_route_and_order(self):
        """Las paradas deben retornar ordenadas por (route, order)."""
        make_stop(self.route, stop_name='Armenia', order=3)
        make_stop(self.route, stop_name='Manizales', order=1)
        make_stop(self.route, stop_name='La Pintada', order=2)
        stops = list(RouteStop.objects.filter(route=self.route))
        self.assertEqual(stops[0].order, 1)
        self.assertEqual(stops[1].order, 2)
        self.assertEqual(stops[2].order, 3)

    def test_nullable_estimated_arrival_hours_accepts_none(self):
        """El campo estimated_arrival_hours es nullable y debe aceptar None."""
        stop = make_stop(self.route, estimated_arrival_hours=None)
        self.assertIsNone(stop.estimated_arrival_hours)

    def test_nullable_notes_accepts_none(self):
        """El campo notes es nullable y debe aceptar None."""
        stop = make_stop(self.route, notes=None)
        self.assertIsNone(stop.notes)

    def test_cascade_delete_route_removes_stops(self):
        """Al eliminar una ruta, todas sus paradas se deben eliminar (CASCADE)."""
        make_stop(self.route, stop_name='Manizales', order=1)
        make_stop(self.route, stop_name='La Pintada', order=2)
        route_pk = self.route.pk
        self.route.delete()
        remaining = RouteStop.objects.filter(route_id=route_pk)
        self.assertEqual(remaining.count(), 0)

    def test_timestamps_assigned_automatically(self):
        """Los campos created_at y updated_at se asignan al crear la parada."""
        stop = make_stop(self.route)
        self.assertIsNotNone(stop.created_at)
        self.assertIsNotNone(stop.updated_at)
