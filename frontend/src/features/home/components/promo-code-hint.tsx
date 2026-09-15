'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { DEFAULT_PROMO_BANNER, normalizePromoBanner } from '@/features/home/promo-banner-content';

export function PromoCodeHint({ className }: { className?: string }) {
  const [text, setText] = useState(`Code ${DEFAULT_PROMO_BANNER.code} · online offer`);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiGet<{ value: unknown }>('/settings/promo.banner');
        const promo = normalizePromoBanner(row.value);
        if (!promo.enabled) {
          setText('');
          return;
        }
        setText(`Code ${promo.code} · ${promo.title}`);
      } catch {
        /* keep default */
      }
    })();
  }, []);

  if (!text) return null;
  return <p className={className}>{text}</p>;
}
