'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import type { Product } from '@/types/catalog';
import { SectionHeading } from './section-heading';

function formatRelease(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PreorderReleasesSection() {
  const query = useQuery({
    queryKey: ['products', 'preorders-home'],
    queryFn: () => apiGet<Product[]>('/products?preorder=true&sort=release&limit=8'),
  });

  const products = query.data ?? [];

  return (
    <section className="border-y border-[var(--gm-cyan)]/20 bg-[var(--gm-bg-elevated)]/50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Featured offers"
            title="New releases & pre-orders"
            description="Upcoming titles and fresh stock — reserve yours early."
          />
          <Link
            href="/shop?preorder=true&sort=release"
            className="text-sm font-bold text-[var(--gm-cyan)] hover:text-[var(--gm-yellow)]"
          >
            View all →
          </Link>
        </div>

        {query.isLoading ? (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 w-40 shrink-0 animate-pulse rounded-xl bg-[var(--gm-bg)] sm:w-44"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--gm-cyan)]/30 bg-black/20 px-6 py-10 text-center">
            <p className="gm-display text-xl text-[var(--gm-yellow)]">Pre-orders coming soon</p>
            <p className="mt-2 text-sm text-[var(--gm-muted)]">
              Mark products as pre-order in admin to show them here.
            </p>
            <Link href="/shop?sort=newest" className="btn-primary mt-6 inline-flex">
              Browse new arrivals
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {products.map((p) => {
              const image = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
              const release = formatRelease(p.releaseDate as string | null | undefined);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group w-40 shrink-0 sm:w-44"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)]">
                    {image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 rounded bg-[var(--gm-magenta)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                      Pre-order
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
                    {p.platform ?? p.brand?.name ?? 'Game'}
                  </p>
                  <h3 className="line-clamp-2 text-sm font-bold group-hover:text-[var(--gm-yellow)]">
                    {p.name}
                  </h3>
                  {release ? (
                    <p className="mt-1 text-[11px] text-[var(--gm-muted)]">● Release: {release}</p>
                  ) : null}
                  <p className="mt-1 font-semibold text-[var(--gm-accent)]">{formatGBP(p.price)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
