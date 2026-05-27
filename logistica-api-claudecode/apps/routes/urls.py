from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, RouteStopViewSet

router = DefaultRouter()
router.register(r'', RouteViewSet, basename='route')

stops_list = RouteStopViewSet.as_view({'get': 'list', 'post': 'create'})
stops_detail = RouteStopViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = router.urls + [
    path('<int:route_pk>/stops/', stops_list, name='route-stops-list'),
    path('<int:route_pk>/stops/<int:pk>/', stops_detail, name='route-stops-detail'),
]
