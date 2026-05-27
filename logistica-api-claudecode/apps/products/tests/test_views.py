"""Tests de integración para ProductViewSet — endpoints CRUD, filtros y búsqueda."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.products.models import Product, ProductCategory
from apps.suppliers.models import Supplier

User = get_user_model()

PRODUCTS_URL = '/api/v1/products/'


def product_detail_url(product_id):
    """Retorna la URL de detalle de un producto."""
    return f'/api/v1/products/{product_id}/'


class ProductViewSetAuthTests(APITestCase):
    """Tests de autenticación — acceso sin credenciales."""

    def test_get_list_without_auth_returns_401(self):
        """GET /api/v1/products/ sin autenticación retorna 401."""
        client = APIClient()
        response = client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_detail_without_auth_returns_401(self):
        """GET /api/v1/products/{id}/ sin autenticación retorna 401."""
        client = APIClient()
        response = client.get(product_detail_url(1))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProductViewSetCRUDTests(APITestCase):
    """Tests del ciclo de vida CRUD completo con usuario autenticado."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='operador_logistica',
            password='contraseña_segura_123',
        )
        self.client.force_authenticate(user=self.user)

        self.supplier = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            weight_kg=Decimal('1.130'),
            stock_quantity=10,
        )

    # ----- GET list -----

    def test_get_list_returns_200_with_paginated_structure(self):
        """GET /api/v1/products/ retorna 200 y estructura paginada."""
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

    def test_get_list_returns_products(self):
        """GET /api/v1/products/ incluye el producto creado en setUp."""
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

    # ----- GET detail -----

    def test_get_detail_returns_200_with_expanded_supplier(self):
        """GET /api/v1/products/{id}/ retorna 200 con supplier expandido."""
        response = self.client.get(product_detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supplier', response.data)
        supplier_data = response.data['supplier']
        self.assertIsNotNone(supplier_data)
        self.assertEqual(supplier_data['id'], self.supplier.id)
        self.assertEqual(supplier_data['name'], 'Importaciones Tech LTDA')

    def test_get_detail_nonexistent_id_returns_404(self):
        """GET /api/v1/products/{id}/ con id inexistente retorna 404."""
        response = self.client.get(product_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ----- POST create -----

    def test_post_with_supplier_returns_201_and_id(self):
        """POST con datos válidos y supplier retorna 201 e incluye id en la respuesta."""
        data = {
            'supplier': self.supplier.id,
            'sku': 'NET-TP-AX6000-003',
            'name': 'TP-Link AX6000 Router WiFi 6',
            'category': ProductCategory.NETWORKING,
            'unit_price': '450000.00',
            'weight_kg': '1.200',
            'stock_quantity': 25,
        }
        response = self.client.post(PRODUCTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['sku'], 'NET-TP-AX6000-003')

    def test_post_without_supplier_returns_201(self):
        """POST con datos válidos sin supplier retorna 201."""
        data = {
            'sku': 'MOB-SAM-A54-002',
            'name': 'Samsung Galaxy A54 5G',
            'category': ProductCategory.MOBILE,
            'unit_price': '950000.00',
        }
        response = self.client.post(PRODUCTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    def test_post_missing_required_fields_returns_400(self):
        """POST sin campos requeridos retorna 400."""
        data = {
            'description': 'Producto sin campos requeridos',
        }
        response = self.client.post(PRODUCTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)
        self.assertIn('name', response.data)
        self.assertIn('category', response.data)
        self.assertIn('unit_price', response.data)

    def test_post_duplicate_sku_returns_400(self):
        """POST con SKU duplicado retorna 400."""
        data = {
            'sku': 'LAP-TP-X1C-001',  # SKU ya existe
            'name': 'Laptop ThinkPad X1 Carbon Copia',
            'category': ProductCategory.LAPTOP,
            'unit_price': '1800000.00',
        }
        response = self.client.post(PRODUCTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_post_invalid_category_returns_400(self):
        """POST con category inválida retorna 400."""
        data = {
            'sku': 'INV-CAT-001',
            'name': 'Producto con categoría inválida',
            'category': 'CATEGORIA_INEXISTENTE',
            'unit_price': '500000.00',
        }
        response = self.client.post(PRODUCTS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', response.data)

    # ----- PUT update -----

    def test_put_returns_200_with_updated_data(self):
        """PUT /api/v1/products/{id}/ actualiza el producto y retorna 200."""
        data = {
            'sku': 'LAP-TP-X1C-001',
            'name': 'Laptop ThinkPad X1 Carbon Gen 12',
            'category': ProductCategory.LAPTOP,
            'unit_price': '1950000.00',
            'weight_kg': '1.100',
            'stock_quantity': 8,
        }
        response = self.client.put(product_detail_url(self.product.id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Laptop ThinkPad X1 Carbon Gen 12')
        self.assertEqual(self.product.unit_price, Decimal('1950000.00'))

    # ----- PATCH partial update -----

    def test_patch_single_field_returns_200(self):
        """PATCH de un único campo actualiza solo ese campo y retorna 200."""
        data = {'stock_quantity': 50}
        response = self.client.patch(product_detail_url(self.product.id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 50)

    def test_patch_preserves_other_fields(self):
        """PATCH de un campo no modifica los campos que no se incluyen."""
        original_name = self.product.name
        data = {'unit_price': '2000000.00'}
        self.client.patch(product_detail_url(self.product.id), data, format='json')
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, original_name)

    # ----- DELETE -----

    def test_delete_returns_204_and_removes_from_db(self):
        """DELETE /api/v1/products/{id}/ retorna 204 y elimina el producto de la BD."""
        product_id = self.product.id
        response = self.client.delete(product_detail_url(product_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product_id).exists())


class ProductViewSetFilterTests(APITestCase):
    """Tests de filtros por campo, búsqueda de texto y ordenamiento."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='operador_logistica',
            password='contraseña_segura_123',
        )
        self.client.force_authenticate(user=self.user)

        self.supplier_a = Supplier.objects.create(
            name='Importaciones Tech LTDA',
            email='ventas@importech.com',
            country='Colombia',
        )
        self.supplier_b = Supplier.objects.create(
            name='Distribuidora Digital SAS',
            email='pedidos@distdigital.com',
            country='Colombia',
        )

        # Productos para filtros
        self.laptop = Product.objects.create(
            supplier=self.supplier_a,
            sku='LAP-TP-X1C-001',
            name='Laptop ThinkPad X1 Carbon',
            category=ProductCategory.LAPTOP,
            unit_price=Decimal('1850000.00'),
            stock_quantity=10,
            is_active=True,
        )
        self.mobile = Product.objects.create(
            supplier=self.supplier_b,
            sku='MOB-SAM-A54-002',
            name='Samsung Galaxy A54 5G',
            category=ProductCategory.MOBILE,
            unit_price=Decimal('950000.00'),
            stock_quantity=30,
            is_active=True,
        )
        self.storage_inactive = Product.objects.create(
            supplier=self.supplier_a,
            sku='STO-WD-1TB-003',
            name='Western Digital HDD 1TB',
            category=ProductCategory.STORAGE,
            unit_price=Decimal('220000.00'),
            stock_quantity=5,
            is_active=False,
        )

    # ----- Filtros de campo -----

    def test_filter_by_category_exact(self):
        """?category=LAPTOP retorna solo los productos con esa categoría."""
        response = self.client.get(PRODUCTS_URL, {'category': 'LAPTOP'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('LAP-TP-X1C-001', skus)
        self.assertNotIn('MOB-SAM-A54-002', skus)
        self.assertNotIn('STO-WD-1TB-003', skus)

    def test_filter_by_supplier_id(self):
        """?supplier={id} retorna solo los productos de ese proveedor."""
        response = self.client.get(PRODUCTS_URL, {'supplier': self.supplier_b.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('MOB-SAM-A54-002', skus)
        self.assertNotIn('LAP-TP-X1C-001', skus)

    def test_filter_by_is_active_true(self):
        """?is_active=true retorna solo los productos activos."""
        response = self.client.get(PRODUCTS_URL, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('LAP-TP-X1C-001', skus)
        self.assertIn('MOB-SAM-A54-002', skus)
        self.assertNotIn('STO-WD-1TB-003', skus)

    def test_filter_by_is_active_false(self):
        """?is_active=false retorna solo los productos inactivos."""
        response = self.client.get(PRODUCTS_URL, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('STO-WD-1TB-003', skus)
        self.assertNotIn('LAP-TP-X1C-001', skus)

    # ----- Búsqueda de texto -----

    def test_search_by_name(self):
        """?search=ThinkPad retorna productos cuyo name coincide."""
        response = self.client.get(PRODUCTS_URL, {'search': 'ThinkPad'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('LAP-TP-X1C-001', skus)
        self.assertNotIn('MOB-SAM-A54-002', skus)

    def test_search_by_sku(self):
        """?search=MOB retorna productos cuyo sku coincide."""
        response = self.client.get(PRODUCTS_URL, {'search': 'MOB-SAM'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p['sku'] for p in response.data['results']]
        self.assertIn('MOB-SAM-A54-002', skus)
        self.assertNotIn('LAP-TP-X1C-001', skus)

    # ----- Ordenamiento -----

    def test_ordering_by_unit_price_ascending(self):
        """?ordering=unit_price retorna productos ordenados por precio ascendente."""
        response = self.client.get(PRODUCTS_URL, {'ordering': 'unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [Decimal(p['unit_price']) for p in response.data['results']]
        self.assertEqual(prices, sorted(prices))

    def test_ordering_by_stock_quantity_descending(self):
        """?ordering=-stock_quantity retorna productos ordenados por stock descendente."""
        response = self.client.get(PRODUCTS_URL, {'ordering': '-stock_quantity'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        quantities = [p['stock_quantity'] for p in response.data['results']]
        self.assertEqual(quantities, sorted(quantities, reverse=True))
