from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Warehouse
from .serializers import WarehouseListSerializer, WarehouseDetailSerializer, WarehouseWriteSerializer
from .filters import WarehouseFilter


@extend_schema_view(
    list=extend_schema(tags=['Almacenes']),
    create=extend_schema(tags=['Almacenes']),
    retrieve=extend_schema(tags=['Almacenes']),
    update=extend_schema(tags=['Almacenes']),
    partial_update=extend_schema(tags=['Almacenes']),
    destroy=extend_schema(tags=['Almacenes']),
)
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.select_related('manager')
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = WarehouseFilter
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'city', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return WarehouseWriteSerializer
        return WarehouseDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            WarehouseDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
