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
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError('Order not found');

  const previousStatus = order.status;
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: true,
      payments: true,
    },
  });

  if (previousStatus !== status) {
    const { emailOrderStatusUpdate } = await import('./order-email.service');
    void emailOrderStatusUpdate(updated.id, status, previousStatus).then((mail) => {
      if (!mail.sent) {
        console.error('[admin] order status email failed', updated.orderNumber, mail.error);
      }
    });

    if (updated.userId) {
      const { createNotification } = await import('./notification.service');
      void createNotification(
        updated.userId,
        'ORDER',
        `Order ${status.replace(/_/g, ' ').toLowerCase()}`,
        `Your order ${updated.orderNumber} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
        `/account/orders/${updated.orderNumber}`,
        { email: false },
      );
    }
  }

  return updated;
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
