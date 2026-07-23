'use client';

import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/components/ui/page-shell';

type Product = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  sku?: string;
  price?: number;
  pricePence?: number;
  stock?: number;
  stockQty?: number;
  quantity?: number;
  status?: string;
  condition?: string;
};

type ProductsPayload =
  | Product[]
  | {
      items?: Product[];
      products?: Product[];
      data?: Product[];
    };

function normalizeProducts(payload: ProductsPayload): Product[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.products ?? payload.data ?? [];
}

function productName(p: Product): string {
  return p.name ?? p.title ?? p.slug ?? p.id;
}

function productPrice(p: Product): string {
  const pence = p.pricePence ?? p.price;
  if (typeof pence !== 'number') return '—';
  return formatGbp(pence);
}

function productStock(p: Product): string {
  const qty = p.stockQty ?? p.stock ?? p.quantity;
  return typeof qty === 'number' ? String(qty) : '—';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        try {
          const data = await apiGet<ProductsPayload>('/admin/products');
          if (cancelled) return;
          setProducts(normalizeProducts(data));
          setSource('/admin/products');
        } catch (adminErr) {
          // Prefer admin catalog; fall back to public list when admin route is unavailable.
          if (
            adminErr instanceof ApiError &&
            (adminErr.status === 401 || adminErr.status === 403)
          ) {
            throw adminErr;
          }
          const data = await apiGet<ProductsPayload>('/products');
          if (cancelled) return;
          setProducts(normalizeProducts(data));
          setSource('/products');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load products.');
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Products"
        description={
          source ? `Loaded from ${source}` : 'Catalog listing from the admin products API.'
        }
      />

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading products…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-300">{error}</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--admin-border)]/70 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium">{productName(p)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                      {p.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">{productPrice(p)}</td>
                    <td className="px-4 py-3 font-mono">{productStock(p)}</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">
                      {p.status ?? p.condition ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
