from django.core.management.base import BaseCommand
from apps.payments.services import sync_product_to_stripe
from apps.products.models import Product


class Command(BaseCommand):
    help = (
        'Sincroniza los productos activos de la base de datos con Stripe. '
        'Crea o actualiza Products y Prices en Stripe y guarda los IDs en la base de datos.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué productos se sincronizarían sin hacer cambios en Stripe.',
        )
        parser.add_argument(
            '--sku',
            type=str,
            help='Sincroniza solo el producto con este SKU.',
        )

    def handle(self, *args, **options):
        dry_run    = options['dry_run']
        sku_filter = options.get('sku')

        qs = Product.objects.filter(is_active=True)
        if sku_filter:
            qs = qs.filter(sku=sku_filter)

        if not qs.exists():
            self.stdout.write(self.style.WARNING('No se encontraron productos activos.'))
            return

        synced  = 0
        updated = 0
        errors  = 0

        for product in qs:
            label = f'{product.sku} — {product.name}'

            if dry_run:
                action = 'ACTUALIZAR' if product.stripe_product_id else 'CREAR'
                self.stdout.write(f'  [dry-run] {action}: {label}')
                continue

            try:
                stripe_product_id, stripe_price_id = sync_product_to_stripe(product)

                was_new = not product.stripe_product_id

                product.stripe_product_id = stripe_product_id
                product.stripe_price_id   = stripe_price_id
                product.save(update_fields=['stripe_product_id', 'stripe_price_id', 'updated_at'])

                if was_new:
                    self.stdout.write(self.style.SUCCESS(f'  Creado en Stripe: {label}'))
                    synced += 1
                else:
                    self.stdout.write(self.style.SUCCESS(f'  Actualizado en Stripe: {label}'))
                    updated += 1

            except Exception as exc:
                self.stderr.write(self.style.ERROR(f'  Error sincronizando {label}: {exc}'))
                errors += 1

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSync completado: {synced} creados, {updated} actualizados, {errors} errores.'
                )
            )
