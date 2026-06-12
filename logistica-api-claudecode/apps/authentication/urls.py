from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserManagementViewSet, GroupViewSet, UserProfileView, PermissionListView

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='auth-users')
router.register(r'groups', GroupViewSet, basename='auth-groups')

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='auth-me'),
    path('permissions/', PermissionListView.as_view(), name='auth-permissions'),
] + router.urls
