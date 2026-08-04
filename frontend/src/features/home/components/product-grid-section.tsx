'use client';

import { useQueries } from '@tanstack/react-query';
import { BrandLoader } from '@/components/ui/brand-loader';
import { apiGet } from '@/lib/api';
import type { Product } from '@/types/catalog';
import { MarketplaceProductCard } from './marketplace-product-card';
import { SectionHeading } from './section-heading';

type ProductGridSectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  queryKey: string[];
  /** One or more catalog endpoints (merged in order, de-duplicated). */
  endpoints: string | string[];
  viewAllHref?: string;
  /** How many cards to show (default 16). */
  maxItems?: number;
  /** Extra class on the section wrapper */
  className?: string;
};

function mergeProducts(lists: Product[][], maxItems: number): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const list of lists) {
    for (const p of list) {
      if (!p?.id || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= maxItems) return out;
    }
  }
  return out;
}

export function ProductGridSection({
  title,
  eyebrow,
  description,
  queryKey,
  endpoints,
  viewAllHref = '/shop',
  maxItems = 16,
  className,
}: ProductGridSectionProps) {
  const paths = Array.isArray(endpoints) ? endpoints : [endpoints];

  const queries = useQueries({
    queries: paths.map((endpoint, i) => ({
      queryKey: [...queryKey, endpoint, i],
      queryFn: () => apiGet<Product[]>(endpoint),
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const products = mergeProducts(
    queries.map((q) => (Array.isArray(q.data) ? q.data : [])),
    maxItems,
  );

  return (
    <section className={className ?? 'mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-14 md:py-16'}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        href={viewAllHref}
        linkLabel="View all"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full">
            <BrandLoader
              variant="page"
              size="sm"
              label="Loading products…"
              className="!min-h-[28vh] !py-8"
            />
          </div>
        ) : products.length === 0 ? (
          <p className="col-span-full text-sm text-[var(--gm-muted)]">
            Products will appear here once the catalog is loaded.
          </p>
        ) : (
          products.map((p, i) => <MarketplaceProductCard key={p.id} product={p} index={i} />)
        )}
      </div>
    </section>
  );
}
