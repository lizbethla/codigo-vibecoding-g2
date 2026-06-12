from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Customer
from .serializers import CustomerListSerializer, CustomerDetailSerializer, CustomerWriteSerializer
from .filters import CustomerFilter


@extend_schema_view(
    list=extend_schema(tags=['Clientes']),
    create=extend_schema(tags=['Clientes']),
    retrieve=extend_schema(tags=['Clientes']),
    update=extend_schema(tags=['Clientes']),
    partial_update=extend_schema(tags=['Clientes']),
    destroy=extend_schema(tags=['Clientes']),
)
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = CustomerFilter
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return CustomerWriteSerializer
        return CustomerDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            CustomerDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
