'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, PackageCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';

const items = [
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    body: 'Encrypted checkout you can trust.',
  },
  {
    icon: Truck,
    title: 'Free UK Delivery',
    body: 'On orders over £60.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    body: 'Hassle-free support when you need it.',
  },
  {
    icon: BadgeCheck,
    title: 'Genuine Products',
    body: 'Authentic games & hardware only.',
  },
  {
    icon: PackageCheck,
    title: 'Trade-In & Save',
    body: 'Cash or credit for your old gear.',
  },
];

export function TrustBar() {
  return (
    <section className="border-b border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/40">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 md:grid-cols-3 lg:grid-cols-5 lg:py-8">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[var(--gm-border)] bg-black/25 p-4 shadow-sm backdrop-blur-md transition hover:border-[var(--gm-cyan)]/60 hover:shadow-[0_10px_28px_rgba(0,181,226,0.12)]"
          >
            <item.icon className="h-6 w-6 text-[var(--gm-cyan)]" aria-hidden />
            <p className="mt-3 text-sm font-extrabold">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--gm-muted)]">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
