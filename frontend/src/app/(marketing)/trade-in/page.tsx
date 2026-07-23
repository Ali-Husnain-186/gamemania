'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';

type TradeOption = {
  id: string;
  storage: string;
  condition: string;
  baseCashPence: number;
  baseCreditPence: number;
};

type TradeModel = {
  id: string;
  name: string;
  slug: string;
  options: TradeOption[];
};

type TradeDevice = {
  id: string;
  name: string;
  slug: string;
  models: TradeModel[];
};

type TradeConsole = {
  id: string;
  name: string;
  slug: string;
  devices: TradeDevice[];
};

type Quote = { cashPence: number; creditPence: number; modelOptionId: string };

export default function TradeInPage() {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const [consoleId, setConsoleId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [modelId, setModelId] = useState('');
  const [optionId, setOptionId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'STORE_CREDIT'>('STORE_CREDIT');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const treeQuery = useQuery({
    queryKey: ['trade-consoles'],
    queryFn: () => apiGet<TradeConsole[]>('/trade-in/consoles'),
    retry: false,
  });

  const devices = useMemo(
    () => treeQuery.data?.find((c) => c.id === consoleId)?.devices ?? [],
    [treeQuery.data, consoleId],
  );
  const models = useMemo(
    () => devices.find((d) => d.id === deviceId)?.models ?? [],
    [devices, deviceId],
  );
  const options = useMemo(
    () => models.find((m) => m.id === modelId)?.options ?? [],
    [models, modelId],
  );

  const quoteMutation = useMutation({
    mutationFn: () => apiPost<Quote>('/trade-in/quote', { modelOptionId: optionId }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiPost('/trade-in/requests', {
        modelOptionId: optionId,
        payoutMethod,
      }),
    onSuccess: () => setStatusMsg('Trade-in request submitted. Track status in Account soon.'),
    onError: (e) => setStatusMsg(e instanceof Error ? e.message : 'Submit failed'),
  });

  if (treeQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <h1 className="gm-display text-3xl font-bold">Trade-In</h1>
        <div className="mt-8">
          <ErrorState message="Trade-in API is coming online. Wizard will unlock automatically." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="gm-display text-3xl font-bold md:text-4xl">Trade-In</h1>
      <p className="mt-3 max-w-xl text-[var(--gm-muted)]">
        Select your device for an instant cash or store-credit quote.
      </p>

      {treeQuery.isLoading ? (
        <p className="mt-10 text-sm text-[var(--gm-muted)]">Loading trade catalog…</p>
      ) : (
        <div className="mt-10 space-y-4">
          <Select
            label="Console"
            value={consoleId}
            onChange={(v) => {
              setConsoleId(v);
              setDeviceId('');
              setModelId('');
              setOptionId('');
            }}
            options={(treeQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Device"
            value={deviceId}
            onChange={(v) => {
              setDeviceId(v);
              setModelId('');
              setOptionId('');
            }}
            options={devices.map((d) => ({ value: d.id, label: d.name }))}
            disabled={!consoleId}
          />
          <Select
            label="Model"
            value={modelId}
            onChange={(v) => {
              setModelId(v);
              setOptionId('');
            }}
            options={models.map((m) => ({ value: m.id, label: m.name }))}
            disabled={!deviceId}
          />
          <Select
            label="Storage / condition"
            value={optionId}
            onChange={setOptionId}
            options={options.map((o) => ({
              value: o.id,
              label: `${o.storage} · ${o.condition.replaceAll('_', ' ')}`,
            }))}
            disabled={!modelId}
          />

          <button
            type="button"
            disabled={!optionId || quoteMutation.isPending}
            onClick={() => quoteMutation.mutate()}
            className="rounded-md bg-[var(--gm-accent)] px-5 py-2.5 text-sm font-semibold text-[#042016] disabled:opacity-50"
          >
            Get quote
          </button>

          {quoteMutation.data ? (
            <div className="rounded-lg border border-[var(--gm-border)] p-4">
              <p className="text-sm text-[var(--gm-muted)]">Estimated payout</p>
              <p className="mt-2 text-lg font-semibold">
                Cash {formatGBP(quoteMutation.data.cashPence)} · Credit{' '}
                {formatGBP(quoteMutation.data.creditPence)}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={payoutMethod === 'STORE_CREDIT'}
                    onChange={() => setPayoutMethod('STORE_CREDIT')}
                  />
                  Store credit
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={payoutMethod === 'CASH'}
                    onChange={() => setPayoutMethod('CASH')}
                  />
                  Cash
                </label>
              </div>
              <button
                type="button"
                disabled={!token || submitMutation.isPending}
                onClick={() => {
                  if (!token) {
                    window.location.href = '/login';
                    return;
                  }
                  submitMutation.mutate();
                }}
                className="mt-4 rounded-md border border-[var(--gm-accent)] px-4 py-2 text-sm font-semibold text-[var(--gm-accent)] disabled:opacity-50"
              >
                {token ? 'Submit trade-in request' : 'Sign in to submit'}
              </button>
            </div>
          ) : null}
          {statusMsg ? <p className="text-sm text-[var(--gm-muted)]">{statusMsg}</p> : null}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">{label}</span>
      <select
        disabled={disabled || options.length === 0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
