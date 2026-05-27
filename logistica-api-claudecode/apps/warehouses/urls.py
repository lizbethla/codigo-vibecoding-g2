from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet

router = DefaultRouter()
router.register(r'', WarehouseViewSet, basename='warehouse')

urlpatterns = router.urls
