import { create } from 'zustand';
import type { Cart, CartItem } from '@/types/cart';

type CartState = {
  items: CartItem[];
  cartId?: string;
  subtotalPence: number;
  setCart: (cart: Cart) => void;
  setItems: (items: CartItem[]) => void;
  clear: () => void;
  itemCount: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartId: undefined,
  subtotalPence: 0,
  setCart: (cart) =>
    set({
      items: cart.items ?? [],
      cartId: cart.id,
      subtotalPence: cart.subtotalPence ?? 0,
    }),
  setItems: (items) =>
    set({
      items,
      subtotalPence: items.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0),
    }),
  clear: () => set({ items: [], cartId: undefined, subtotalPence: 0 }),
  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
