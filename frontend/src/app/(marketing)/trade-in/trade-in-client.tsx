'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { notify } from '@/lib/toast';
import { ErrorState } from '@/components/shared/error-state';
import { BrandLoader } from '@/components/ui/brand-loader';

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

const STEPS = [
  {
    n: '01',
    title: 'Get your quote',
    body: 'Pick console, model and condition for an instant cash and store-credit offer.',
  },
  {
    n: '02',
    title: 'Create an account',
    body: 'Sign up so we can apply store credit to your balance or arrange a cash transfer.',
  },
  {
    n: '03',
    title: 'Send it in',
    body: 'We confirm receipt, test and grade your device honestly — no surprise deductions.',
  },
  {
    n: '04',
    title: 'Get paid',
    body: 'Store credit lands on your GameMania UK account. Cash is sent by manual bank transfer.',
  },
] as const;

export function TradeInClient() {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const [mode, setMode] = useState<'listed' | 'manual'>('listed');
  const [consoleId, setConsoleId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [modelId, setModelId] = useState('');
  const [optionId, setOptionId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'STORE_CREDIT'>('STORE_CREDIT');
  const [manualCategory, setManualCategory] = useState('Laptop');
  const [manualDescription, setManualDescription] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankSortCode, setBankSortCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [requestRef, setRequestRef] = useState<string | null>(null);

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
  const options = useMemo(() => {
    const raw = models.find((m) => m.id === modelId)?.options ?? [];
    const seen = new Set<string>();
    return raw.filter((o) => {
      const key = `${o.storage}::${o.condition}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [models, modelId]);

  const quoteMutation = useMutation({
    mutationFn: () => apiPost<Quote>('/trade-in/quote', { modelOptionId: optionId }),
    onSuccess: () => notify.success('Quote ready'),
    onError: (e) => notify.error(e instanceof Error ? e.message : 'Could not get quote'),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiPost<{ requestNumber?: string }>('/trade-in/requests', {
        ...(mode === 'manual'
          ? {
              isManual: true,
              manualCategory,
              manualDescription,
            }
          : { modelOptionId: optionId }),
        payoutMethod,
        ...(payoutMethod === 'CASH' ? { bankAccountName, bankSortCode, bankAccountNumber } : {}),
      }),
    onSuccess: (data) => {
      setRequestRef(data.requestNumber ?? null);
      setStatusMsg(
        mode === 'manual'
          ? 'Manual request submitted. Our team will review and send a quote.'
          : payoutMethod === 'STORE_CREDIT'
            ? 'Request submitted. Once we mark it PAID, store credit is applied to your account.'
            : 'Request submitted. Once approved, cash is sent by manual bank transfer to the details you provided.',
      );
      notify.success('Trade-in request submitted');
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Submit failed';
      setStatusMsg(message);
      notify.error(message);
    },
  });

  if (treeQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Trade-In</h1>
        <div className="mt-8">
          <ErrorState message="Trade-in catalog is unavailable right now. Please try again shortly." />
        </div>
      </div>
    );
  }

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 gm-halftone opacity-30" />

      <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-12 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--gm-cyan)]"
          >
            Sell · Trade · Play
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="gm-display mt-3 text-5xl leading-none text-white md:text-6xl"
          >
            Sell your console for a <span className="text-[var(--gm-yellow)]">fair price</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-xl text-[var(--gm-muted)]"
          >
            Instant quote for cash or boosted store credit. Credit is applied to your GameMania UK
            account when we mark the trade-in as paid. Cash payouts are sent manually by bank
            transfer after approval.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#quote" className="btn-primary">
              Get your quote
            </a>
            <Link href="/register" className="btn-cyan-outline">
              Create account
            </Link>
          </motion.div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:max-w-md">
            {[
              ['Boosted', 'Store credit'],
              ['Manual', 'Cash transfer'],
              ['Honest', 'Grading'],
            ].map(([a, b]) => (
              <div
                key={a}
                className="rounded-2xl border-2 border-[var(--gm-border)] bg-black/50 px-2 py-3"
              >
                <p className="gm-display text-lg text-[var(--gm-yellow)]">{a}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--gm-muted)]">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16, delay: 0.1 }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 scale-110 rounded-full bg-[var(--gm-cyan)]/30 blur-3xl"
            />
            <Image
              src="/brand/game-mania-logo-nav.png"
              alt="GameMania"
              width={320}
              height={320}
              priority
              className="h-56 w-56 object-contain sm:h-72 sm:w-72"
            />
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-14 md:px-6">
        <h2 className="gm-display text-3xl text-[var(--gm-magenta)]">How it works</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--gm-muted)]">
          Inspired by the best UK trade flows — quote, send, test, pay — with GameMania UK credit or
          cash transfer.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5"
            >
              <p className="text-xs font-bold text-[var(--gm-cyan)]">
                {step.n} / {step.title.split(' ')[0].toUpperCase()}
              </p>
              <h3 className="gm-display mt-2 text-xl text-[var(--gm-yellow)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--gm-muted)]">{step.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 sm:p-6">
          <h3 className="gm-display text-2xl text-[var(--gm-cyan)]">Condition grades</h3>
          <p className="mt-2 text-sm text-[var(--gm-muted)]">
            Pick the grade that best matches your item — it affects your quote.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <span className="font-bold text-[var(--gm-yellow)]">Excellent</span> — looks nearly
              new, fully working, minimal cosmetic marks, includes required accessories.
            </li>
            <li>
              <span className="font-bold text-[var(--gm-yellow)]">Good</span> — fully working with
              light wear (scuffs/scratches) that don’t affect play.
            </li>
            <li>
              <span className="font-bold text-[var(--gm-yellow)]">Fair</span> — fully working but
              heavier cosmetic wear; may have missing non-essential accessories.
            </li>
          </ul>
        </div>
      </section>

      <section id="quote" className="relative mx-auto max-w-3xl px-4 pb-20 md:px-6">
        <div className="rounded-3xl border-2 border-[var(--gm-cyan)] bg-black/70 p-6 sm:p-8">
          <h2 className="gm-display text-3xl text-[var(--gm-yellow)]">Get your quote</h2>
          <p className="mt-2 text-sm text-[var(--gm-muted)]">
            Store credit is usually higher than cash — spend it across the shop.
          </p>

          {treeQuery.isLoading ? (
            <div className="mt-8">
              <BrandLoader variant="inline" size="sm" label="Loading trade catalog…" />
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode('listed')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                    mode === 'listed'
                      ? 'bg-[var(--gm-yellow)] text-black'
                      : 'border border-[var(--gm-border)] text-[var(--gm-muted)]'
                  }`}
                >
                  Consoles listed
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                    mode === 'manual'
                      ? 'bg-[var(--gm-magenta)] text-white'
                      : 'border border-[var(--gm-border)] text-[var(--gm-muted)]'
                  }`}
                >
                  Not listed (laptop / phone / other)
                </button>
              </div>

              {mode === 'listed' ? (
                <>
                  <Select
                    label="Your console family"
                    value={consoleId}
                    onChange={(v) => {
                      setConsoleId(v);
                      setDeviceId('');
                      setModelId('');
                      setOptionId('');
                      quoteMutation.reset();
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
                      quoteMutation.reset();
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
                      quoteMutation.reset();
                    }}
                    options={models.map((m) => ({ value: m.id, label: m.name }))}
                    disabled={!deviceId}
                  />
                  <Select
                    label="Storage / condition"
                    value={optionId}
                    onChange={(v) => {
                      setOptionId(v);
                      quoteMutation.reset();
                    }}
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
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {quoteMutation.isPending ? 'Calculating…' : 'Lock this price'}
                  </button>
                </>
              ) : (
                <>
                  <Select
                    label="Category"
                    value={manualCategory}
                    onChange={setManualCategory}
                    options={[
                      { value: 'Laptop', label: 'Laptop' },
                      { value: 'Mobile phone', label: 'Mobile phone' },
                      { value: 'Tablet', label: 'Tablet' },
                      { value: 'Other electronics', label: 'Other electronics' },
                    ]}
                  />
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
                      Describe your item
                    </span>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      rows={4}
                      placeholder="Brand, model, condition, accessories included…"
                      className="mt-1 w-full rounded-xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm"
                    />
                  </label>
                  <p className="text-xs text-[var(--gm-muted)]">
                    Not-listed items need a manual quote from our team after you submit.
                  </p>
                </>
              )}

              {mode === 'manual' || quoteMutation.data ? (
                <div className="space-y-4 rounded-2xl border-2 border-[var(--gm-magenta)] bg-[var(--gm-bg-elevated)] p-5">
                  {quoteMutation.data ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setPayoutMethod('STORE_CREDIT')}
                        className={`rounded-2xl border-2 p-4 text-left transition ${
                          payoutMethod === 'STORE_CREDIT'
                            ? 'border-[var(--gm-yellow)] bg-[var(--gm-yellow)]/10'
                            : 'border-[var(--gm-border)]'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase text-[var(--gm-yellow)]">
                          Store credit
                        </p>
                        <p className="gm-display mt-1 text-3xl text-white">
                          {formatGBP(quoteMutation.data.creditPence)}
                        </p>
                        <p className="mt-2 text-xs text-[var(--gm-muted)]">
                          Applied to your account after we mark the trade-in as paid.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutMethod('CASH')}
                        className={`rounded-2xl border-2 p-4 text-left transition ${
                          payoutMethod === 'CASH'
                            ? 'border-[var(--gm-cyan)] bg-[var(--gm-cyan)]/10'
                            : 'border-[var(--gm-border)]'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase text-[var(--gm-cyan)]">Cash</p>
                        <p className="gm-display mt-1 text-3xl text-white">
                          {formatGBP(quoteMutation.data.cashPence)}
                        </p>
                        <p className="mt-2 text-xs text-[var(--gm-muted)]">
                          Paid by manual bank transfer after grading & approval.
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          checked={payoutMethod === 'STORE_CREDIT'}
                          onChange={() => setPayoutMethod('STORE_CREDIT')}
                        />
                        Store credit
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          checked={payoutMethod === 'CASH'}
                          onChange={() => setPayoutMethod('CASH')}
                        />
                        Cash (bank transfer)
                      </label>
                    </div>
                  )}

                  {payoutMethod === 'CASH' ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block sm:col-span-3">
                        <span className="text-xs font-bold uppercase text-[var(--gm-muted)]">
                          Account name
                        </span>
                        <input
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[var(--gm-border)] bg-black/30 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold uppercase text-[var(--gm-muted)]">
                          Sort code
                        </span>
                        <input
                          value={bankSortCode}
                          onChange={(e) => setBankSortCode(e.target.value)}
                          placeholder="00-00-00"
                          className="mt-1 w-full rounded-lg border border-[var(--gm-border)] bg-black/30 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs font-bold uppercase text-[var(--gm-muted)]">
                          Account number
                        </span>
                        <input
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[var(--gm-border)] bg-black/30 px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                  ) : null}

                  {!token ? (
                    <p className="rounded-xl border border-[var(--gm-yellow)]/40 bg-[var(--gm-yellow)]/10 px-4 py-3 text-sm text-[var(--gm-yellow)]">
                      Create a free account so we can attach credit to you, or so we know where to
                      send cash.{' '}
                      <Link href="/register" className="font-bold underline">
                        Register
                      </Link>{' '}
                      /{' '}
                      <Link href="/login" className="font-bold underline">
                        Sign in
                      </Link>
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      !token ||
                      submitMutation.isPending ||
                      (mode === 'listed' && !quoteMutation.data) ||
                      (mode === 'manual' && !manualDescription.trim())
                    }
                    onClick={() => {
                      if (!token) {
                        window.location.href = '/register';
                        return;
                      }
                      submitMutation.mutate();
                    }}
                    className="btn-magenta w-full disabled:opacity-50"
                  >
                    {token
                      ? submitMutation.isPending
                        ? 'Submitting…'
                        : 'Submit trade-in request'
                      : 'Create account to continue'}
                  </button>
                </div>
              ) : null}

              {statusMsg ? (
                <p className="text-sm text-[var(--gm-cyan)]" role="status">
                  {statusMsg}
                  {requestRef ? ` Ref: ${requestRef}` : null}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-2xl border-2 border-dashed border-[var(--gm-magenta)] bg-white/5 p-5 text-center">
          <p className="gm-display text-xl text-[var(--gm-yellow)]">From your order insert</p>
          <p className="mt-2 text-sm text-[var(--gm-muted)]">
            Scan the flyer QR → shop online → unlock benefits. Use{' '}
            <span className="rounded bg-[var(--gm-magenta)] px-2 py-0.5 font-bold text-white">
              GAMEMANIA10
            </span>{' '}
            for 10% off.
          </p>
        </div>
      </section>
    </main>
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
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
        {label}
      </span>
      <select
        disabled={disabled || options.length === 0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
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
