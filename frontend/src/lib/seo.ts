import type { Metadata } from 'next';

export const SITE_NAME = 'GameMania UK';
export const SITE_TAGLINE = 'Trade.Play.Repeat';
export const SITE_TITLE = `${SITE_NAME} / ${SITE_TAGLINE}`;
export const DEFAULT_DESCRIPTION =
  'Buy games, consoles and accessories in the UK. Trade in for store credit or cash. Free UK shipping on orders £60+. Genuine products with a 3-month warranty.';

export const DEFAULT_OG_IMAGE = '/brand/hero-banner-hd.jpg';

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamemaniaauk.co.uk').trim();
  return raw.replace(/\/$/, '') || 'https://gamemaniaauk.co.uk';
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncateMeta(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: 'website' | 'article';
  keywords?: string[];
  /** Skip "%s | GAMEMANIA UK" template (use for homepage). */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  noIndex = false,
  type = 'website',
  keywords,
  absoluteTitle = false,
}: BuildPageMetadataInput): Metadata {
  const desc = truncateMeta(description);
  const url = absoluteUrl(path);
  const ogImage = image?.trim() || DEFAULT_OG_IMAGE;
  const displayTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type,
      locale: 'en_GB',
      url,
      siteName: SITE_NAME,
      title: displayTitle,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: desc,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: ['GameMania', 'GAME MANIA', 'GAMEMANIA UK'],
    url,
    logo: absoluteUrl('/brand/game-mania-logo.png'),
    sameAs: ['https://www.instagram.com/gamemaniastore'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      areaServed: 'GB',
      availableLanguage: 'English',
      url: absoluteUrl('/contact'),
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/shop')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

type ProductLike = {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  sku?: string;
  brand?: { name: string } | null;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  stock?: number;
  condition?: string | null;
};

export function productJsonLd(product: ProductLike) {
  const primary =
    product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? undefined;
  const description =
    product.shortDescription || product.description || `${product.name} available at ${SITE_NAME}`;
  const availability =
    (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const conditionMap: Record<string, string> = {
    NEW: 'https://schema.org/NewCondition',
    PRE_OWNED_EXCELLENT: 'https://schema.org/UsedCondition',
    PRE_OWNED_GOOD: 'https://schema.org/UsedCondition',
    PRE_OWNED_FAIR: 'https://schema.org/UsedCondition',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncateMeta(description, 5000),
    sku: product.sku,
    brand: product.brand?.name
      ? { '@type': 'Brand', name: product.brand.name }
      : { '@type': 'Brand', name: SITE_NAME },
    image: primary ? [primary] : [absoluteUrl(DEFAULT_OG_IMAGE)],
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.condition && conditionMap[product.condition]
      ? { itemCondition: conditionMap[product.condition] }
      : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: 'GBP',
      price: (product.price / 100).toFixed(2),
      availability,
      itemCondition:
        product.condition && conditionMap[product.condition]
          ? conditionMap[product.condition]
          : 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
