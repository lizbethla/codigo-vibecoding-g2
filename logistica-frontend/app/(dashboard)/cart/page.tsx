'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Search,
  PackageX,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCartStore } from '@/stores/cart.store';
import api from '@/lib/api';
import type { ProductCategory } from '@/docs/schemas';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductListItem {
  id: number;
  sku: string;
  name: string;
  category: ProductCategory;
  unit_price: string;
  stock_quantity: number;
  is_active: boolean;
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductListItem[];
}

interface CheckoutResponse {
  order_id: number;
  checkout_url: string;
  session_id: string;
  amount_usd: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  LAPTOP: 'Portátil',
  DESKTOP: 'Escritorio',
  MOBILE: 'Móvil',
  TABLET: 'Tableta',
  PERIPHERAL: 'Periférico',
  NETWORKING: 'Redes',
  STORAGE: 'Almacenamiento',
  OTHER: 'Otro',
};

const CATEGORY_BADGE: Record<ProductCategory, string> = {
  LAPTOP: 'bg-indigo-100 text-indigo-700',
  DESKTOP: 'bg-blue-100 text-blue-700',
  MOBILE: 'bg-green-100 text-green-700',
  TABLET: 'bg-yellow-100 text-yellow-700',
  PERIPHERAL: 'bg-orange-100 text-orange-700',
  NETWORKING: 'bg-purple-100 text-purple-700',
  STORAGE: 'bg-gray-100 text-gray-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

const PAGE_SIZE = 12;

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductListItem }) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const cartItem = items.find((i) => i.product_id === product.id);
  const inCart = !!cartItem;
  const outOfStock = product.stock_quantity === 0;
  const atMax = inCart && cartItem.quantity >= product.stock_quantity;

  return (
    <Card className="flex flex-col gap-0 py-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Category stripe */}
      <div className={`h-1 w-full ${CATEGORY_BADGE[product.category].split(' ')[0]}`} />

      <CardContent className="flex flex-col flex-1 p-4 gap-3">
        {/* Top: badge + name */}
        <div className="space-y-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[product.category]}`}
          >
            {CATEGORY_LABELS[product.category]}
          </span>
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
        </div>

        {/* Price + stock */}
        <div className="flex items-center justify-between mt-auto">
          <p className="text-lg font-bold text-foreground tabular-nums">
            ${parseFloat(product.unit_price).toFixed(2)}
          </p>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              outOfStock
                ? 'bg-red-100 text-red-600'
                : product.stock_quantity <= 5
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
            }`}
          >
            {outOfStock ? 'Sin stock' : `${product.stock_quantity} uds.`}
          </span>
        </div>

        {/* Cart controls */}
        {outOfStock ? (
          <Button variant="outline" size="sm" disabled className="w-full">
            Sin stock
          </Button>
        ) : inCart ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="flex-1 text-center text-sm font-semibold tabular-nums">
              {cartItem.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
              disabled={atMax}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => addItem(product)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CartPanel ───────────────────────────────────────────────────────────────

function CartPanel({ onCheckout, isCheckingOut, checkoutError }: {
  onCheckout: () => void;
  isCheckingOut: boolean;
  checkoutError: string | null;
}) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Tu carrito está vacío</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Agrega productos para continuar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Item list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.map((item) => (
          <div key={item.product_id} className="flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ${item.unit_price.toFixed(2)} × {item.quantity} ={' '}
                <span className="font-semibold text-foreground">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-semibold tabular-nums w-5 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock_quantity}
                  className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-xl font-bold tabular-nums">${total.toFixed(2)} USD</span>
        </div>

        {checkoutError && (
          <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{checkoutError}</p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={isCheckingOut || items.length === 0}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar con Stripe
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Pago seguro procesado por Stripe
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const getCount = useCartStore((s) => s.getCount);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const cartCount = getCount();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [category]);

  // Products query
  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ['cart-products', { search, category, page }],
    queryFn: () =>
      api
        .get('/products/', {
          params: {
            page,
            page_size: PAGE_SIZE,
            is_active: true,
            search: search || undefined,
            category: category !== 'ALL' ? category : undefined,
            ordering: 'name',
          },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  // Checkout mutation
  const checkoutMutation = useMutation<CheckoutResponse, { response?: { status: number; data?: { detail?: string } } }>({
    mutationFn: () =>
      api
        .post('/payments/checkout/', {
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      sessionStorage.setItem('stripe_session_id', data.session_id);
      sessionStorage.setItem('order_id', String(data.order_id));
      clear();
      window.location.href = data.checkout_url;
    },
    onError: (err) => {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 404) {
        setCheckoutError('Uno o más productos no están disponibles.');
      } else if (status === 401) {
        setCheckoutError('Sesión expirada. Recarga la página e intenta de nuevo.');
      } else if (status === 422) {
        setCheckoutError('Algunos productos no están disponibles para pago en línea.');
      } else {
        setCheckoutError(detail ?? 'Error al procesar el pago. Intenta de nuevo.');
      }
    },
  });

  const handleCheckout = () => {
    setCheckoutError(null);
    checkoutMutation.mutate();
  };

  const products = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tienda</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecciona productos y paga con Stripe
          </p>
        </div>

        {/* Mobile cart trigger */}
        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden relative shrink-0">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold tabular-nums">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
            <SheetHeader className="pb-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {cartCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {cartCount}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden py-4">
              <CartPanel
                onCheckout={() => { setCartSheetOpen(false); handleCheckout(); }}
                isCheckingOut={checkoutMutation.isPending}
                checkoutError={checkoutError}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">
        {/* Products section */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o SKU…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las categorías</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {!isLoading && !isError && (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? 'Sin resultados'
                : `${totalCount} producto${totalCount !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-muted-foreground">Error al cargar productos</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <PackageX className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sin productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {page} de {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pageCount || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop cart sidebar */}
        <div className="hidden lg:block w-80 xl:w-96 shrink-0">
          <div className="sticky top-6 bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              <h2 className="text-base font-semibold">Carrito</h2>
              {cartCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
                </Badge>
              )}
            </div>
            <CartPanel
              onCheckout={handleCheckout}
              isCheckingOut={checkoutMutation.isPending}
              checkoutError={checkoutError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
