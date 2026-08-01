import type { Metadata } from 'next';
import { CmsPageView } from '@/features/cms/cms-page-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'How GameMania UK collects, uses and protects your personal information.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return <CmsPageView slug="privacy" fallbackTitle="Privacy Policy" />;
}
