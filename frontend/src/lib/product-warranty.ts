import type { Product } from '@/types/catalog';

export type ProductWarrantyDisplay = {
  /** Show warranty badge on product cards */
  show: boolean;
  /** Short badge label, e.g. "12-mo warranty" */
  label: string;
  /** PDP trust block text; null = leave blank / hide */
  detail: string | null;
};

type ProductLike = Pick<Product, 'name' | 'category'>;

function categorySlug(product: ProductLike): string {
  return product.category?.slug?.toLowerCase() ?? '';
}

function categoryName(product: ProductLike): string {
  return product.category?.name?.toLowerCase() ?? '';
}

function isConsole(product: ProductLike): boolean {
  const slug = categorySlug(product);
  const name = categoryName(product);
  return slug.includes('console') || name.includes('console');
}

function isController(product: ProductLike): boolean {
  const slug = categorySlug(product);
  const name = categoryName(product);
  const title = product.name.toLowerCase();
  return (
    slug.includes('controller') ||
    name.includes('controller') ||
    /controller|dualsense|dualshock|joy-?con/i.test(title)
  );
}

function isVideoGame(product: ProductLike): boolean {
  const slug = categorySlug(product);
  const name = categoryName(product);
  if (isConsole(product) || isController(product)) return false;
  if (slug.includes('-games') || slug === 'video-games') return true;
  if (name.includes('game') && !name.includes('console') && !name.includes('controller')) {
    return true;
  }
  return false;
}

/** Warranty copy by product type (games: none; consoles/controllers: 12 months). */
export function getProductWarranty(product: ProductLike): ProductWarrantyDisplay {
  if (isConsole(product) || isController(product)) {
    return {
      show: true,
      label: '12-mo warranty',
      detail: '12 months',
    };
  }

  if (isVideoGame(product)) {
    return { show: false, label: '', detail: null };
  }

  return { show: false, label: '', detail: null };
}
