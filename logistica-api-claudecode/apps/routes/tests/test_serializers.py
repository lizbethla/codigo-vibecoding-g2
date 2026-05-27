"""
Tests de serializers para el módulo routes.
Cubre RouteListSerializer, RouteDetailSerializer, RouteWriteSerializer
y RouteStopWriteSerializer.
"""
from django.test import TestCase

from apps.routes.models import Route, RouteStop
from apps.routes.serializers import (
    RouteListSerializer,
    RouteDetailSerializer,
    RouteWriteSerializer,
    RouteStopSerializer,
    RouteStopWriteSerializer,
)


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


WRITE_DATA = {
    'name': 'Bogota - Medellin Express',
    'code': 'BOG-MED-01',
    'origin_city': 'Bogota',
    'destination_city': 'Medellin',
}

STOP_WRITE_DATA = {
    'stop_name': 'Manizales',
    'order': 1,
}


# ---------------------------------------------------------------------------
# RouteListSerializer
# ---------------------------------------------------------------------------

class RouteListSerializerTest(TestCase):
    """Pruebas del serializer de listado de rutas."""

    def setUp(self):
        self.route = make_route()

    def test_contains_expected_fields(self):
        """RouteListSerializer debe incluir los campos mínimos del listado."""
        serializer = RouteListSerializer(self.route)
        data = serializer.data
        expected_fields = {'id', 'code', 'name', 'origin_city', 'destination_city', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_values_match_instance(self):
        """Los valores serializados deben coincidir con el objeto de BD."""
        serializer = RouteListSerializer(self.route)
        data = serializer.data
        self.assertEqual(data['code'], 'BOG-MED-01')
        self.assertEqual(data['name'], 'Bogota - Medellin Express')
        self.assertEqual(data['origin_city'], 'Bogota')
        self.assertEqual(data['destination_city'], 'Medellin')
        self.assertTrue(data['is_active'])

    def test_does_not_include_stops(self):
        """RouteListSerializer no debe incluir el campo stops."""
        serializer = RouteListSerializer(self.route)
        self.assertNotIn('stops', serializer.data)


# ---------------------------------------------------------------------------
# RouteDetailSerializer
# ---------------------------------------------------------------------------

class RouteDetailSerializerTest(TestCase):
    """Pruebas del serializer de detalle de ruta."""

    def setUp(self):
        self.route = make_route()
        self.stop = make_stop(self.route)

    def test_contains_all_fields(self):
        """RouteDetailSerializer debe incluir todos los campos del modelo y stops."""
        serializer = RouteDetailSerializer(self.route)
        data = serializer.data
        expected_fields = {
            'id', 'name', 'code', 'origin_city', 'destination_city',
            'distance_km', 'estimated_hours', 'is_active',
            'created_at', 'updated_at', 'stops',
        }
        self.assertTrue(expected_fields.issubset(set(data.keys())))

    def test_stops_is_a_list(self):
        """El campo stops debe ser una lista con las paradas de la ruta."""
        serializer = RouteDetailSerializer(self.route)
        data = serializer.data
        self.assertIsInstance(data['stops'], list)
        self.assertEqual(len(data['stops']), 1)

    def test_stop_fields_in_nested_data(self):
        """Las paradas anidadas deben contener id, stop_name y order."""
        serializer = RouteDetailSerializer(self.route)
        stop_data = serializer.data['stops'][0]
        self.assertIn('id', stop_data)
        self.assertIn('stop_name', stop_data)
        self.assertIn('order', stop_data)

    def test_empty_stops_list_when_no_stops(self):
        """Ruta sin paradas debe retornar stops como lista vacía."""
        route_no_stops = make_route(code='CAL-BOG-01', name='Cali - Bogota')
        serializer = RouteDetailSerializer(route_no_stops)
        self.assertEqual(serializer.data['stops'], [])


# ---------------------------------------------------------------------------
# RouteWriteSerializer
# ---------------------------------------------------------------------------

class RouteWriteSerializerTest(TestCase):
    """Pruebas del serializer de escritura de rutas (create/update)."""

    def test_valid_with_minimum_required_fields(self):
        """RouteWriteSerializer debe ser válido con los campos mínimos requeridos."""
        serializer = RouteWriteSerializer(data=WRITE_DATA)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_save_creates_instance(self):
        """Un serializer válido debe crear una instancia de Route al llamar save()."""
        serializer = RouteWriteSerializer(data=WRITE_DATA)
        self.assertTrue(serializer.is_valid())
        route = serializer.save()
        self.assertIsNotNone(route.pk)
        self.assertEqual(route.code, 'BOG-MED-01')

    def test_invalid_without_name(self):
        """RouteWriteSerializer debe fallar si falta el campo name."""
        data = {**WRITE_DATA}
        del data['name']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_invalid_without_code(self):
        """RouteWriteSerializer debe fallar si falta el campo code."""
        data = {**WRITE_DATA}
        del data['code']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_invalid_without_origin_city(self):
        """RouteWriteSerializer debe fallar si falta el campo origin_city."""
        data = {**WRITE_DATA}
        del data['origin_city']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_city', serializer.errors)

    def test_invalid_without_destination_city(self):
        """RouteWriteSerializer debe fallar si falta el campo destination_city."""
        data = {**WRITE_DATA}
        del data['destination_city']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_city', serializer.errors)

    def test_invalid_with_duplicate_code(self):
        """RouteWriteSerializer debe fallar si el code ya existe en BD."""
        make_route()  # crea con BOG-MED-01
        serializer = RouteWriteSerializer(data=WRITE_DATA)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_valid_with_optional_fields(self):
        """RouteWriteSerializer debe aceptar campos opcionales como distance_km y estimated_hours."""
        data = {**WRITE_DATA, 'distance_km': '450.50', 'estimated_hours': '5.75'}
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_fields_are_writable(self):
        """El serializer debe exponer todos los campos esperados para escritura."""
        serializer = RouteWriteSerializer()
        fields = set(serializer.fields.keys())
        expected = {'name', 'code', 'origin_city', 'destination_city',
                    'distance_km', 'estimated_hours', 'is_active'}
        self.assertEqual(fields, expected)


# ---------------------------------------------------------------------------
# RouteStopWriteSerializer
# ---------------------------------------------------------------------------

class RouteStopWriteSerializerTest(TestCase):
    """Pruebas del serializer de escritura de paradas de ruta."""

    def test_valid_with_minimum_required_fields(self):
        """RouteStopWriteSerializer debe ser válido con stop_name y order."""
        serializer = RouteStopWriteSerializer(data=STOP_WRITE_DATA)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_without_stop_name(self):
        """RouteStopWriteSerializer debe fallar si falta el campo stop_name."""
        data = {**STOP_WRITE_DATA}
        del data['stop_name']
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_name', serializer.errors)

    def test_invalid_without_order(self):
        """RouteStopWriteSerializer debe fallar si falta el campo order."""
        data = {**STOP_WRITE_DATA}
        del data['order']
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('order', serializer.errors)

    def test_valid_with_optional_fields(self):
        """RouteStopWriteSerializer debe aceptar campos opcionales."""
        data = {**STOP_WRITE_DATA, 'estimated_arrival_hours': '2.50', 'notes': 'Parada en terminal'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_fields_are_writable(self):
        """El serializer debe exponer exactamente los campos esperados para escritura."""
        serializer = RouteStopWriteSerializer()
        fields = set(serializer.fields.keys())
        expected = {'stop_name', 'order', 'estimated_arrival_hours', 'notes'}
        self.assertEqual(fields, expected)


# ---------------------------------------------------------------------------
# RouteStopSerializer (read)
# ---------------------------------------------------------------------------

class RouteStopSerializerTest(TestCase):
    """Pruebas del serializer de lectura de paradas de ruta."""

    def setUp(self):
        self.route = make_route()
        self.stop = make_stop(self.route)

    def test_contains_expected_fields(self):
        """RouteStopSerializer debe incluir id, stop_name, order, estimated_arrival_hours y notes."""
        serializer = RouteStopSerializer(self.stop)
        data = serializer.data
        expected_fields = {'id', 'stop_name', 'order', 'estimated_arrival_hours', 'notes'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_values_match_instance(self):
        """Los valores serializados deben coincidir con el objeto de BD."""
        serializer = RouteStopSerializer(self.stop)
        data = serializer.data
        self.assertEqual(data['stop_name'], 'Manizales')
        self.assertEqual(data['order'], 1)
