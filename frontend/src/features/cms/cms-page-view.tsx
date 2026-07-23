'use client';

import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';

type Page = {
  title: string;
  slug: string;
  content: string;
};

export function CmsPageView({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setPage(await apiGet<Page>(`/cms/pages/${slug}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Page unavailable');
      }
    })();
  }, [slug]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-[var(--gm-ink)]">{page?.title ?? fallbackTitle}</h1>
      {error ? (
        <p className="mt-6 text-sm text-red-700">{error}</p>
      ) : (
        <div className="mt-8 whitespace-pre-wrap text-[var(--gm-muted)] leading-relaxed">
          {page?.content ?? 'Loading…'}
        </div>
      )}
    </main>
  );
}
