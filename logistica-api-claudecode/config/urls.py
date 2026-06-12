from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.authentication.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/v1/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/v1/auth/', include('apps.authentication.urls')),

    # Documentación OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Apps
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/suppliers/', include('apps.suppliers.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/warehouses/', include('apps.warehouses.urls')),
    path('api/v1/drivers/', include('apps.drivers.urls')),
    path('api/v1/vehicles/', include('apps.transport.urls')),
    path('api/v1/routes/', include('apps.routes.urls')),
    path('api/v1/shipments/', include('apps.shipments.urls')),
]
