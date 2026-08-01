import type { Metadata } from 'next';
import { CmsPageView } from '@/features/cms/cms-page-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping Policy',
  description: 'UK delivery and shipping information for GameMania UK.',
  path: '/shipping',
});

export default function ShippingPage() {
  return <CmsPageView slug="shipping" fallbackTitle="Shipping Policy" />;
}
