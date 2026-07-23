import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';

export async function listMyOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: { select: { id: true, provider: true, status: true, amount: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    shippingTotal: o.shippingTotal,
    grandTotal: o.grandTotal,
    placedAt: o.placedAt,
    createdAt: o.createdAt,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    payments: o.payments,
  }));
}

export async function getOrderByNumber(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: {
      items: true,
      payments: true,
      shippingAddress: true,
      billingAddress: true,
      coupon: { select: { code: true, type: true } },
    },
  });

  if (!order) throw new NotFoundError('Order not found');
  return order;
}
