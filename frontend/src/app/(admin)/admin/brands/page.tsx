'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  _count?: { products: number };
};

const empty = { name: '', slug: '', description: '', logoUrl: '', isActive: true };

export default function AdminBrandsPage() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setRows(await apiGet<Brand[]>('/admin/brands'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load brands');
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

  function openEdit(b: Brand) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? '',
      logoUrl: b.logoUrl ?? '',
      isActive: b.isActive,
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
          logoUrl: form.logoUrl.trim() || null,
          isActive: form.isActive,
        };
        if (editingId) await apiPatch(`/admin/brands/${editingId}`, body);
        else await apiPost('/admin/brands', body);
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
        title="Brands"
        description="Add or edit brands used on product listings."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black"
          >
            New brand
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-[var(--admin-danger)]">{error}</p> : null}

      {showForm ? (
        <Panel className="mb-6 space-y-3 p-5">
          <p className="text-sm font-medium">{editingId ? 'Edit brand' : 'Create brand'}</p>
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
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
              Logo URL
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
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
            <label className="inline-flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
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
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                    {b.slug}
                  </td>
                  <td className="px-4 py-3">{b._count?.products ?? 0}</td>
                  <td className="px-4 py-3">{b.isActive ? 'Active' : 'Hidden'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-[var(--admin-accent)] hover:underline"
                      onClick={() => openEdit(b)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-[var(--admin-danger)] hover:underline"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`Delete brand “${b.name}”?`)) return;
                        startTransition(async () => {
                          try {
                            await apiDelete(`/admin/brands/${b.id}`);
                            await load();
                          } catch (err) {
                            setError(err instanceof ApiError ? err.message : 'Delete failed');
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
