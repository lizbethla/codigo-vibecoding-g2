"""Tests para el modelo Warehouse."""

from decimal import Decimal

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase

from apps.warehouses.models import Warehouse


class WarehouseCreationTest(TestCase):
    """Tests de creación válida del modelo Warehouse."""

    def setUp(self):
        self.manager_user = User.objects.create_user(
            username='manager1',
            password='pass123',
            first_name='Carlos',
            last_name='Pérez',
        )

    def _make_warehouse(self, **kwargs):
        """Crea un Warehouse con datos realistas por defecto."""
        defaults = {
            'name': 'Bodega Bogotá Norte',
            'code': 'BOG-01',
            'address': 'Calle 13 No. 45-67, Bogotá',
            'city': 'Bogotá',
        }
        defaults.update(kwargs)
        return Warehouse.objects.create(**defaults)

    # ------------------------------------------------------------------ #
    # Happy paths                                                          #
    # ------------------------------------------------------------------ #

    def test_create_warehouse_without_manager(self):
        """Crea un almacén sin encargado asignado (manager nullable)."""
        warehouse = self._make_warehouse()
        self.assertIsNotNone(warehouse.pk)
        self.assertIsNone(warehouse.manager)

    def test_create_warehouse_with_manager(self):
        """Crea un almacén con manager asignado."""
        warehouse = self._make_warehouse(manager=self.manager_user, code='BOG-02')
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.manager, self.manager_user)

    def test_default_is_active_true(self):
        """El campo is_active tiene default=True."""
        warehouse = self._make_warehouse()
        self.assertTrue(warehouse.is_active)

    def test_default_country_peru(self):
        """El campo country tiene default='Perú'."""
        warehouse = self._make_warehouse()
        self.assertEqual(warehouse.country, 'Perú')

    def test_nullable_fields_accept_none(self):
        """Los campos nullable (manager, latitude, longitude, capacity_m3) aceptan None."""
        warehouse = self._make_warehouse(
            latitude=None,
            longitude=None,
            capacity_m3=None,
        )
        self.assertIsNone(warehouse.latitude)
        self.assertIsNone(warehouse.longitude)
        self.assertIsNone(warehouse.capacity_m3)
        self.assertIsNone(warehouse.manager)

    def test_nullable_fields_accept_values(self):
        """Los campos opcionales aceptan valores numéricos correctos."""
        warehouse = self._make_warehouse(
            latitude=Decimal('4.710989'),
            longitude=Decimal('-74.072090'),
            capacity_m3=Decimal('500.00'),
        )
        self.assertEqual(warehouse.latitude, Decimal('4.710989'))
        self.assertEqual(warehouse.longitude, Decimal('-74.072090'))
        self.assertEqual(warehouse.capacity_m3, Decimal('500.00'))

    def test_str_representation(self):
        """__str__ retorna 'CODE — NAME'."""
        warehouse = self._make_warehouse()
        self.assertEqual(str(warehouse), 'BOG-01 — Bodega Bogotá Norte')

    def test_timestamps_assigned_on_create(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        warehouse = self._make_warehouse()
        self.assertIsNotNone(warehouse.created_at)
        self.assertIsNotNone(warehouse.updated_at)

    # ------------------------------------------------------------------ #
    # Unhappy paths                                                        #
    # ------------------------------------------------------------------ #

    def test_code_unique_constraint(self):
        """Crear dos warehouses con el mismo code lanza IntegrityError."""
        self._make_warehouse(code='MED-01')
        with self.assertRaises(IntegrityError):
            self._make_warehouse(code='MED-01', name='Bodega Medellín Duplicada')

    # ------------------------------------------------------------------ #
    # Meta ordering                                                        #
    # ------------------------------------------------------------------ #

    def test_meta_ordering_by_name(self):
        """El queryset por defecto está ordenado por name (ascendente)."""
        Warehouse.objects.create(
            name='Bodega Medellín Central',
            code='MED-01',
            address='Calle 50 No. 40-25, Medellín',
            city='Medellín',
        )
        Warehouse.objects.create(
            name='Almacén Cali Sur',
            code='CAL-01',
            address='Av. Pasoancho No. 12-34, Cali',
            city='Cali',
        )
        Warehouse.objects.create(
            name='Bodega Bogotá Norte',
            code='BOG-01',
            address='Calle 13 No. 45-67, Bogotá',
            city='Bogotá',
        )
        names = list(Warehouse.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    # ------------------------------------------------------------------ #
    # Edge case FK                                                         #
    # ------------------------------------------------------------------ #

    def test_set_null_on_manager_delete(self):
        """Al eliminar el user-manager, warehouse.manager queda NULL (SET_NULL)."""
        warehouse = self._make_warehouse(manager=self.manager_user, code='BOG-03')
        self.assertIsNotNone(warehouse.manager)
        self.manager_user.delete()
        warehouse.refresh_from_db()
        self.assertIsNone(warehouse.manager)
