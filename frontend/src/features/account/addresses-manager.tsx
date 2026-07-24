'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';

type Address = {
  id: string;
  label?: string | null;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
};

type AddressForm = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  phone: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  postcode: '',
  phone: '',
  isDefault: false,
};

export function AddressesManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiGet<Address[]>('/users/me/addresses'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        fullName: form.fullName.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        phone: form.phone.trim() || undefined,
        isDefault: form.isDefault,
        country: 'GB',
      };
      if (editingId) {
        return apiPatch<Address>(`/users/me/addresses/${editingId}`, body);
      }
      return apiPost<Address>('/users/me/addresses', body);
    },
    onSuccess: async () => {
      setForm(emptyForm);
      setEditingId(null);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Could not save address');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/users/me/addresses/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      postcode: address.postcode,
      phone: address.phone ?? '',
      isDefault: address.isDefault,
    });
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  return (
    <div>
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Addresses</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">
        Saved shipping addresses for faster checkout.
      </p>

      {listQuery.isLoading ? (
        <div
          className="mt-8 h-24 animate-pulse rounded-xl bg-[var(--gm-border)]"
          aria-busy="true"
        />
      ) : listQuery.isError ? (
        <div className="mt-8">
          <ErrorState
            title="Could not load addresses"
            message={
              listQuery.error instanceof Error ? listQuery.error.message : 'Something went wrong.'
            }
            onRetry={() => void listQuery.refetch()}
          />
        </div>
      ) : !listQuery.data?.length ? (
        <div className="mt-8">
          <EmptyState
            title="No addresses yet"
            description="Add a UK shipping address to place orders."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {listQuery.data.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border-2 border-[var(--gm-border)] bg-black/40 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-bold">
                    {a.fullName}
                    {a.isDefault ? (
                      <span className="ml-2 text-xs uppercase text-[var(--gm-cyan)]">Default</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[var(--gm-muted)]">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}
                    <br />
                    {a.city}, {a.postcode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="text-xs font-bold uppercase text-[var(--gm-cyan)] gm-focus rounded-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(a.id)}
                    className="text-xs font-bold uppercase text-[var(--gm-magenta)] gm-focus rounded-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-10 space-y-4 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <h2 className="gm-display text-xl text-[var(--gm-cyan)]">
          {editingId ? 'Edit address' : 'Add address'}
        </h2>

        {(
          [
            ['fullName', 'Full name', 'name'],
            ['line1', 'Address line 1', 'address-line1'],
            ['line2', 'Address line 2', 'address-line2'],
            ['city', 'City', 'address-level2'],
            ['postcode', 'Postcode', 'postal-code'],
            ['phone', 'Phone', 'tel'],
          ] as const
        ).map(([key, label, autoComplete]) => (
          <label key={key} className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
              {label}
            </span>
            <input
              autoComplete={autoComplete}
              required={key !== 'line2' && key !== 'phone'}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
            />
          </label>
        ))}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          />
          Set as default shipping address
        </label>

        {formError ? (
          <p className="text-sm text-[var(--gm-danger)]" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary px-4 py-2 text-xs"
          >
            {saveMutation.isPending ? 'Saving…' : editingId ? 'Update address' : 'Save address'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn-cyan-outline px-4 py-2 text-xs"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
