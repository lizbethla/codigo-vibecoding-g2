from django.core.management.base import BaseCommand
from apps.products.models import Product, ProductCategory


SEED_DATA = [
    {
        'sku':            'LTAP-DELL-LAT5540',
        'name':           'Dell Latitude 5540 14" Business Laptop',
        'description':    (
            'Intel Core i7-1365U, 16GB RAM DDR5, 512GB NVMe SSD, Windows 11 Pro. '
            'Ideal para gestión logística y trabajo en campo.'
        ),
        'category':       ProductCategory.LAPTOP,
        'unit_price':     '1249.99',
        'weight_kg':      '1.560',
        'dimensions_cm':  '32.4 x 21.6 x 1.87',
        'stock_quantity': 15,
        'is_active':      True,
    },
    {
        'sku':            'MOB-SAM-A54-5G',
        'name':           'Samsung Galaxy A54 5G 128GB',
        'description':    (
            'Pantalla Super AMOLED 6.4", cámara triple 50MP, batería 5000mAh. '
            'Resistente al agua IP67. Para conductores y personal de campo.'
        ),
        'category':       ProductCategory.MOBILE,
        'unit_price':     '369.00',
        'weight_kg':      '0.202',
        'dimensions_cm':  '15.83 x 7.62 x 0.81',
        'stock_quantity': 40,
        'is_active':      True,
    },
    {
        'sku':            'NET-UBI-USG-PRO4',
        'name':           'Ubiquiti UniFi Security Gateway Pro-4',
        'description':    (
            'Router empresarial con 4 puertos SFP/RJ45, throughput 1 Gbps, '
            'IDS/IPS integrado. Para centros de distribución y almacenes.'
        ),
        'category':       ProductCategory.NETWORKING,
        'unit_price':     '389.00',
        'weight_kg':      '1.150',
        'dimensions_cm':  '44.0 x 13.2 x 4.4',
        'stock_quantity': 8,
        'is_active':      True,
    },
    {
        'sku':            'PER-HON-CT40-AND',
        'name':           'Honeywell Dolphin CT40 Android Barcode Scanner',
        'description':    (
            'Lector de código de barras 2D, Android 8 GMS, Wi-Fi 802.11ac, '
            'batería intercambiable 3900mAh. Ideal para inventario en almacén.'
        ),
        'category':       ProductCategory.PERIPHERAL,
        'unit_price':     '599.00',
        'weight_kg':      '0.298',
        'dimensions_cm':  '16.0 x 7.2 x 2.8',
        'stock_quantity': 20,
        'is_active':      True,
    },
    {
        'sku':            'STO-WDC-RED4T-NAS',
        'name':           'WD Red Plus 4TB NAS Hard Drive',
        'description':    (
            'Disco duro 3.5" SATA 6Gb/s, 5400RPM, caché 128MB, '
            'optimizado para NAS 24/7. Para servidores de almacén y backups.'
        ),
        'category':       ProductCategory.STORAGE,
        'unit_price':     '89.99',
        'weight_kg':      '0.650',
        'dimensions_cm':  '14.7 x 10.1 x 2.61',
        'stock_quantity': 50,
        'is_active':      True,
    },
]


class Command(BaseCommand):
    help = 'Crea 5 productos tecnológicos de ejemplo si aún no existen en la base de datos.'

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for data in SEED_DATA:
            sku = data['sku']
            if Product.objects.filter(sku=sku).exists():
                self.stdout.write(self.style.WARNING(f'  Omitido (ya existe): {sku}'))
                skipped_count += 1
                continue

            Product.objects.create(**data)
            self.stdout.write(self.style.SUCCESS(f'  Creado: {sku} — {data["name"]}'))
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeed completado: {created_count} creados, {skipped_count} omitidos.'
            )
        )
