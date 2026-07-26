import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';
import { validateCoupon } from './coupon.service';
import { getCart, mergeGuestCart } from './cart.service';
import { quoteShipping } from './shipping.service';
import { createNotification } from './notification.service';
import {
  createCheckoutSession,
  isStripeConfigured,
  syncOrderPaymentFromStripe,
} from './stripe.service';
import { cancelUnpaidOrder } from './order-cancel.service';
import { emailOrderPaid } from './order-email.service';
import { createAddress } from './address.service';
import { hashPassword } from '../utils/password';

export type CheckoutOptions = {
  couponCode?: string;
  useStoreCredit?: boolean;
  pointsToRedeem?: number;
  country?: string;
  email?: string;
};

export type CheckoutActor = {
  userId?: string;
  guestId?: string;
};

export type CheckoutPreview = {
  lineItems: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPricePence: number;
    lineTotalPence: number;
  }>;
  subtotalPence: number;
  discountPence: number;
  freeShipping: boolean;
  shippingPence: number;
  storeCreditApplied: number;
  pointsRedeemed: number;
  pointsValuePence: number;
  grandTotalPence: number;
  couponCode: string | null;
  shippingRuleId: string | null;
};

export type PlaceOrderInput = CheckoutOptions & {
  shippingAddressId?: string;
  billingAddressId?: string;
  shipping?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country?: string;
    phone?: string;
  };
  notes?: string;
};

function generateOrderNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `GM-${ymd}-${suffix}`;
}

async function loadUserForCheckout(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function findOrCreateCheckoutUser(email: string, fullName?: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
  });
  if (existing) {
    if (!existing.isActive) throw new ValidationError('This account is inactive');
    return existing;
  }

  const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!role) throw new ValidationError('CUSTOMER role is not configured');

  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? 'Guest';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
  const passwordHash = await hashPassword(randomBytes(24).toString('hex'));

  return prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      firstName,
      lastName,
      roleId: role.id,
    },
  });
}

async function resolveCheckoutCart(actor: CheckoutActor) {
  if (!actor.userId && !actor.guestId) {
    throw new ValidationError('Cart session missing. Please add items again.');
  }

  // Logged-in users may still have items only on the guest cart (pre-login add).
  if (actor.userId && actor.guestId) {
    await mergeGuestCart(actor.userId, actor.guestId);
  }

  return getCart(actor.userId, actor.guestId);
}

export async function computeCheckout(
  actor: CheckoutActor,
  options: CheckoutOptions,
): Promise<CheckoutPreview> {
  const cart = await resolveCheckoutCart(actor);
  if (cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  const user = actor.userId
    ? await loadUserForCheckout(actor.userId)
    : { rewardPoints: 0, storeCredit: 0 };

  const productSkus = await prisma.product.findMany({
    where: { id: { in: cart.items.map((i) => i.productId) } },
    select: { id: true, sku: true },
  });
  const skuByProductId = new Map(productSkus.map((p) => [p.id, p.sku]));

  const country = options.country ?? 'GB';
  let discountPence = 0;
  let freeShipping = false;
  let couponCode: string | null = null;
  let couponId: string | null = null;

  if (options.couponCode) {
    const coupon = await validateCoupon(options.couponCode, cart.subtotalPence, actor.userId);
    discountPence = coupon.discountPence;
    freeShipping = coupon.freeShipping;
    couponCode = coupon.code;
    couponId = coupon.couponId;
  }

  const subtotalAfterCoupon = Math.max(0, cart.subtotalPence - discountPence);
  const shippingQuote = await quoteShipping(subtotalAfterCoupon, country);
  const shippingPence = freeShipping ? 0 : shippingQuote.ratePence;

  const maxPointsValue = Math.floor(subtotalAfterCoupon * 0.5);
  const requestedPoints = options.pointsToRedeem ?? 0;
  const pointsRedeemed = Math.min(requestedPoints, user.rewardPoints, maxPointsValue);
  const pointsValuePence = pointsRedeemed;

  let remaining = subtotalAfterCoupon - pointsValuePence + shippingPence;
  let storeCreditApplied = 0;

  if (options.useStoreCredit && user.storeCredit > 0 && remaining > 0) {
    storeCreditApplied = Math.min(user.storeCredit, remaining);
    remaining -= storeCreditApplied;
  }

  const grandTotalPence = Math.max(0, remaining);

  return {
    lineItems: cart.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      sku: skuByProductId.get(item.productId) ?? item.product.slug,
      quantity: item.quantity,
      unitPricePence: item.product.price,
      lineTotalPence: item.lineTotal,
    })),
    subtotalPence: cart.subtotalPence,
    discountPence,
    freeShipping,
    shippingPence,
    storeCreditApplied,
    pointsRedeemed,
    pointsValuePence,
    grandTotalPence,
    couponCode,
    shippingRuleId: shippingQuote.ruleId,
    ...(couponId ? { couponId } : {}),
  } as CheckoutPreview & { couponId?: string };
}

