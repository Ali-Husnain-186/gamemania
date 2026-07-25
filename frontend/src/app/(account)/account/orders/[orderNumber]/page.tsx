import { Suspense } from 'react';
import { OrderDetail } from '@/features/account/order-detail';

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export default async function AccountOrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-3" aria-busy="true">
          <div className="h-8 w-48 rounded bg-[var(--gm-border)]" />
          <div className="h-40 rounded-xl bg-[var(--gm-border)]" />
        </div>
      }
    >
      <OrderDetail orderNumber={decodeURIComponent(orderNumber)} />
    </Suspense>
  );
}
