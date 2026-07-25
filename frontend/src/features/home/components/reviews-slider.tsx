'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { SectionHeading } from './section-heading';

type FeaturedReview = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  user?: { firstName?: string | null; lastName?: string | null } | null;
  product?: { name: string; slug: string } | null;
};

function displayName(r: FeaturedReview) {
  const first = r.user?.firstName?.trim();
  const last = r.user?.lastName?.trim();
  if (first && last) return `${first} ${last[0]}.`;
  if (first) return first;
  return 'Verified buyer';
}

function initials(r: FeaturedReview) {
  const first = r.user?.firstName?.[0] ?? 'G';
  const last = r.user?.lastName?.[0] ?? 'M';
  return `${first}${last}`.toUpperCase();
}

export function ReviewsSlider() {
  const [index, setIndex] = useState(0);

  const query = useQuery({
    queryKey: ['reviews', 'featured'],
    queryFn: () => apiGet<FeaturedReview[]>('/reviews/featured?limit=8'),
  });

  const reviews = query.data ?? [];

  useEffect(() => {
    if (reviews.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % reviews.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reviews.length]);

  useEffect(() => {
    if (index >= reviews.length) setIndex(0);
  }, [index, reviews.length]);

  const review = reviews[index];

  return (
    <section className="border-y border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)]/35">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-16">
        <SectionHeading
          eyebrow="Reviews"
          title="Customer love"
          description="Verified feedback from gamers across the UK."
        />

        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--gm-cyan)]/25 bg-black/30 p-5 shadow-lg backdrop-blur-md sm:rounded-3xl sm:p-10">
          {query.isLoading ? (
            <div className="space-y-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-20 w-full animate-pulse rounded bg-white/10" />
            </div>
          ) : !review ? (
            <p className="text-sm text-[var(--gm-muted)]">
              Customer reviews will appear here once approved by the team.
            </p>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={review.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gm-magenta)] text-sm font-extrabold text-white">
                      {initials(review)}
                    </div>
                    <div>
                      <p className="font-extrabold">{displayName(review)}</p>
                      <p className="text-xs text-[var(--gm-muted)]">
                        {review.product?.name ?? 'GAME MANIA purchase'}
                      </p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--gm-cyan)]/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified purchase
                    </span>
                  </div>

                  <div className="mt-4 flex gap-1 text-[var(--gm-yellow)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'opacity-30'}`}
                      />
                    ))}
                  </div>

                  {review.title ? (
                    <p className="mt-3 text-sm font-bold text-[var(--gm-cyan)]">{review.title}</p>
                  ) : null}

                  <p className="mt-2 text-base leading-relaxed text-white/90 sm:text-lg">
                    “{review.body}”
                  </p>
                </motion.blockquote>
              </AnimatePresence>

              {reviews.length > 1 ? (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    {reviews.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        aria-label={`Review ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === index ? 'w-7 bg-[var(--gm-yellow)]' : 'w-2.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Previous review"
                      onClick={() => setIndex((i) => (i - 1 + reviews.length) % reviews.length)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next review"
                      onClick={() => setIndex((i) => (i + 1) % reviews.length)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