export async function previewCheckout(actor: CheckoutActor, options: CheckoutOptions) {
  const preview = await computeCheckout(actor, options);
  const { couponId: _couponId, ...rest } = preview as CheckoutPreview & { couponId?: string };
  return {
    ...rest,
    stripeEnabled: isStripeConfigured(),
    paymentsReady: isStripeConfigured() || rest.grandTotalPence <= 0,
  };
}

function assertCanAccessOrder(
  order: { email: string; userId: string | null },
  actor: CheckoutActor,
  email?: string,
) {
  if (actor.userId && order.userId === actor.userId) return;
  const normalized = email?.trim().toLowerCase();
  if (normalized && order.email.toLowerCase() === normalized) return;
  throw new NotFoundError('Order not found');
}

export async function getCheckoutOrderStatus(
  actor: CheckoutActor,
  orderNumber: string,
  email?: string,
) {
  let order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      items: { select: { name: true, quantity: true, lineTotal: true } },
    },
  });

  if (!order) throw new NotFoundError('Order not found');
  assertCanAccessOrder(order, actor, email);

  // If webhook hasn't arrived yet, confirm with Stripe when customer returns from Checkout
  if (order.status === 'AWAITING_PAYMENT') {
    await syncOrderPaymentFromStripe(order.orderNumber);
    order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        items: { select: { name: true, quantity: true, lineTotal: true } },
      },
    });
    if (!order) throw new NotFoundError('Order not found');
  }

  const payment = order.payments[0];
  const paid =
    order.status === 'PAID' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED' ||
    payment?.status === 'SUCCEEDED';

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paid,
    awaitingPayment: order.status === 'AWAITING_PAYMENT',
    cancelled: order.status === 'CANCELLED',
    grandTotalPence: order.grandTotal,
    email: order.email,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      lineTotalPence: i.lineTotal,
    })),
    paymentStatus: payment?.status ?? null,
    canRetryPayment:
      order.status === 'AWAITING_PAYMENT' &&
      order.grandTotal > 0 &&
      isStripeConfigured() &&
      payment?.status !== 'SUCCEEDED',
  };
}

export async function retryCheckoutPayment(
  actor: CheckoutActor,
  orderNumber: string,
  email?: string,
) {
  if (!isStripeConfigured()) {
    throw new ValidationError(
      'Card payments are temporarily unavailable. Please try again later or contact support.',
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });

  if (!order) throw new NotFoundError('Order not found');
  assertCanAccessOrder(order, actor, email);

  if (order.status === 'PAID' || order.payments.some((p) => p.status === 'SUCCEEDED')) {
    throw new ValidationError('This order is already paid');
  }
  if (order.status === 'CANCELLED') {
    throw new ValidationError('This order was cancelled. Please start a new checkout.');
  }
  if (order.status !== 'AWAITING_PAYMENT') {
    throw new ValidationError('This order cannot be paid online right now');
  }
  if (order.grandTotal <= 0) {
    throw new ValidationError('No payment is due for this order');
  }

  const stripeResult = await createCheckoutSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    grandTotalPence: order.grandTotal,
    email: order.email,
  });

  if (!stripeResult.url || !stripeResult.sessionId) {
    throw new ValidationError(
      stripeResult.error ?? 'Could not start secure payment. Please try again.',
    );
  }

  const pendingPayment =
    order.payments.find((p) => p.status === 'PENDING' || p.status === 'REQUIRES_ACTION') ??
    order.payments[0];

  if (pendingPayment) {
    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        provider: 'STRIPE',
        status: 'PENDING',
        providerSessionId: stripeResult.sessionId,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'STRIPE',
        status: 'PENDING',
        amount: order.grandTotal,
        providerSessionId: stripeResult.sessionId,
      },
    });
  }

  return {
    orderNumber: order.orderNumber,
    checkoutUrl: stripeResult.url,
    paymentMessage: 'Redirecting to secure payment…',
  };
}

