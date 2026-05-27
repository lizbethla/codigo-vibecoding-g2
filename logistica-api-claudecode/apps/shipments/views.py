from django.db import IntegrityError
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from .models import Shipment, ShipmentProduct
from .serializers import (
    ShipmentListSerializer, ShipmentDetailSerializer, ShipmentWriteSerializer,
    ShipmentProductSerializer, ShipmentProductWriteSerializer,
)
from .filters import ShipmentFilter


@extend_schema_view(
    list=extend_schema(tags=['Envíos']),
    create=extend_schema(tags=['Envíos']),
    retrieve=extend_schema(tags=['Envíos']),
    update=extend_schema(tags=['Envíos']),
    partial_update=extend_schema(tags=['Envíos']),
    destroy=extend_schema(tags=['Envíos']),
)
class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse', 'route', 'vehicle'
    ).prefetch_related('shipment_products__product')
    permission_classes = [IsAuthenticated]
    filterset_class = ShipmentFilter
    search_fields = ['tracking_code', 'recipient_name']
    ordering_fields = ['scheduled_date', 'created_at', 'total_cost', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ShipmentWriteSerializer
        return ShipmentDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            ShipmentDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    list=extend_schema(tags=['Envíos']),
    create=extend_schema(tags=['Envíos']),
    retrieve=extend_schema(tags=['Envíos']),
    update=extend_schema(tags=['Envíos']),
    partial_update=extend_schema(tags=['Envíos']),
    destroy=extend_schema(tags=['Envíos']),
)
class ShipmentProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ShipmentProduct.objects.none()
        return ShipmentProduct.objects.filter(
            shipment_id=self.kwargs['shipment_pk']
        ).select_related('product')

    def perform_create(self, serializer):
        serializer.save(shipment_id=self.kwargs['shipment_pk'])

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ShipmentProductWriteSerializer
        return ShipmentProductSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            instance = serializer.save(shipment_id=self.kwargs['shipment_pk'])
        except IntegrityError:
            raise ValidationError(
                {'product': ['Este producto ya está registrado en este envío.']}
            )
        return Response(
            ShipmentProductSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
