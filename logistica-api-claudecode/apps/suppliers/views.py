from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from .models import Supplier
from .serializers import SupplierListSerializer, SupplierDetailSerializer, SupplierWriteSerializer
from .filters import SupplierFilter


@extend_schema_view(
    list=extend_schema(tags=['Proveedores']),
    create=extend_schema(tags=['Proveedores']),
    retrieve=extend_schema(tags=['Proveedores']),
    update=extend_schema(tags=['Proveedores']),
    partial_update=extend_schema(tags=['Proveedores']),
    destroy=extend_schema(tags=['Proveedores']),
)
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_class = SupplierFilter
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return SupplierWriteSerializer
        return SupplierDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            SupplierDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
