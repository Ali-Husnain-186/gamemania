import type { Metadata } from 'next';
import { CmsPageView } from '@/features/cms/cms-page-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Returns Policy',
  description: 'Returns information for GameMania UK orders.',
  path: '/returns',
});

export default function ReturnsPage() {
  return <CmsPageView slug="returns" fallbackTitle="Returns Policy" />;
}
