from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Vehicle
from .serializers import VehicleListSerializer, VehicleDetailSerializer, VehicleWriteSerializer
from .filters import VehicleFilter


@extend_schema_view(
    list=extend_schema(tags=['Vehículos']),
    create=extend_schema(tags=['Vehículos']),
    retrieve=extend_schema(tags=['Vehículos']),
    update=extend_schema(tags=['Vehículos']),
    partial_update=extend_schema(tags=['Vehículos']),
    destroy=extend_schema(tags=['Vehículos']),
)
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related('driver', 'driver__user')
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = VehicleFilter
    search_fields = ['plate']
    ordering_fields = ['plate', 'year', 'status', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return VehicleWriteSerializer
        return VehicleDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            VehicleDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
