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
    <section className="border-b border-[var(--gm-cyan)]/25 bg-[linear-gradient(180deg,rgba(1,166,194,0.1),transparent)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 px-3 py-5 sm:gap-3 sm:px-6 sm:py-6 md:grid-cols-3 lg:grid-cols-5 lg:py-8">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[var(--gm-cyan)]/20 bg-[var(--gm-bg-elevated)]/80 p-3.5 shadow-sm backdrop-blur-md transition hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_10px_28px_rgba(1,166,194,0.16)] sm:p-4"
          >
            <item.icon className="h-5 w-5 text-[var(--gm-cyan)] sm:h-6 sm:w-6" aria-hidden />
            <p className="mt-2.5 text-xs font-extrabold sm:mt-3 sm:text-sm">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--gm-muted)] sm:text-xs">
              {item.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
