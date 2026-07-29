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
    const page = await apiGet<CmsPage>('/cms/pages/about');
    return buildPageMetadata({
      title: page.metaTitle?.trim() || page.title || 'About GAME MANIA',
      description:
        page.metaDescription?.trim() ||
        truncateMeta(page.content) ||
        'Learn about GAME MANIA UK — built by gamers, for gamers. Games, consoles, accessories and trade-ins.',
      path: '/about',
    });
  } catch {
    return buildPageMetadata({
      title: 'About GAME MANIA',
      description:
        'Learn about GAME MANIA UK — built by gamers, for gamers. Games, consoles, accessories and trade-ins.',
      path: '/about',
    });
  }
}

export default function AboutPage() {
  return <CmsPageView slug="about" fallbackTitle="About GAME MANIA" />;
}
