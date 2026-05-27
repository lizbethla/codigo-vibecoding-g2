"""
Tests de autenticación JWT para Logistics API.

Cubre los endpoints:
  POST /api/v1/auth/token/         — obtener access + refresh token
  POST /api/v1/auth/token/refresh/ — renovar access token
  POST /api/v1/auth/token/verify/  — verificar token

También verifica que los endpoints protegidos (customers) exigen autenticación.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient


# URLs de los endpoints de autenticación
TOKEN_URL = '/api/v1/auth/token/'
TOKEN_REFRESH_URL = '/api/v1/auth/token/refresh/'
TOKEN_VERIFY_URL = '/api/v1/auth/token/verify/'
PROTECTED_URL = '/api/v1/customers/'

# Credenciales de prueba
TEST_USERNAME = 'logistica_user'
TEST_PASSWORD = 'SecurePass2026!'


class TokenObtainPairTests(APITestCase):
    """Tests para POST /api/v1/auth/token/ (obtener access + refresh token)."""

    def setUp(self):
        """Crea un usuario activo de prueba antes de cada test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
        )

    # -------------------------------------------------------------------------
    # Happy path
    # -------------------------------------------------------------------------

    def test_obtain_token_with_valid_credentials_returns_200(self):
        """Credenciales correctas retornan 200 con access y refresh token."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_access_is_non_empty_string(self):
        """El campo access del token obtenido no está vacío."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertTrue(len(response.data['access']) > 0)

    def test_obtain_token_refresh_is_non_empty_string(self):
        """El campo refresh del token obtenido no está vacío."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertTrue(len(response.data['refresh']) > 0)

    # -------------------------------------------------------------------------
    # Unhappy path
    # -------------------------------------------------------------------------

    def test_obtain_token_with_wrong_password_returns_401(self):
        """Contraseña incorrecta retorna 401."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': 'WrongPassword!',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_nonexistent_user_returns_401(self):
        """Usuario que no existe retorna 401."""
        response = self.client.post(TOKEN_URL, {
            'username': 'usuario_fantasma',
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_inactive_user_returns_401(self):
        """Usuario inactivo (is_active=False) no puede obtener token → 401."""
        inactive_user = User.objects.create_user(
            username='inactive_user',
            password=TEST_PASSWORD,
            is_active=False,
        )
        response = self.client.post(TOKEN_URL, {
            'username': 'inactive_user',
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # Edge cases — campos faltantes
    # -------------------------------------------------------------------------

    def test_obtain_token_with_empty_body_returns_400(self):
        """Body vacío retorna 400."""
        response = self.client.post(TOKEN_URL, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_without_password_returns_400(self):
        """Ausencia del campo password retorna 400."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_without_username_returns_400(self):
        """Ausencia del campo username retorna 400."""
        response = self.client.post(TOKEN_URL, {
            'password': TEST_PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenRefreshTests(APITestCase):
    """Tests para POST /api/v1/auth/token/refresh/ (renovar access token)."""

    def setUp(self):
        """Crea usuario y obtiene tokens válidos antes de cada test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
        )
        # Obtener tokens válidos en setUp para reutilizar en los tests
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')
        self.refresh_token = response.data['refresh']
        self.access_token = response.data['access']

    # -------------------------------------------------------------------------
    # Happy path
    # -------------------------------------------------------------------------

    def test_refresh_with_valid_token_returns_200(self):
        """Refresh token válido retorna 200 con nuevo access token."""
        response = self.client.post(TOKEN_REFRESH_URL, {
            'refresh': self.refresh_token,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_returns_non_empty_access_token(self):
        """El access token renovado no está vacío."""
        response = self.client.post(TOKEN_REFRESH_URL, {
            'refresh': self.refresh_token,
        }, format='json')

        self.assertTrue(len(response.data['access']) > 0)

    # -------------------------------------------------------------------------
    # Unhappy path
    # -------------------------------------------------------------------------

    def test_refresh_with_invalid_token_returns_401(self):
        """Refresh token inválido retorna 401."""
        response = self.client.post(TOKEN_REFRESH_URL, {
            'refresh': 'esto.no.es.un.token.valido',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_with_empty_body_returns_400(self):
        """Body vacío en refresh retorna 400."""
        response = self.client.post(TOKEN_REFRESH_URL, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenVerifyTests(APITestCase):
    """Tests para POST /api/v1/auth/token/verify/ (verificar validez de un token)."""

    def setUp(self):
        """Crea usuario y obtiene access token válido antes de cada test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
        )
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')
        self.access_token = response.data['access']

    # -------------------------------------------------------------------------
    # Happy path
    # -------------------------------------------------------------------------

    def test_verify_with_valid_access_token_returns_200(self):
        """Access token válido retorna 200."""
        response = self.client.post(TOKEN_VERIFY_URL, {
            'token': self.access_token,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # -------------------------------------------------------------------------
    # Unhappy path
    # -------------------------------------------------------------------------

    def test_verify_with_corrupted_token_returns_401(self):
        """Token corrupto retorna 401."""
        response = self.client.post(TOKEN_VERIFY_URL, {
            'token': 'token.corrupto.xyz',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # Edge cases
    # -------------------------------------------------------------------------

    def test_verify_with_empty_body_returns_400(self):
        """Body vacío en verify retorna 400."""
        response = self.client.post(TOKEN_VERIFY_URL, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProtectedEndpointAuthTests(APITestCase):
    """
    Tests de integración end-to-end: el token JWT obtenido funciona
    en un endpoint real protegido (/api/v1/customers/).
    """

    def setUp(self):
        """Crea usuario de prueba antes de cada test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
        )

    def _get_access_token(self):
        """Helper: obtiene access token del endpoint de login."""
        response = self.client.post(TOKEN_URL, {
            'username': TEST_USERNAME,
            'password': TEST_PASSWORD,
        }, format='json')
        return response.data['access']

    # -------------------------------------------------------------------------
    # Happy path — acceso autenticado
    # -------------------------------------------------------------------------

    def test_authenticated_request_to_protected_endpoint_returns_200(self):
        """Token válido permite acceder a endpoint protegido y retorna 200."""
        access_token = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(PROTECTED_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_request_returns_paginated_results(self):
        """Respuesta del endpoint protegido autenticado incluye estructura paginada."""
        access_token = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(PROTECTED_URL)

        # Verificar estructura de paginación estándar del proyecto
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    # -------------------------------------------------------------------------
    # Unhappy path — acceso sin token o con token inválido
    # -------------------------------------------------------------------------

    def test_request_without_token_to_protected_endpoint_returns_401(self):
        """Acceder a endpoint protegido sin token retorna 401."""
        response = self.client.get(PROTECTED_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_with_malformed_token_returns_401(self):
        """Token malformado en header Authorization retorna 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.malformado.xyz')

        response = self.client.get(PROTECTED_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_with_wrong_scheme_returns_401(self):
        """Esquema de autenticación incorrecto (Basic en lugar de Bearer) retorna 401."""
        access_token = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Basic {access_token}')

        response = self.client.get(PROTECTED_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
