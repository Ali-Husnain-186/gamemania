'use client';

import { ProductRetailCard } from '@/features/catalog/product-retail-card';
import type { Product } from '@/types/catalog';

type ProductCardProps = {
  product: Product;
  index?: number;
};

/** Shop grid card — CeX-layout retail card. */
export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return <ProductRetailCard product={product} index={index} />;
}
