import type { Metadata } from 'next';
import { AdminGuard } from '@/features/admin/components/admin-guard';
import { AdminSidebar } from '@/features/admin/components/sidebar';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | GAME-MANIA Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[var(--admin-bg)] text-[var(--admin-fg)]">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
