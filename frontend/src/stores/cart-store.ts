import { create } from 'zustand';

type CartLine = { productId: string; quantity: number };

type CartState = {
  items: CartLine[];
  setItems: (items: CartLine[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}));
