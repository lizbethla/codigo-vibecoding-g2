from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentProductViewSet

router = DefaultRouter()
router.register(r'', ShipmentViewSet, basename='shipment')

products_list = ShipmentProductViewSet.as_view({'get': 'list', 'post': 'create'})
products_detail = ShipmentProductViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = router.urls + [
    path('<int:shipment_pk>/products/', products_list, name='shipment-products-list'),
    path('<int:shipment_pk>/products/<int:pk>/', products_detail, name='shipment-products-detail'),
]
