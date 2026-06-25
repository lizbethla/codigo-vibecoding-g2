from django.urls import path
from .views import CheckoutView, OrderListView, WebhookView

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='payment-checkout'),
    path('webhook/',  WebhookView.as_view(),  name='payment-webhook'),
    path('orders/',   OrderListView.as_view(), name='payment-orders'),
]
