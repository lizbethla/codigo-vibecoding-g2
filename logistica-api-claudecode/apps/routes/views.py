from django.db import IntegrityError
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from common.permissions import StrictDjangoModelPermissions
from .models import Route, RouteStop
from .serializers import (
    RouteListSerializer, RouteDetailSerializer, RouteWriteSerializer,
    RouteStopSerializer, RouteStopWriteSerializer,
)
from .filters import RouteFilter


@extend_schema_view(
    list=extend_schema(tags=['Rutas']),
    create=extend_schema(tags=['Rutas']),
    retrieve=extend_schema(tags=['Rutas']),
    update=extend_schema(tags=['Rutas']),
    partial_update=extend_schema(tags=['Rutas']),
    destroy=extend_schema(tags=['Rutas']),
)
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('stops')
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    filterset_class = RouteFilter
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'origin_city', 'destination_city', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return RouteWriteSerializer
        return RouteDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            RouteDetailSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    list=extend_schema(tags=['Rutas']),
    create=extend_schema(tags=['Rutas']),
    retrieve=extend_schema(tags=['Rutas']),
    update=extend_schema(tags=['Rutas']),
    partial_update=extend_schema(tags=['Rutas']),
    destroy=extend_schema(tags=['Rutas']),
)
class RouteStopViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return RouteStop.objects.none()
        return RouteStop.objects.filter(route_id=self.kwargs['route_pk'])

    def perform_create(self, serializer):
        serializer.save(route_id=self.kwargs['route_pk'])

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return RouteStopWriteSerializer
        return RouteStopSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            instance = serializer.save(route_id=self.kwargs['route_pk'])
        except IntegrityError:
            raise ValidationError(
                {'order': ['Ya existe una parada con este número de orden en esta ruta.']}
            )
        return Response(
            RouteStopSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
