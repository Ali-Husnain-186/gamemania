import type { Product } from '@/types/catalog';

/** Platform/brand art when a product has no gallery. */
export function brandFallbackImage(product: {
  platform?: string | null;
  brand?: { slug?: string | null } | null;
}): string {
  const p = (product.platform ?? '').toUpperCase();
  const brand = (product.brand?.slug ?? '').toLowerCase();
  if (p.includes('PS') || brand === 'sony') return '/brand/playstation.png';
  if (p.includes('SWITCH') || brand === 'nintendo') return '/brand/nintendo.png';
  if (p.includes('XBOX') || brand === 'microsoft') return '/brand/pcgames.png';
  return '/brand/pcgames.png';
}

export function getProductPrimaryImage(product: Product): {
  url: string;
  alt: string;
} {
  const img = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  if (img?.url) {
    return {
      url: img.url,
      alt: img.altText ?? img.alt ?? product.name,
    };
  }
  return {
    url: brandFallbackImage(product),
    alt: product.name,
  };
}
