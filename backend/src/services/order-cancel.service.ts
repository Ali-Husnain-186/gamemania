import { prisma } from '../config/prisma';

async function restoreInventoryForOrderItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  items: Array<{ productId: string | null; quantity: number }>,
) {
  for (const item of items) {
    if (!item.productId) continue;
    const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
    if (!inv) continue;
    await tx.inventory.update({
      where: { productId: item.productId },
      data: { quantity: inv.quantity + item.quantity },
    });
  }
}

/**
 * Cancel an unpaid order, restore stock, reverse coupon/credit/points.
 * Optionally restore cart lines for the owning user.
 */
export async function cancelUnpaidOrder(orderId: string, options?: { restoreCart?: boolean }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) return { ok: false as const, reason: 'ORDER_NOT_FOUND' };
  if (order.status === 'CANCELLED') return { ok: true as const, alreadyCancelled: true };
  if (order.status !== 'AWAITING_PAYMENT' && order.status !== 'PENDING') {
    return { ok: false as const, reason: 'NOT_CANCELLABLE' };
  }

  const paid = order.payments.some((p) => p.status === 'SUCCEEDED');
  if (paid) return { ok: false as const, reason: 'ALREADY_PAID' };

  await prisma.$transaction(async (tx) => {
    await restoreInventoryForOrderItems(tx, order.items);

    for (const payment of order.payments) {
      if (payment.status === 'PENDING' || payment.status === 'REQUIRES_ACTION') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'CANCELLED' },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    if (order.couponId && order.userId) {
      await tx.couponRedemption.deleteMany({ where: { orderId: order.id } });
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usageCount: { decrement: 1 } },
      });
    }

    if (order.userId && order.storeCreditApplied > 0) {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      if (user) {
        const newBalance = user.storeCredit + order.storeCreditApplied;
        await tx.user.update({
          where: { id: order.userId },
          data: { storeCredit: newBalance },
        });
        await tx.storeCreditLedger.create({
          data: {
            userId: order.userId,
            delta: order.storeCreditApplied,
            balanceAfter: newBalance,
            reason: 'Order payment cancelled — credit restored',
            referenceId: order.id,
          },
        });
      }
    }

    if (order.userId && order.pointsRedeemed > 0) {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      if (user) {
        const newPoints = user.rewardPoints + order.pointsRedeemed;
        await tx.user.update({
          where: { id: order.userId },
          data: { rewardPoints: newPoints },
        });
        await tx.rewardPointLedger.create({
          data: {
            userId: order.userId,
            delta: order.pointsRedeemed,
            balanceAfter: newPoints,
            reason: 'Order payment cancelled — points restored',
            referenceId: order.id,
          },
        });
      }
    }

    if (options?.restoreCart && order.userId) {
      const cart = await tx.cart.upsert({
        where: { userId: order.userId },
        update: {},
        create: { userId: order.userId },
      });
      for (const item of order.items) {
        if (!item.productId) continue;
        const existing = await tx.cartItem.findFirst({
          where: { cartId: cart.id, productId: item.productId },
        });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      }
    }
  });

  return { ok: true as const, alreadyCancelled: false };
}
