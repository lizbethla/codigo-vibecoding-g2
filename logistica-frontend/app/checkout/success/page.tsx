'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

interface OrderItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
}

interface Order {
  id: number;
  status: string;
  amount_usd: number;
  items: OrderItem[];
  created_at: string;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-muted-foreground">Confirmando tu pago…</p>
      </div>
    </div>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Poll up to 3 times for COMPLETED order (webhook may be in flight)
    let attempts = 0;
    const maxAttempts = 3;

    async function pollOrder() {
      try {
        const { data } = await api.get('/payments/orders/');
        const results: Order[] = data.results ?? [];
        const completed = results.find((o) => o.status === 'COMPLETED');
        if (completed) {
          setOrder(completed);
          setLoading(false);
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollOrder, 2000);
        } else {
          // Show most recent order even if still PENDING
          setOrder(results[0] ?? null);
          setLoading(false);
        }
      } catch {
        setError(true);
        setLoading(false);
      }
    }

    pollOrder();
  }, [isAuthenticated, router]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8 w-full max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h1 className="text-xl font-semibold">Pago recibido</h1>
          <p className="text-sm text-muted-foreground">
            No pudimos verificar el estado en este momento. Si pagaste, recibirás confirmación por email de Stripe.
          </p>
          <Button onClick={() => router.push('/cart')} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la tienda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡Pago exitoso!</h1>
          {sessionId && (
            <p className="text-xs text-muted-foreground font-mono break-all">
              Sesión: {sessionId}
            </p>
          )}
        </div>

        {/* Order summary */}
        {order && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Orden #{order.id}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  order.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.status === 'COMPLETED' ? 'Confirmado' : 'Pendiente'}
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.product_sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">
                      ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-semibold">Total pagado</span>
              <span className="text-lg font-bold tabular-nums">${order.amount_usd.toFixed(2)} USD</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={() => router.push('/cart')} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Seguir comprando
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
