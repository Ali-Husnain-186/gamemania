'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Gift, Lock, RefreshCcw, Repeat2, Truck } from 'lucide-react';
import { SectionHeading } from './section-heading';

const cards = [
  {
    icon: BadgeCheck,
    title: 'Genuine Products',
    body: 'Authentic titles and hardware from trusted sources.',
  },
  {
    icon: Truck,
    title: 'Fast UK Delivery',
    body: 'Quick dispatch with free shipping on orders £60+.',
  },
  {
    icon: Lock,
    title: 'Secure Checkout',
    body: 'Protected payments and encrypted customer data.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    body: 'Straightforward returns if something isn’t right.',
  },
  {
    icon: Gift,
    title: 'Reward Points',
    body: 'Earn value back when you shop and trade in.',
  },
  {
    icon: Repeat2,
    title: 'Trade-In Program',
    body: 'Turn old games and consoles into cash or credit.',
  },
];

export function WhyChoose() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Trust"
        title="Why choose GAME MANIA"
        description="Built for gamers who want quality stock, fair prices and a smooth experience."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[var(--gm-border)] bg-gradient-to-br from-white/[0.04] to-transparent p-5 shadow-sm backdrop-blur-sm transition hover:border-[var(--gm-yellow)]/50"
          >
            <card.icon className="h-6 w-6 text-[var(--gm-yellow)]" aria-hidden />
            <h3 className="mt-4 text-base font-extrabold">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--gm-muted)]">{card.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
