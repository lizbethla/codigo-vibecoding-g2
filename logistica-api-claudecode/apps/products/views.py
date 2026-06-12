from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer
from .filters import ProductFilter


@extend_schema_view(
    list=extend_schema(tags=['Productos']),
    create=extend_schema(tags=['Productos']),
    retrieve=extend_schema(tags=['Productos']),
    update=extend_schema(tags=['Productos']),
    partial_update=extend_schema(tags=['Productos']),
    destroy=extend_schema(tags=['Productos']),
)
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('supplier')
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = ProductFilter
    search_fields = ['name', 'sku']
    ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            ProductDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
