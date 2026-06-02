'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentInfoCard } from '@/components/shipments/shipment-info-card';
import { ShipmentProductsTable } from '@/components/shipments/shipment-products-table';
import { ShipmentEditSheet } from '@/components/shipments/shipment-edit-sheet';
import { ShipmentProductSheet } from '@/components/shipments/shipment-product-sheet';
import { ShipmentProductDeleteDialog } from '@/components/shipments/shipment-product-delete-dialog';
import { useShipment } from '@/hooks/use-shipments';
import type { ShipmentProduct } from '@/docs/schemas';

interface ShipmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const shipmentId = parseInt(id, 10);

  const { data: shipment, isLoading, isError } = useShipment(shipmentId);

  // Shipment edit sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Product sheet state
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShipmentProduct | undefined>(undefined);

  // Product delete dialog state
  const [productDeleteDialogOpen, setProductDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ShipmentProduct | null>(null);

  function handleEditProduct(product: ShipmentProduct) {
    setSelectedProduct(product);
    setProductSheetOpen(true);
  }

  function handleDeleteProduct(product: ShipmentProduct) {
    setProductToDelete(product);
    setProductDeleteDialogOpen(true);
  }

  function handleProductSheetOpenChange(open: boolean) {
    setProductSheetOpen(open);
    if (!open) {
      setSelectedProduct(undefined);
    }
  }

  function handleProductDeleteDialogOpenChange(open: boolean) {
    setProductDeleteDialogOpen(open);
    if (!open) {
      setProductToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Error al cargar el envío. Intenta de nuevo.
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => router.push('/shipments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a envíos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/shipments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a envíos
        </Button>
      </div>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-mono">
          {shipment.tracking_code}
        </h1>
      </div>

      {/* Shipment info card */}
      <ShipmentInfoCard
        shipment={shipment}
        onEdit={() => setEditSheetOpen(true)}
      />

      {/* Products section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Productos del envío</h2>
          <Button
            size="sm"
            onClick={() => {
              setSelectedProduct(undefined);
              setProductSheetOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar producto
          </Button>
        </div>

        <ShipmentProductsTable
          products={shipment.shipment_products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      </div>

      {/* Shipment edit sheet */}
      <ShipmentEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        shipmentId={shipmentId}
      />

      {/* Product sheet */}
      <ShipmentProductSheet
        open={productSheetOpen}
        onOpenChange={handleProductSheetOpenChange}
        shipmentId={shipmentId}
        product={selectedProduct}
      />

      {/* Product delete dialog */}
      <ShipmentProductDeleteDialog
        productName={productToDelete?.product.name ?? ''}
        shipmentId={shipmentId}
        productId={productToDelete?.id ?? null}
        open={productDeleteDialogOpen}
        onOpenChange={handleProductDeleteDialogOpenChange}
      />
    </div>
  );
}
