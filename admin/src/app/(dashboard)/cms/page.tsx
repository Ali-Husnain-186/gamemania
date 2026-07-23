'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/components/ui/page-shell';

type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
};

export default function CmsAdminPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', content: '', status: 'PUBLISHED' });
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setPages(await apiGet<CmsPage[]>('/admin/cms/pages'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load CMS pages');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ title: '', slug: '', content: '', status: 'PUBLISHED' });
  }

  function startEdit(p: CmsPage) {
    setCreating(false);
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, status: p.status });
  }

  function save() {
    startTransition(async () => {
      try {
        if (editing) {
          await apiPatch(`/admin/cms/pages/${editing.id}`, form);
        } else {
          await apiPost('/admin/cms/pages', form);
        }
        setEditing(null);
        setCreating(false);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="CMS"
        description="Manage About, FAQ, Contact and other content pages."
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black"
          >
            New page
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      {creating || editing ? (
        <Panel className="mb-6 space-y-3 p-5">
          <p className="text-sm font-medium">{editing ? `Edit ${editing.slug}` : 'Create page'}</p>
          <input
            className="w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <textarea
            className="min-h-40 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
          <select
            className="rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{p.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-sm text-[var(--admin-accent)] hover:underline"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
