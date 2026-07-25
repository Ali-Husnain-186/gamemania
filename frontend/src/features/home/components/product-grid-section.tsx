'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { Product } from '@/types/catalog';
import { MarketplaceProductCard } from './marketplace-product-card';
import { ProductSkeleton } from './product-skeleton';
import { SectionHeading } from './section-heading';

type ProductGridSectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  queryKey: string[];
  endpoint: string;
  viewAllHref?: string;
};

export function ProductGridSection({
  title,
  eyebrow,
  description,
  queryKey,
  endpoint,
  viewAllHref = '/shop',
}: ProductGridSectionProps) {
  const query = useQuery({
    queryKey,
    queryFn: () => apiGet<Product[]>(endpoint),
  });

  const products = query.data ?? [];

  return (
    <section className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        href={viewAllHref}
        linkLabel="View all"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {query.isLoading ? (
          <ProductSkeleton count={8} />
        ) : products.length === 0 ? (
          <p className="col-span-full text-sm text-[var(--gm-muted)]">
            Products will appear here once the catalog is loaded.
          </p>
        ) : (
          products
            .slice(0, 8)
            .map((p, i) => <MarketplaceProductCard key={p.id} product={p} index={i} />)
        )}
      </div>
    </section>
  );
}
