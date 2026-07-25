'use client';

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      return;
    }
    setStatus('ok');
    setEmail('');
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl border border-[var(--gm-border)] bg-[linear-gradient(135deg,rgba(0,181,226,0.16),rgba(229,26,99,0.14),rgba(255,209,0,0.1))] p-6 sm:p-10"
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)]">
            Newsletter
          </p>
          <h2 className="gm-display mt-2 text-3xl text-[var(--gm-yellow)] sm:text-4xl">
            Stay Updated
          </h2>
          <p className="mt-3 text-sm text-[var(--gm-muted)] sm:text-base">
            Receive exclusive deals, gaming news, and early access to offers.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus('idle');
              }}
              placeholder="you@email.com"
              className="w-full rounded-full border border-[var(--gm-border)] bg-black/35 px-4 py-3 text-sm outline-none ring-[var(--gm-yellow)] transition focus:ring-2"
              required
            />
            <button type="submit" className="btn-primary px-6 py-3 text-sm whitespace-nowrap">
              Subscribe
            </button>
          </form>

          {status === 'ok' ? (
            <p className="mt-3 text-sm font-semibold text-[var(--gm-cyan)]">
              You’re on the list — thanks for joining.
            </p>
          ) : null}
          {status === 'error' ? (
            <p className="mt-3 text-sm font-semibold text-[var(--gm-danger)]">
              Enter a valid email address.
            </p>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
