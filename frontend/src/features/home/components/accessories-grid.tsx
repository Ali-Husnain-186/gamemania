'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cable, Gamepad2, Headphones, Sofa, Zap } from 'lucide-react';
import { SectionHeading } from './section-heading';

const items = [
  {
    title: 'Controllers',
    href: '/shop?q=controller',
    icon: Gamepad2,
    tone: 'text-[var(--gm-cyan)]',
  },
  {
    title: 'Headsets',
    href: '/shop?q=headset',
    icon: Headphones,
    tone: 'text-[var(--gm-magenta)]',
  },
  { title: 'Charging Docks', href: '/shop?q=dock', icon: Zap, tone: 'text-[var(--gm-yellow)]' },
  { title: 'Gaming Chairs', href: '/shop?q=chair', icon: Sofa, tone: 'text-[var(--gm-cyan)]' },
  { title: 'Cables', href: '/shop?q=cable', icon: Cable, tone: 'text-[var(--gm-magenta)]' },
];

export function AccessoriesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Gear up"
        title="Gaming accessories"
        description="Controllers, audio, docks and more to level up your setup."
        href="/shop?q=accessories"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Link
              href={item.href}
              className="flex h-full flex-col items-start rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/70 p-5 transition hover:border-[var(--gm-cyan)]/70 hover:bg-black/30 gm-focus"
            >
              <item.icon className={`h-7 w-7 ${item.tone}`} aria-hidden />
              <h3 className="mt-4 text-sm font-extrabold">{item.title}</h3>
              <span className="mt-2 text-xs font-bold text-[var(--gm-muted)]">Shop now →</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
