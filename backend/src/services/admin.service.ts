import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';

const OPEN_TRADE_STATUSES = [
  'QUOTED',
  'SUBMITTED',
  'RECEIVED',
  'GRADED',
  'APPROVED',
  'ADJUSTED',
] as const;

export async function getDashboardStats() {
  const [products, orders, customers, openTradeRequests, revenueAgg] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.order.count(),
    prisma.user.count({ where: { deletedAt: null, role: { name: 'CUSTOMER' } } }),
    prisma.tradeRequest.count({ where: { status: { in: [...OPEN_TRADE_STATUSES] } } }),
    prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    }),
  ]);

  return {
    products,
    orders,
    customers,
    openTradeRequests,
    revenuePaidPence: revenueAgg._sum.amount ?? 0,
  };
}

export async function adminListOrders(query: {
  page: number;
  limit: number;
  status?: OrderStatus;
}) {
  const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: true,
        payments: { select: { id: true, provider: true, status: true, amount: true } },
        shippingAddress: true,
        billingAddress: true,
        emailLogs: { orderBy: { createdAt: 'desc' }, take: 40 },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const { summarizeEmailEvent } = await import('./order-email.service');

  return {
    items: items.map((order) => {
      const paidSummary = summarizeEmailEvent(order.email, 'PAID', order.emailLogs);
      const shippedSummary = summarizeEmailEvent(order.email, 'SHIPPED', order.emailLogs);
      const currentSummary = summarizeEmailEvent(order.email, order.status, order.emailLogs);
      return {
        ...order,
        emailStatus: {
          ordered: paidSummary,
          shipped:
            order.status === 'SHIPPED' || order.status === 'DELIVERED' ? shippedSummary : null,
          current: currentSummary,
          canResend: currentSummary.canResend,
          resendEvent: currentSummary.event,
        },
      };
    }),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function adminUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  extras?: {
    trackingNumber?: string | null;
    trackingCarrier?: string | null;
    resendEmails?: boolean;
  },
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError('Order not found');

  const previousStatus = order.status;
  const trackingNumber =
    extras?.trackingNumber !== undefined
      ? extras.trackingNumber?.trim() || null
      : order.trackingNumber;
  const trackingCarrier =
    extras?.trackingCarrier !== undefined
      ? extras.trackingCarrier?.trim() || null
      : order.trackingCarrier;

  const trackingChanged =
    (extras?.trackingNumber !== undefined &&
      (extras.trackingNumber?.trim() || null) !== (order.trackingNumber ?? null)) ||
    (extras?.trackingCarrier !== undefined &&
      (extras.trackingCarrier?.trim() || null) !== (order.trackingCarrier ?? null));

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(extras?.trackingNumber !== undefined ? { trackingNumber } : {}),
      ...(extras?.trackingCarrier !== undefined
        ? { trackingCarrier: trackingCarrier ?? 'Royal Mail' }
        : {}),
      ...(status === 'SHIPPED' && previousStatus !== 'SHIPPED' ? { shippedAt: new Date() } : {}),
      ...(status === 'SHIPPED' && !order.shippedAt && trackingNumber
        ? { shippedAt: new Date() }
        : {}),
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: true,
      payments: true,
      shippingAddress: true,
      emailLogs: { orderBy: { createdAt: 'desc' }, take: 40 },
    },
  });

  const shouldEmail =
    Boolean(extras?.resendEmails) ||
    previousStatus !== status ||
    (status === 'SHIPPED' && trackingChanged && Boolean(trackingNumber));

  let emailResult: Awaited<
    ReturnType<(typeof import('./order-email.service'))['emailOrderStatusUpdate']>
  > | null = null;

  if (shouldEmail) {
    const { emailOrderStatusUpdate } = await import('./order-email.service');
    emailResult = await emailOrderStatusUpdate(
      updated.id,
      status,
      extras?.resendEmails ? null : previousStatus === status ? null : previousStatus,
    );
    if (!emailResult.sent) {
      console.error('[admin] order status email failed', updated.orderNumber, emailResult.error);
    }

    if (updated.userId && previousStatus !== status) {
      const { createNotification } = await import('./notification.service');
      void createNotification(
        updated.userId,
        'ORDER',
        `Order ${status.replace(/_/g, ' ').toLowerCase()}`,
        trackingNumber && status === 'SHIPPED'
          ? `Your order ${updated.orderNumber} has shipped. Tracking: ${trackingNumber}.`
          : `Your order ${updated.orderNumber} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
        `/account/orders/${updated.orderNumber}`,
        { email: false },
      );
    }
  }

  const refreshed = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: true,
      payments: true,
      shippingAddress: true,
      emailLogs: { orderBy: { createdAt: 'desc' }, take: 40 },
    },
  });

  const { summarizeEmailEvent } = await import('./order-email.service');
  const finalOrder = refreshed ?? updated;
  const paidSummary = summarizeEmailEvent(finalOrder.email, 'PAID', finalOrder.emailLogs);
  const shippedSummary = summarizeEmailEvent(finalOrder.email, 'SHIPPED', finalOrder.emailLogs);
  const currentSummary = summarizeEmailEvent(
    finalOrder.email,
    finalOrder.status,
    finalOrder.emailLogs,
  );

  return {
    ...finalOrder,
    emailStatus: {
      ordered: paidSummary,
      shipped:
        finalOrder.status === 'SHIPPED' || finalOrder.status === 'DELIVERED'
          ? shippedSummary
          : null,
      current: currentSummary,
      canResend: currentSummary.canResend,
      resendEvent: currentSummary.event,
    },
    emailResult,
  };
}

export async function adminDeleteOrder(id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError('Order not found');

  await prisma.order.delete({ where: { id } });
  return { deleted: true, id };
}

export async function adminDeleteCustomer(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null, role: { name: 'CUSTOMER' } },
  });
  if (!user) throw new NotFoundError('Customer not found');

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { deleted: true, id };
}

export async function deleteShippingRule(id: string) {
  const rule = await prisma.shippingRule.findUnique({ where: { id } });
  if (!rule) throw new NotFoundError('Shipping rule not found');
  await prisma.shippingRule.delete({ where: { id } });
  return { deleted: true, id };
}

export async function adminListCustomers(query: { page: number; limit: number; search?: string }) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    role: { name: 'CUSTOMER' },
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        rewardPoints: true,
        storeCredit: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function listShippingRules() {
  return prisma.shippingRule.findMany({ orderBy: [{ priority: 'desc' }, { name: 'asc' }] });
}

export async function updateShippingRules(
  rules: Array<{
    id?: string;
    name: string;
    description?: string;
    minOrderAmount: number;
    maxOrderAmount?: number | null;
    rate: number;
    country?: string;
    isActive?: boolean;
    priority?: number;
  }>,
) {
  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const rule of rules) {
      if (rule.id) {
        results.push(
          await tx.shippingRule.update({
            where: { id: rule.id },
            data: {
              name: rule.name,
              description: rule.description,
              minOrderAmount: rule.minOrderAmount,
              maxOrderAmount: rule.maxOrderAmount ?? null,
              rate: rule.rate,
              country: rule.country ?? 'GB',
              isActive: rule.isActive ?? true,
              priority: rule.priority ?? 0,
            },
          }),
        );
      } else {
        results.push(
          await tx.shippingRule.create({
            data: {
              name: rule.name,
              description: rule.description,
              minOrderAmount: rule.minOrderAmount,
              maxOrderAmount: rule.maxOrderAmount ?? null,
              rate: rule.rate,
              country: rule.country ?? 'GB',
              isActive: rule.isActive ?? true,
              priority: rule.priority ?? 0,
            },
          }),
        );
      }
    }
    return results;
  });
}

export async function getSetting(key: string) {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) throw new NotFoundError('Setting not found');
  return setting;
}

export async function updateSetting(key: string, value: unknown, group?: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value: value as Prisma.InputJsonValue, ...(group ? { group } : {}) },
    create: { key, value: value as Prisma.InputJsonValue, group: group ?? 'general' },
  });
}
