import type { Metadata } from 'next';
import { CmsPageView } from '@/features/cms/cms-page-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms & Conditions',
  description: 'Terms & Conditions for shopping and trade-ins at GameMania UK.',
  path: '/terms',
});

export default function TermsPage() {
  return <CmsPageView slug="terms" fallbackTitle="Terms & Conditions" />;
}
