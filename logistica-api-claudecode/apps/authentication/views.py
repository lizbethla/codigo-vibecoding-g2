from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import viewsets, filters, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    GroupSerializer,
    GroupWriteSerializer,
    PermissionSerializer,
    UserListSerializer,
    UserDetailSerializer,
    UserProfileSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveAPIView):
    """Perfil del usuario autenticado. Cualquier usuario autenticado puede acceder."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PermissionListView(generics.ListAPIView):
    """Lista todos los permisos disponibles del sistema. Solo superadmin."""
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperUser]
    pagination_class = None
    queryset = (
        Permission.objects
        .select_related('content_type')
        .order_by('content_type__app_label', 'content_type__model', 'codename')
    )


class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related('groups').order_by('id')
    permission_classes = [IsSuperUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['id', 'username', 'date_joined']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserDetailSerializer


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related('permissions__content_type').order_by('name')
    permission_classes = [IsSuperUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return GroupWriteSerializer
        return GroupSerializer
