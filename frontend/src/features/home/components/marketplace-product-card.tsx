'use client';

import { ProductRetailCard } from '@/features/catalog/product-retail-card';
import type { Product } from '@/types/catalog';

type MarketplaceProductCardProps = {
  product: Product;
  index?: number;
};

/** Home grids — same CeX-layout retail card as shop. */
export function MarketplaceProductCard({ product, index = 0 }: MarketplaceProductCardProps) {
  return <ProductRetailCard product={product} index={index} />;
}
