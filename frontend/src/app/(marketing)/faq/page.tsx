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
    const page = await apiGet<CmsPage>('/cms/pages/faq');
    return buildPageMetadata({
      title: page.metaTitle?.trim() || page.title || 'FAQs',
      description:
        page.metaDescription?.trim() ||
        truncateMeta(page.content) ||
        'Frequently asked questions about shopping, shipping, returns and trade-ins at GAME MANIA UK.',
      path: '/faq',
    });
  } catch {
    return buildPageMetadata({
      title: 'FAQs',
      description:
        'Frequently asked questions about shopping, shipping, returns and trade-ins at GAME MANIA UK.',
      path: '/faq',
    });
  }
}

export default function FaqPage() {
  return <CmsPageView slug="faq" fallbackTitle="FAQ" />;
}
