'use client';

import {
  ProductRetailCard,
  type ProductRetailCardProps,
} from '@/features/catalog/product-retail-card';

/** Home grids — same CeX-layout retail card as shop. Pass any display overrides. */
export function MarketplaceProductCard(props: ProductRetailCardProps) {
  return <ProductRetailCard {...props} />;
}

export type { ProductRetailCardProps as MarketplaceProductCardProps };
