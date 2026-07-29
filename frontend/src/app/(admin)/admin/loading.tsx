import { BrandLoader } from '@/components/ui/brand-loader';

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)]">
      <BrandLoader variant="inline" size="md" label="Loading admin…" />
    </div>
  );
}
