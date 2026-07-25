'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { apiDelete, apiGet, apiPatch, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt?: string;
  product?: { id: string; name: string; slug: string } | null;
  user?: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | (typeof STATUSES)[number]>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', rating: 5 });
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setReviews(await apiGet<Review[]>('/admin/reviews'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reviews');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return reviews;
    return reviews.filter((r) => r.status === filter);
  }, [reviews, filter]);

  const counts = useMemo(() => {
    return {
      ALL: reviews.length,
      PENDING: reviews.filter((r) => r.status === 'PENDING').length,
      APPROVED: reviews.filter((r) => r.status === 'APPROVED').length,
      REJECTED: reviews.filter((r) => r.status === 'REJECTED').length,
    };
  }, [reviews]);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      try {
        await apiPatch(`/admin/reviews/${id}`, { status });
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Update failed');
      }
    });
  }

  function startEdit(r: Review) {
    setEditingId(r.id);
    setEditForm({
      title: r.title ?? '',
      body: r.body ?? '',
      rating: r.rating,
    });
  }

  function saveEdit() {
    if (!editingId) return;
    startTransition(async () => {
      try {
        await apiPatch(`/admin/reviews/${editingId}`, {
          title: editForm.title.trim() || null,
          body: editForm.body.trim() || null,
          rating: editForm.rating,
        });
        setEditingId(null);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm('Delete this review permanently?')) return;
    startTransition(async () => {
      try {
        await apiDelete(`/admin/reviews/${id}`);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Delete failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Approve, edit, reject or delete customer product reviews. Approved reviews appear on the homepage."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['ALL', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s
                ? 'bg-[var(--admin-accent)] text-black'
                : 'border border-[var(--admin-border)] text-[var(--admin-muted)]'
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                <th className="px-4 py-3 font-medium">Product / Review</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--admin-muted)]">
                    No reviews in this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium">{r.product?.name ?? '—'}</p>
                      {editingId === r.id ? (
                        <div className="mt-2 space-y-2">
                          <input
                            className="w-full rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Title"
                          />
                          <textarea
                            rows={3}
                            className="w-full rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                            value={editForm.body}
                            onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))}
                            placeholder="Review body"
                          />
                          <label className="block text-[11px] text-[var(--admin-muted)]">
                            Rating
                            <select
                              className="mt-1 w-full rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1"
                              value={editForm.rating}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  rating: Number(e.target.value),
                                }))
                              }
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n}/5
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-xs font-semibold text-[var(--admin-accent)]">
                            {r.title || 'Untitled'}
                          </p>
                          <p className="mt-1 max-w-md text-xs text-[var(--admin-muted)]">
                            {r.body || '—'}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono">{r.rating}/5</td>
                    <td className="px-4 py-3 align-top text-[var(--admin-muted)]">
                      <p>
                        {[r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs">{r.user?.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                        value={r.status}
                        disabled={pending}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {editingId === r.id ? (
                          <>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={saveEdit}
                              className="text-xs font-semibold text-[var(--admin-accent)] hover:underline"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-xs text-[var(--admin-muted)] hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="text-xs font-semibold text-[var(--admin-accent)] hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {r.status !== 'APPROVED' ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setStatus(r.id, 'APPROVED')}
                            className="text-xs font-semibold text-emerald-300 hover:underline"
                          >
                            Approve
                          </button>
                        ) : null}
                        {r.status !== 'REJECTED' ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setStatus(r.id, 'REJECTED')}
                            className="text-xs font-semibold text-amber-300 hover:underline"
                          >
                            Reject
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => remove(r.id)}
                          className="text-xs font-semibold text-red-300 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
