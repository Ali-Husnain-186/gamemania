'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { SectionHeading } from './section-heading';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
};

const fallbackPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Best PlayStation deals this month',
    slug: 'best-playstation-deals',
    excerpt: 'Top PS5 picks and accessories worth grabbing right now.',
    coverImageUrl: '/brand/hero-banner-hd.jpg',
    publishedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'How trade-ins work at GAME MANIA',
    slug: 'how-trade-ins-work',
    excerpt: 'Get cash or store credit for games and consoles in a few steps.',
    coverImageUrl: '/brand/hero-trade-in.jpg',
    publishedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Must-have gaming accessories for 2026',
    slug: 'must-have-accessories',
    excerpt: 'Controllers, headsets and docks that upgrade every setup.',
    coverImageUrl: '/brand/hero-accessories.jpg',
    publishedAt: new Date().toISOString(),
  },
];

export function LatestBlogs() {
  const query = useQuery({
    queryKey: ['blog', 'home'],
    queryFn: () => apiGet<BlogPost[]>('/blog'),
    retry: false,
  });

  const posts = (query.data?.length ? query.data : fallbackPosts).slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="News"
        title="Latest blogs"
        description="Deals, guides and gaming news from the GAME MANIA team."
        href="/shop"
        linkLabel="Browse shop"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/70 transition hover:-translate-y-1 hover:border-[var(--gm-cyan)]/60"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={post.coverImageUrl || '/brand/hero-slide-1.jpg'}
                alt={post.title}
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gm-cyan)]">
                Gaming news
              </p>
              <h3 className="mt-2 line-clamp-2 text-base font-extrabold">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--gm-muted)]">
                {post.excerpt || 'Read the latest from GAME MANIA.'}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <time className="text-xs text-[var(--gm-muted)]">
                  {post.publishedAt ? formatDate(post.publishedAt) : 'Recently'}
                </time>
                <Link
                  href={`/shop`}
                  className="text-xs font-bold text-[var(--gm-yellow)] hover:underline"
                >
                  Read more →
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
