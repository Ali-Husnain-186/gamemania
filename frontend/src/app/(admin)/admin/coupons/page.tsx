'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
};

const emptyForm = {
  code: '',
  type: 'PERCENTAGE' as CouponType,
  value: 10,
  minOrderAmount: 0,
  maxDiscount: '' as number | '',
  usageLimit: '' as number | '',
  perUserLimit: 1,
  startsAt: '',
  endsAt: '',
  isActive: true,
};

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setCoupons(await apiGet<Coupon[]>('/admin/coupons'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load coupons');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount ?? 0,
      maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '',
      perUserLimit: c.perUserLimit,
      startsAt: toDateInput(c.startsAt),
      endsAt: toDateInput(c.endsAt),
      isActive: c.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function save() {
    startTransition(async () => {
      try {
        setMessage(null);
        setError(null);
        const payload = {
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
          maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
          usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
          perUserLimit: Number(form.perUserLimit),
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
          isActive: form.isActive,
        };
        if (editingId) {
          await apiPatch(`/admin/coupons/${editingId}`, payload);
          setMessage('Coupon updated');
        } else {
          await apiPost('/admin/coupons', payload);
          setMessage('Coupon created');
        }
        resetForm();
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  function remove(c: Coupon) {
    if (!window.confirm(`Deactivate/delete coupon ${c.code}?`)) return;
    startTransition(async () => {
      try {
        setMessage(null);
        await apiDelete(`/admin/coupons/${c.id}`);
        setMessage('Coupon removed / deactivated');
        if (editingId === c.id) resetForm();
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Delete failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Create and manage checkout discount codes (percentage, fixed amount, or free shipping)."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-300">{message}</p> : null}

      <Panel className="mb-6 p-5">
        <p className="mb-3 text-sm font-medium">{editingId ? 'Edit coupon' : 'New coupon'}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs text-[var(--admin-muted)]">
            Code
            <input
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm uppercase"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Type
            <select
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount (pence)</option>
              <option value="FREE_SHIPPING">Free shipping</option>
            </select>
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Value{' '}
            {form.type === 'PERCENTAGE'
              ? '(%)'
              : form.type === 'FIXED_AMOUNT'
                ? '(pence)'
                : '(ignored)'}
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Min order (pence)
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))}
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Max discount (pence, blank = none)
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
              value={form.maxDiscount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxDiscount: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Usage limit (blank = unlimited)
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
              value={form.usageLimit}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  usageLimit: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Per-user limit
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
              value={form.perUserLimit}
              onChange={(e) => setForm((f) => ({ ...f, perUserLimit: Number(e.target.value) }))}
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Starts
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Ends
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {pending ? 'Saving…' : editingId ? 'Update coupon' : 'Create coupon'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Min</th>
                <th className="px-3 py-3">Usage</th>
                <th className="px-3 py-3">Active</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-[var(--admin-border)]/70">
                  <td className="px-3 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-3 py-3 text-xs">{c.type}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {c.type === 'PERCENTAGE'
                      ? `${c.value}%`
                      : c.type === 'FIXED_AMOUNT'
                        ? formatGbp(c.value)
                        : 'Free ship'}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {c.minOrderAmount ? formatGbp(c.minOrderAmount) : '—'}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-3 py-3 text-xs">{c.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-xs text-[var(--admin-accent)] hover:underline"
                      onClick={() => startEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[var(--admin-danger)] hover:underline"
                      onClick={() => remove(c)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!coupons.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--admin-muted)]">
                    No coupons yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
