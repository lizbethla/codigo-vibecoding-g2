"""
Capa de servicios Stripe — todas las llamadas al SDK se hacen aquí.
Las vistas y comandos de gestión llaman estas funciones; nunca importan stripe directamente.
"""
import stripe
from django.conf import settings


def _get_client() -> stripe.StripeClient:
    return stripe.StripeClient(
        api_key=settings.STRIPE_SECRET_KEY,
        stripe_version=settings.STRIPE_API_VERSION,
    )


def sync_product_to_stripe(product) -> tuple[str, str]:
    """
    Asegura que el Product exista en Stripe con un Price activo.
    Retorna (stripe_product_id, stripe_price_id).

    Siempre crea un nuevo Price porque los precios de Stripe son inmutables.
    """
    client = _get_client()

    product_params = {
        'name': product.name,
        'metadata': {
            'sku': product.sku,
            'category': product.category,
            'db_id': str(product.pk),
        },
        'active': product.is_active,
    }
    if product.description:
        product_params['description'] = product.description

    if product.stripe_product_id:
        stripe_product = client.products.update(product.stripe_product_id, product_params)
    else:
        stripe_product = client.products.create(product_params)

    stripe_product_id = stripe_product.id

    unit_amount = int(product.unit_price * 100)

    stripe_price = client.prices.create({
        'product': stripe_product_id,
        'unit_amount': unit_amount,
        'currency': 'usd',
        'metadata': {
            'sku': product.sku,
            'db_product_id': str(product.pk),
        },
    })

    return stripe_product_id, stripe_price.id


def create_checkout_session(items: list[dict], user) -> dict:
    """
    Crea una Stripe Checkout Session para uno o varios productos.
    items: [{'product': Product, 'quantity': int}, ...]
    Retorna dict con session_id, checkout_url, amount_total (en centavos).

    Precondición: cada product.stripe_price_id debe estar establecido.
    payment_method_types omitido intencionalmente para habilitar métodos dinámicos.
    """
    line_items = []
    skus_sin_sync = []

    for item in items:
        product = item['product']
        if not product.stripe_price_id:
            skus_sin_sync.append(product.sku)
            continue
        line_items.append({
            'price': product.stripe_price_id,
            'quantity': item['quantity'],
        })

    if skus_sin_sync:
        raise ValueError(
            f'Productos sin stripe_price_id: {", ".join(skus_sin_sync)}. '
            'Ejecuta: python manage.py sync_stripe_products'
        )

    client = _get_client()

    session = client.checkout.sessions.create({
        'mode': 'payment',
        'line_items': line_items,
        'success_url': settings.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url': settings.STRIPE_CANCEL_URL,
        'metadata': {
            'user_id': str(user.pk),
            'product_ids': ','.join(str(i['product'].pk) for i in items),
        },
        'customer_email': user.email or None,
    })

    return {
        'session_id': session.id,
        'checkout_url': session.url,
        'amount_total': session.amount_total,
    }


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    """
    Verifica la firma del webhook y retorna el Event parseado.
    Lanza stripe.error.SignatureVerificationError si la firma es inválida.
    payload debe ser bytes crudos — decodificarlo rompería la verificación HMAC.
    """
    return stripe.Webhook.construct_event(
        payload,
        sig_header,
        settings.STRIPE_WEBHOOK_SECRET,
    )
