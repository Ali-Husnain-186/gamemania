'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/features/catalog/product-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Category, Product } from '@/types/catalog';

export function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const [draftQ, setDraftQ] = useState(q);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    params.set('limit', '24');
    return params.toString();
  }, [q, category, sort]);

  const productsQuery = useQuery({
    queryKey: ['products', queryString],
    queryFn: () => apiGet<Product[]>(`/products?${queryString}`),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/categories'),
  });

  function applyFilters(next: { q?: string; category?: string; sort?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    if (nextQ) params.set('q', nextQ);
    if (nextCategory) params.set('category', nextCategory);
    if (nextSort) params.set('sort', nextSort);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 md:px-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="gm-display text-[1.75rem] font-bold sm:text-3xl md:text-4xl">Shop</h1>
          <p className="mt-2 text-sm text-[var(--gm-muted)] sm:text-base">
            Games, consoles, and gear — UK ready.
          </p>
        </div>
        <form
          className="flex w-full max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ q: draftQ.trim() });
          }}
        >
          <label className="sr-only" htmlFor="shop-q">
            Search products
          </label>
          <input
            id="shop-q"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Search titles…"
            className="min-h-11 w-full rounded-full border border-[var(--gm-cyan)]/30 bg-[var(--gm-bg-elevated)] px-4 py-2 text-sm outline-none transition focus:border-[var(--gm-cyan)] gm-focus"
          />
          <button type="submit" className="btn-cyan shrink-0 px-4 py-2 text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:mt-8 sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          onClick={() => applyFilters({ category: '' })}
          className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold ${
            !category
              ? 'border-[var(--gm-cyan)] bg-[rgba(1,166,194,0.12)] text-[var(--gm-cyan)]'
              : 'border-[var(--gm-border)] text-[var(--gm-muted)]'
          }`}
        >
          All
        </button>
        {(categoriesQuery.data ?? []).map((c: Category) => (
          <button
            key={c.id}
            type="button"
            onClick={() => applyFilters({ category: c.slug })}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold ${
              category === c.slug
                ? 'border-[var(--gm-cyan)] bg-[rgba(1,166,194,0.12)] text-[var(--gm-cyan)]'
                : 'border-[var(--gm-border)] text-[var(--gm-muted)]'
            }`}
          >
            {c.name}
          </button>
        ))}
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => applyFilters({ sort: e.target.value })}
          className="ml-auto shrink-0 rounded-full border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-xs"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name_asc">Name</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      <div className="mt-6 sm:mt-8">
        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-xl bg-[var(--gm-bg-elevated)]"
              />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <ErrorState
            message={
              productsQuery.error instanceof Error
                ? productsQuery.error.message
                : 'Could not load products. Please try again.'
            }
          />
        ) : !productsQuery.data?.length ? (
          <EmptyState title="No products found" description="Try another search or category." />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productsQuery.data.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
