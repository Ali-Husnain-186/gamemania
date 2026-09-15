export type PromoBannerContent = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  code: string;
  blurb: string;
  ctaLabel: string;
  ctaHref: string;
};

export const DEFAULT_PROMO_BANNER: PromoBannerContent = {
  enabled: true,
  eyebrow: 'Limited offer',
  title: '10% OFF Your First Order',
  code: 'GAMEMANIA10',
  blurb: 'Use code {code} at checkout.',
  ctaLabel: 'Shop the Sale',
  ctaHref: '/shop',
};

export function normalizePromoBanner(raw: unknown): PromoBannerContent {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROMO_BANNER;
  const value = raw as Record<string, unknown>;
  return {
    enabled: value.enabled !== false,
    eyebrow: String(value.eyebrow ?? DEFAULT_PROMO_BANNER.eyebrow),
    title: String(value.title ?? DEFAULT_PROMO_BANNER.title),
    code:
      String(value.code ?? DEFAULT_PROMO_BANNER.code)
        .trim()
        .toUpperCase() || DEFAULT_PROMO_BANNER.code,
    blurb: String(value.blurb ?? DEFAULT_PROMO_BANNER.blurb),
    ctaLabel: String(value.ctaLabel ?? DEFAULT_PROMO_BANNER.ctaLabel),
    ctaHref: String(value.ctaHref ?? DEFAULT_PROMO_BANNER.ctaHref) || '/shop',
  };
}

export function formatPromoBlurb(blurb: string, code: string) {
  return blurb.includes('{code}') ? blurb.replaceAll('{code}', code) : `${blurb}`.trim();
}
