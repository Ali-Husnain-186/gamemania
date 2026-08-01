'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/features/catalog/product-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { BrandLoader } from '@/components/ui/brand-loader';
import type { Category, Product } from '@/types/catalog';

const PLATFORMS = ['PS5', 'PS4', 'PS3', 'PS2', 'SWITCH', 'SWITCH2', 'XBOX_SERIES', 'PC', 'RETRO'];

const CONDITIONS = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'PRE_OWNED_GOOD', label: 'Used' },
] as const;

export function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const condition = searchParams.get('condition') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const inStock = searchParams.get('inStock') === 'true';
  const preorder = searchParams.get('preorder');
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const [draftQ, setDraftQ] = useState(q);
  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setDraftQ(q);
  }, [q]);

  useEffect(() => {
    setDraftMin(minPrice);
    setDraftMax(maxPrice);
  }, [minPrice, maxPrice]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (platform) params.set('platform', platform);
    if (condition) params.set('condition', condition);
    if (sort) params.set('sort', sort);
    if (inStock) params.set('inStock', 'true');
    if (preorder === 'true' || preorder === 'false') params.set('preorder', preorder);
    if (minPrice) params.set('minPrice', String(Math.round(Number(minPrice) * 100)));
    if (maxPrice) params.set('maxPrice', String(Math.round(Number(maxPrice) * 100)));
    params.set('limit', '48');
    return params.toString();
  }, [q, category, platform, condition, sort, inStock, preorder, minPrice, maxPrice]);

  const productsQuery = useQuery({
    queryKey: ['products', queryString],
    queryFn: () => apiGet<Product[]>(`/products?${queryString}`),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/categories'),
  });

  const hasActiveFilters = Boolean(
    q || category || platform || condition || inStock || preorder || minPrice || maxPrice,
  );

  function applyFilters(next: Record<string, string | boolean | undefined>) {
    const params = new URLSearchParams();
    const values = {
      q: next.q !== undefined ? String(next.q) : q,
      category: next.category !== undefined ? String(next.category) : category,
      platform: next.platform !== undefined ? String(next.platform) : platform,
      condition: next.condition !== undefined ? String(next.condition) : condition,
      sort: next.sort !== undefined ? String(next.sort) : sort,
      inStock: next.inStock !== undefined ? Boolean(next.inStock) : inStock,
      preorder: next.preorder !== undefined ? String(next.preorder) : preorder,
      minPrice: next.minPrice !== undefined ? String(next.minPrice) : minPrice,
      maxPrice: next.maxPrice !== undefined ? String(next.maxPrice) : maxPrice,
    };
    if (values.q) params.set('q', values.q);
    if (values.category) params.set('category', values.category);
    if (values.platform) params.set('platform', values.platform);
    if (values.condition) params.set('condition', values.condition);
    if (values.sort) params.set('sort', values.sort);
    if (values.inStock) params.set('inStock', 'true');
    if (values.preorder === 'true' || values.preorder === 'false') {
      params.set('preorder', values.preorder);
    }
    if (values.minPrice) params.set('minPrice', values.minPrice);
    if (values.maxPrice) params.set('maxPrice', values.maxPrice);
    router.push(`/shop?${params.toString()}`);
  }

  function clearAllFilters() {
    router.push('/shop');
    setDraftQ('');
    setDraftMin('');
    setDraftMax('');
  }

  const filterPanel = (
    <aside className="space-y-5 rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--gm-cyan)]">
          Filter
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            className="text-[10px] font-bold uppercase tracking-wide text-[var(--gm-yellow)]"
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        ) : null}
      </div>

      {!/game/i.test(category) ? (
        <div>
          <p className="mb-2 text-sm font-bold">Condition</p>
          <div className="space-y-1.5 text-sm text-[var(--gm-muted)]">
            {CONDITIONS.map((c) => (
              <label key={c.value || 'all'} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="condition"
                  checked={condition === c.value}
                  onChange={() => applyFilters({ condition: c.value })}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-bold">Availability</p>
        <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => applyFilters({ inStock: e.target.checked })}
          />
          In stock
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Pre-orders</p>
        <div className="space-y-1.5 text-sm text-[var(--gm-muted)]">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preorder"
              checked={preorder !== 'true' && preorder !== 'false'}
              onChange={() => applyFilters({ preorder: '' })}
            />
            All
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preorder"
              checked={preorder === 'true'}
              onChange={() => applyFilters({ preorder: 'true' })}
            />
            Pre-order only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preorder"
              checked={preorder === 'false'}
              onChange={() => applyFilters({ preorder: 'false' })}
            />
            Not pre-order
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Price (£)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={draftMin}
            onChange={(e) => setDraftMin(e.target.value)}
            className="w-full rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-1.5 text-sm"
          />
          <span className="text-[var(--gm-muted)]">–</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Max"
            value={draftMax}
            onChange={(e) => setDraftMax(e.target.value)}
            className="w-full rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          className="mt-2 text-xs font-bold text-[var(--gm-cyan)]"
          onClick={() => applyFilters({ minPrice: draftMin, maxPrice: draftMax })}
        >
          Apply price
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Category</p>
        <div className="max-h-56 space-y-1.5 overflow-y-auto text-sm text-[var(--gm-muted)]">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="category"
              checked={!category}
              onChange={() => applyFilters({ category: '' })}
            />
            All
          </label>
          {(categoriesQuery.data ?? []).map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                checked={category === c.slug}
                onChange={() => applyFilters({ category: c.slug })}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Platform</p>
        <div className="space-y-1.5 text-sm text-[var(--gm-muted)]">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="platform"
              checked={!platform}
              onChange={() => applyFilters({ platform: '' })}
            />
            All
          </label>
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input
                type="radio"
                name="platform"
                checked={platform === p}
                onChange={() => applyFilters({ platform: p })}
              />
              {p.replace('_', ' ')}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );

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

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-full border border-[var(--gm-border)] px-4 py-2 text-xs font-bold md:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? 'Hide filters' : 'Show filters'}
        </button>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => applyFilters({ sort: e.target.value })}
          className="ml-auto rounded-full border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-xs"
        >
          <option value="newest">Newest</option>
          <option value="release">Release date</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name_asc">Name</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>{filterPanel}</div>

        <div>
          {productsQuery.isLoading ? (
            <BrandLoader
              variant="page"
              size="md"
              label="Loading products…"
              className="!min-h-[40vh] !py-10"
            />
          ) : productsQuery.isError ? (
            <ErrorState
              message={
                productsQuery.error instanceof Error
                  ? productsQuery.error.message
                  : 'Could not load products. Please try again.'
              }
            />
          ) : !productsQuery.data?.length ? (
            <EmptyState
              title="No products found"
              description="Try Clear all filters, or another search."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productsQuery.data.map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
