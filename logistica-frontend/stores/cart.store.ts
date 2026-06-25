import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  stock_quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: {
    id: number;
    name: string;
    sku: string;
    unit_price: string;
    stock_quantity: number;
  }) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clear: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stock_quantity) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                unit_price: parseFloat(product.unit_price),
                quantity: 1,
                stock_quantity: product.stock_quantity,
              },
            ],
          };
        });
      },

      removeItem: (product_id) => {
        set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) }));
      },

      updateQuantity: (product_id, quantity) => {
        if (quantity < 1) {
          get().removeItem(product_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === product_id
              ? { ...i, quantity: Math.min(quantity, i.stock_quantity) }
              : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'logistica-cart' },
  ),
);
