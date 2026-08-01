import type { Metadata } from 'next';
import { AdminGuard } from '@/features/admin/components/admin-guard';
import { AdminSidebar } from '@/features/admin/components/sidebar';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | GameMania Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen flex-col bg-[var(--admin-bg)] text-[var(--admin-fg)] lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-7 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
