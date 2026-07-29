'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { notify } from '@/lib/toast';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

const empty = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  sortOrder: '0',
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setRows(await apiGet<Category[]>('/admin/categories'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load categories');
      notify.error(err instanceof ApiError ? err.message : 'Failed to load categories');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
      sortOrder: String(c.sortOrder ?? 0),
      isActive: c.isActive,
    });
    setShowForm(true);
  }

  function save() {
    startTransition(async () => {
      try {
        setError(null);
        const body = {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          sortOrder: Number(form.sortOrder || '0'),
          isActive: form.isActive,
        };
        if (editingId) await apiPatch(`/admin/categories/${editingId}`, body);
        else await apiPost('/admin/categories', body);
        setShowForm(false);
        notify.success(editingId ? 'Category updated' : 'Category created');
        await load();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Save failed';
        setError(message);
        notify.error(message);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage storefront categories (PlayStation, Nintendo, etc.). Changes show on home and shop."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black"
          >
            New category
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-[var(--admin-danger)]">{error}</p> : null}

      {showForm ? (
        <Panel className="mb-6 space-y-3 p-5">
          <p className="text-sm font-medium">{editingId ? 'Edit category' : 'Create category'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[var(--admin-muted)]">
              Name
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Slug (optional)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto from name"
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
              Image URL
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="/brand/playstation.png"
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
              Description
              <textarea
                rows={2}
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Sort order
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </label>
            <label className="inline-flex items-center gap-2 self-end text-xs text-[var(--admin-muted)]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active on storefront
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !form.name.trim()}
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3">{c.isActive ? 'Active' : 'Hidden'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-[var(--admin-accent)] hover:underline"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-[var(--admin-danger)] hover:underline"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`Delete category “${c.name}”?`)) return;
                        startTransition(async () => {
                          try {
                            await apiDelete(`/admin/categories/${c.id}`);
                            notify.success('Category deleted');
                            await load();
                          } catch (err) {
                            const message = err instanceof ApiError ? err.message : 'Delete failed';
                            setError(message);
                            notify.error(message);
                          }
                        });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
