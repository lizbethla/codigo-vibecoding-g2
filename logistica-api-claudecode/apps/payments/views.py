import logging

import stripe
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from .models import Order, OrderItem, OrderStatus
from .serializers import (
    CheckoutResponseSerializer,
    OrderListSerializer,
    ProductCheckoutSerializer,
)
from .services import construct_webhook_event, create_checkout_session

logger = logging.getLogger(__name__)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Pagos'],
        summary='Crear sesión de pago (Stripe Checkout)',
        description=(
            'Crea una Stripe Checkout Session para uno o varios productos y retorna la URL '
            'de pago hosted por Stripe. El cliente redirige al usuario a `checkout_url`. '
            'Todos los productos deben haber sido sincronizados con Stripe '
            '(`sync_stripe_products`) antes de usar este endpoint.'
        ),
        request=ProductCheckoutSerializer,
        responses={
            201: CheckoutResponseSerializer,
            400: OpenApiResponse(description='Items vacíos o parámetros inválidos'),
            404: OpenApiResponse(description='Producto no encontrado o inactivo'),
            422: OpenApiResponse(description='Producto sin stripe_price_id — requiere sync'),
            502: OpenApiResponse(description='Error al comunicarse con Stripe'),
        },
    )
    def post(self, request):
        serializer = ProductCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data['items']

        # Resolver y validar todos los productos antes de llamar a Stripe
        resolved_items = []
        for item_data in items_data:
            try:
                product = Product.objects.get(pk=item_data['product_id'], is_active=True)
            except Product.DoesNotExist:
                return Response(
                    {'detail': f'Producto id={item_data["product_id"]} no encontrado o inactivo.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not product.stripe_price_id:
                return Response(
                    {'detail': f'Producto "{product.name}" (SKU: {product.sku}) no está disponible para pago. Ejecuta sync_stripe_products.'},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            resolved_items.append({'product': product, 'quantity': item_data['quantity']})

        try:
            session_data = create_checkout_session(resolved_items, request.user)
        except stripe.StripeError as exc:
            logger.error('Stripe error al crear checkout session: %s', exc)
            return Response(
                {'detail': 'No se pudo crear la sesión de pago. Intenta más tarde.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order = Order.objects.create(
            user=request.user,
            stripe_session_id=session_data['session_id'],
            checkout_url=session_data['checkout_url'],
            amount_total=session_data['amount_total'] or 0,
            status=OrderStatus.PENDING,
        )

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                product=item['product'],
                quantity=item['quantity'],
                unit_price=item['product'].unit_price,
            )
            for item in resolved_items
        ])

        return Response(
            {
                'order_id':     order.pk,
                'checkout_url': session_data['checkout_url'],
                'session_id':   session_data['session_id'],
                'amount_usd':   round(order.amount_total / 100, 2),
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    @extend_schema(exclude=True)
    def post(self, request):
        payload    = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        if not sig_header:
            return Response({'detail': 'Missing signature.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = construct_webhook_event(payload, sig_header)
        except stripe.error.SignatureVerificationError:
            logger.warning('Webhook: firma de Stripe inválida.')
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.error('Webhook: error parseando evento: %s', exc)
            return Response({'detail': 'Webhook error.'}, status=status.HTTP_400_BAD_REQUEST)

        handlers = {
            'checkout.session.completed': self._handle_session_completed,
            'checkout.session.expired':   self._handle_session_expired,
        }
        handler = handlers.get(event['type'])
        if handler:
            handler(event['data']['object'])
        else:
            logger.debug('Evento Stripe no manejado: %s', event['type'])

        return Response({'received': True}, status=status.HTTP_200_OK)

    def _handle_session_completed(self, session):
        session_id = session.get('id')
        try:
            order = Order.objects.get(stripe_session_id=session_id)
        except Order.DoesNotExist:
            logger.error('checkout.session.completed: no existe Order para session %s', session_id)
            return

        order.status                = OrderStatus.COMPLETED
        order.stripe_payment_intent = session.get('payment_intent', '')
        order.save(update_fields=['status', 'stripe_payment_intent', 'updated_at'])
        logger.info('Order #%s marcada COMPLETED (session %s)', order.pk, session_id)

    def _handle_session_expired(self, session):
        session_id = session.get('id')
        try:
            order = Order.objects.get(stripe_session_id=session_id, status=OrderStatus.PENDING)
        except Order.DoesNotExist:
            return

        order.status = OrderStatus.EXPIRED
        order.save(update_fields=['status', 'updated_at'])
        logger.info('Order #%s marcada EXPIRED (session %s)', order.pk, session_id)


@extend_schema_view(
    get=extend_schema(
        tags=['Pagos'],
        summary='Listar mis órdenes',
        description='Retorna el historial de órdenes del usuario autenticado con sus ítems, ordenadas por fecha descendente.',
        responses={200: OrderListSerializer(many=True)},
    )
)
class OrderListView(generics.ListAPIView):
    serializer_class   = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related('items__product')
            .order_by('-created_at')
        )
