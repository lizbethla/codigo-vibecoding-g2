'use client';

import { useRouter } from 'next/navigation';
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pago cancelado</h1>
          <p className="text-sm text-muted-foreground">
            No se realizó ningún cargo. Tu carrito sigue disponible.
          </p>
        </div>

        {/* Info */}
        <div className="bg-neutral-50 rounded-xl p-4 text-sm text-muted-foreground text-center">
          Puedes volver a intentarlo en cualquier momento.
          Si experimentaste un error, comunícate con soporte.
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={() => router.push('/cart')} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Volver al carrito
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
