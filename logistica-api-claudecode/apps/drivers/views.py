from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Driver
from .serializers import DriverListSerializer, DriverDetailSerializer, DriverWriteSerializer
from .filters import DriverFilter


@extend_schema_view(
    list=extend_schema(tags=['Conductores']),
    create=extend_schema(tags=['Conductores']),
    retrieve=extend_schema(tags=['Conductores']),
    update=extend_schema(tags=['Conductores']),
    partial_update=extend_schema(tags=['Conductores']),
    destroy=extend_schema(tags=['Conductores']),
)
class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related('user')
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = DriverFilter
    search_fields = ['national_id', 'license_number']
    ordering_fields = ['status', 'license_expiry', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return DriverWriteSerializer
        return DriverDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            DriverDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
