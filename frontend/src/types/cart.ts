export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  stock?: number;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  lineTotal: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
  subtotalPence: number;
  itemCount: number;
};
