import type { Metadata } from 'next';
import { CmsPageView } from '@/features/cms/cms-page-view';
import { apiGet } from '@/lib/api';
import { buildPageMetadata, truncateMeta } from '@/lib/seo';

type CmsPage = {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await apiGet<CmsPage>('/cms/pages/contact');
    return buildPageMetadata({
      title: page.metaTitle?.trim() || page.title || 'Contact',
      description:
        page.metaDescription?.trim() ||
        truncateMeta(page.content) ||
        'Contact GAME MANIA UK for orders, trade-ins, shipping and support.',
      path: '/contact',
    });
  } catch {
    return buildPageMetadata({
      title: 'Contact',
      description: 'Contact GAME MANIA UK for orders, trade-ins, shipping and support.',
      path: '/contact',
    });
  }
}

export default function ContactPage() {
  return <CmsPageView slug="contact" fallbackTitle="Contact" />;
}
