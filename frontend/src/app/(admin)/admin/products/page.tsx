'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: string;
  stock?: number;
  categoryId?: string | null;
  brandId?: string | null;
};

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  quantity: '0',
  status: 'ACTIVE',
  categoryId: '',
  brandId: '',
  imageUrl: '',
  shortDescription: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, cats, brs] = await Promise.all([
        apiGet<Product[]>('/admin/products?limit=100'),
        apiGet<Category[]>('/categories'),
        apiGet<Brand[]>('/brands'),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: String(p.price),
      quantity: String(p.stock ?? 0),
      status: p.status,
      categoryId: p.categoryId ?? '',
      brandId: p.brandId ?? '',
      imageUrl: '',
      shortDescription: '',
    });
    setShowForm(true);
  }

  function save() {
    startTransition(async () => {
      try {
        setError(null);
        const body = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          sku: form.sku.trim(),
          price: Math.round(Number(form.price)),
          quantity: Math.round(Number(form.quantity) || 0),
          status: form.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK',
          categoryId: form.categoryId || null,
          brandId: form.brandId || null,
          shortDescription: form.shortDescription || undefined,
          imageUrl: form.imageUrl || undefined,
        };
        if (editingId) {
          await apiPatch(`/admin/products/${editingId}`, body);
        } else {
          await apiPost('/admin/products', body);
        }
        setShowForm(false);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Create and edit catalog items (price in pence)."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black"
          >
            New product
          </button>
        }
      />

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      {showForm ? (
        <Panel className="mb-6 p-5">
          <p className="mb-4 text-sm font-medium">
            {editingId ? 'Edit product' : 'Create product'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['name', 'Name'],
                ['slug', 'Slug'],
                ['sku', 'SKU'],
                ['price', 'Price (pence)'],
                ['quantity', 'Stock qty'],
                ['imageUrl', 'Image URL'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-[var(--admin-muted)]">
                {label}
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-[var(--admin-fg)]"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="block text-xs text-[var(--admin-muted)]">
              Status
              <select
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Category
              <select
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Brand
              <select
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.brandId}
                onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--admin-border)]/70 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatGbp(p.price)}</td>
                    <td className="px-4 py-3 font-mono">{p.stock ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">{p.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-sm text-[var(--admin-accent)] hover:underline"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
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