export async function placeOrder(actor: CheckoutActor, input: PlaceOrderInput) {
  let userId = actor.userId;

  // Guest checkout: create/find customer from email, merge guest cart
  if (!userId) {
    const email = input.email?.trim();
    if (!email) throw new ValidationError('Email is required to checkout');
    if (!input.shipping && !input.shippingAddressId) {
      throw new ValidationError('Delivery address is required');
    }
    if (!actor.guestId) {
      throw new ValidationError('Cart session missing. Please add items again.');
    }

    const guestUser = await findOrCreateCheckoutUser(email, input.shipping?.fullName);
    userId = guestUser.id;
    await mergeGuestCart(userId, actor.guestId);
  } else if (actor.guestId) {
    await mergeGuestCart(userId, actor.guestId);
  }

  const preview = await computeCheckout({ userId, guestId: actor.guestId }, input);
  const couponId = (preview as CheckoutPreview & { couponId?: string }).couponId ?? null;

  // Fail closed: paid orders require Stripe before we touch stock/cart
  if (preview.grandTotalPence > 0 && !isStripeConfigured()) {
    throw new ValidationError(
      'Card payments are temporarily unavailable. Please try again later or contact support.',
    );
  }

  let shippingAddressId = input.shippingAddressId;

  if (!shippingAddressId && input.shipping) {
    const created = await createAddress(userId, {
      ...input.shipping,
      country: input.shipping.country ?? input.country ?? 'GB',
      isDefault: true,
    });
    shippingAddressId = created.id;
  }

  if (!shippingAddressId) {
    throw new ValidationError('Delivery address is required');
  }

  const [shippingAddress, billingAddress, user, cartRecord] = await Promise.all([
    prisma.address.findFirst({ where: { id: shippingAddressId, userId } }),
    input.billingAddressId
      ? prisma.address.findFirst({ where: { id: input.billingAddressId, userId } })
      : Promise.resolve(null),
    loadUserForCheckout(userId),
    prisma.cart.findUnique({ where: { userId }, include: { items: true } }),
  ]);

  if (!shippingAddress) throw new NotFoundError('Shipping address not found');
  if (input.billingAddressId && !billingAddress) {
    throw new NotFoundError('Billing address not found');
  }
  if (!cartRecord || cartRecord.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Stock check before placing
  for (const item of preview.lineItems) {
    const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
    const available = Math.max(0, (inv?.quantity ?? 0) - (inv?.reserved ?? 0));
    if (available < item.quantity) {
      throw new ValidationError(`${item.name} does not have enough stock`);
    }
  }

  const orderEmail = (input.email?.trim() || user.email).toLowerCase();
  const orderNumber = generateOrderNumber();
  const needsStripe = preview.grandTotalPence > 0;
  const paymentProvider = needsStripe ? ('STRIPE' as const) : ('STORE_CREDIT' as const);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: 'AWAITING_PAYMENT',
        email: orderEmail,
        subtotal: preview.subtotalPence,
        discountTotal: preview.discountPence,
        shippingTotal: preview.shippingPence,
        taxTotal: 0,
        storeCreditApplied: preview.storeCreditApplied,
        pointsRedeemed: preview.pointsRedeemed,
        pointsValue: preview.pointsValuePence,
        grandTotal: preview.grandTotalPence,
        couponId,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress?.id ?? shippingAddress.id,
        shippingRuleId: preview.shippingRuleId,
        notes: input.notes,
        placedAt: new Date(),
        items: {
          create: preview.lineItems.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            unitPrice: item.unitPricePence,
            quantity: item.quantity,
            lineTotal: item.lineTotalPence,
          })),
        },
        payments: {
          create: {
            provider: paymentProvider,
            status: needsStripe ? 'PENDING' : 'SUCCEEDED',
            amount: preview.grandTotalPence,
            paidAt: needsStripe ? undefined : new Date(),
          },
        },
        ...(!needsStripe ? { status: 'PAID' as const } : {}),
      },
      include: { items: true, payments: true },
    });

    for (const item of preview.lineItems) {
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (inv) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: Math.max(0, inv.quantity - item.quantity) },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cartRecord.id } });

    if (couponId) {
      await tx.couponRedemption.create({
        data: { couponId, userId, orderId: created.id },
      });
      await tx.coupon.update({
        where: { id: couponId },
        data: { usageCount: { increment: 1 } },
      });
    }

    if (preview.storeCreditApplied > 0) {
      const newBalance = user.storeCredit - preview.storeCreditApplied;
      await tx.user.update({
        where: { id: userId },
        data: { storeCredit: newBalance },
      });
      await tx.storeCreditLedger.create({
        data: {
          userId,
          delta: -preview.storeCreditApplied,
          balanceAfter: newBalance,
          reason: 'Order checkout',
          referenceId: created.id,
        },
      });
    }

    if (preview.pointsRedeemed > 0) {
      const newPoints = user.rewardPoints - preview.pointsRedeemed;
      await tx.user.update({
        where: { id: userId },
        data: { rewardPoints: newPoints },
      });
      await tx.rewardPointLedger.create({
        data: {
          userId,
          delta: -preview.pointsRedeemed,
          balanceAfter: newPoints,
          reason: 'Order checkout redemption',
          referenceId: created.id,
        },
      });
    }

    return created;
  });

  if (!needsStripe) {
    await createNotification(
      userId,
      'ORDER',
      'Order confirmed',
      `Your order ${orderNumber} is confirmed — no card payment needed.`,
      `/account/orders/${orderNumber}`,
      { email: false },
    );
    const mail = await emailOrderPaid(order.id);
    if (!mail.sent) {
      console.error('[checkout] free-order email failed', order.orderNumber, mail.error);
    }

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal,
        items: order.items,
        payments: order.payments,
      },
      checkoutUrl: null,
      paymentMessage: mail.sent
        ? 'Order confirmed — check your email for confirmation.'
        : 'Order confirmed — no card payment needed.',
      paid: true,
      stripeEnabled: isStripeConfigured(),
    };
  }

  const stripeResult = await createCheckoutSession({
    orderId: order.id,
    orderNumber,
    grandTotalPence: preview.grandTotalPence,
    email: orderEmail,
  });

  if (!stripeResult.url || !stripeResult.sessionId) {
    await cancelUnpaidOrder(order.id, { restoreCart: true });
    throw new ValidationError(
      stripeResult.error ??
        'Could not start secure payment. Your cart has been restored — please try again.',
    );
  }

  await prisma.payment.update({
    where: { id: order.payments[0]!.id },
    data: { providerSessionId: stripeResult.sessionId },
  });

  await createNotification(
    userId,
    'ORDER',
    'Complete your payment',
    `Your order ${orderNumber} is ready — finish payment to confirm it.`,
    `/checkout?order=${orderNumber}`,
  );

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: 'AWAITING_PAYMENT' as const,
      grandTotal: order.grandTotal,
      items: order.items,
      payments: order.payments,
    },
    checkoutUrl: stripeResult.url,
    paymentMessage: 'Redirecting to secure payment…',
    paid: false,
    stripeEnabled: true,
  };
}
