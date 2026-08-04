'use client';

import {
  ProductRetailCard,
  type ProductRetailCardProps,
} from '@/features/catalog/product-retail-card';

/** Shop grid card — CeX-layout retail card. Pass product + any display overrides. */
export function ProductCard(props: ProductRetailCardProps) {
  return <ProductRetailCard {...props} />;
}

export type { ProductRetailCardProps as ProductCardProps };
