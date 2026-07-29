import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { OrderDetail } from '@/features/account/order-detail';

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export default async function AccountOrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  return (
    <Suspense fallback={<BrandLoader variant="page" size="md" label="Loading order…" />}>
      <OrderDetail orderNumber={decodeURIComponent(orderNumber)} />
    </Suspense>
  );
}
