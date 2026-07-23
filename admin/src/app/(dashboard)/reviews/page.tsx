'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/components/ui/page-shell';

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  status: string;
  product?: { name: string } | null;
  user?: { email: string } | null;
};

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer product reviews." />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--admin-muted)]">
                  No reviews
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.product?.name ?? '—'}</p>
                    <p className="text-xs text-[var(--admin-muted)]">{r.title ?? r.body}</p>
                  </td>
                  <td className="px-4 py-3 font-mono">{r.rating}/5</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{r.user?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                      value={r.status}
                      disabled={pending}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                    >
                      {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
