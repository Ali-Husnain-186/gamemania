import type { MetadataRoute } from 'next';
import { getApiUrl } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

type ProductRow = { slug: string };
type ApiEnvelope<T> = { success: boolean; data: T };

async function fetchProductSlugs(): Promise<string[]> {
  const base = getApiUrl();
  const slugs: string[] = [];
  let page = 1;

  while (page <= 50) {
    try {
      const res = await fetch(`${base}/products?limit=100&page=${page}&sort=newest`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = (await res.json()) as ApiEnvelope<ProductRow[]>;
      const items = Array.isArray(json.data) ? json.data : [];
      if (!items.length) break;
      for (const item of items) {
        if (item.slug) slugs.push(item.slug);
      }
      if (items.length < 100) break;
      page += 1;
    } catch {
      break;
    }
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    {
      url: absoluteUrl('/trade-in'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    {
      url: absoluteUrl('/contact'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    {
      url: absoluteUrl('/privacy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    {
      url: absoluteUrl('/returns'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: absoluteUrl('/shipping'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  const productSlugs = await fetchProductSlugs();
  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: absoluteUrl(`/products/${slug}`),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
