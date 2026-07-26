import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';
import { validateCoupon } from './coupon.service';
import { getCart } from './cart.service';
import { quoteShipping } from './shipping.service';
import { createNotification } from './notification.service';
import { createCheckoutSession, isStripeConfigured } from './stripe.service';
import { createAddress } from './address.service';

export type CheckoutOptions = {
  couponCode?: string;
  useStoreCredit?: boolean;
  pointsToRedeem?: number;
  country?: string;
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

export async function computeCheckout(
  userId: string,
  options: CheckoutOptions,
): Promise<CheckoutPreview> {
  const [cart, user] = await Promise.all([getCart(userId), loadUserForCheckout(userId)]);

  if (cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

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
    const coupon = await validateCoupon(options.couponCode, cart.subtotalPence, userId);
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

export async function previewCheckout(userId: string, options: CheckoutOptions) {
  const preview = await computeCheckout(userId, options);
  const { couponId: _couponId, ...rest } = preview as CheckoutPreview & { couponId?: string };
  return rest;
}

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  const preview = await computeCheckout(userId, input);
  const couponId = (preview as CheckoutPreview & { couponId?: string }).couponId ?? null;

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

  const orderNumber = generateOrderNumber();
  const useStripe = isStripeConfigured() && preview.grandTotalPence > 0;
  const paymentProvider = useStripe
    ? ('STRIPE' as const)
    : preview.grandTotalPence <= 0
      ? ('STORE_CREDIT' as const)
      : ('MANUAL' as const);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: 'AWAITING_PAYMENT',
        email: user.email,
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
            status: preview.grandTotalPence <= 0 ? 'SUCCEEDED' : 'PENDING',
            amount: preview.grandTotalPence,
            paidAt: preview.grandTotalPence <= 0 ? new Date() : undefined,
          },
        },
        ...(preview.grandTotalPence <= 0 ? { status: 'PAID' as const } : {}),
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

  await createNotification(
    userId,
    'ORDER',
    'Order placed',
    `Your order ${orderNumber} has been placed and is awaiting payment.`,
    `/orders/${orderNumber}`,
  );

  let checkoutUrl: string | null = null;
  let paymentMessage =
    preview.grandTotalPence <= 0
      ? 'Order paid with store credit / rewards — no card payment needed.'
      : 'Add STRIPE_SECRET_KEY to enable card payments.';

  if (useStripe) {
    const stripeResult = await createCheckoutSession({
      orderId: order.id,
      orderNumber,
      grandTotalPence: preview.grandTotalPence,
      email: user.email,
    });

    if (stripeResult.sessionId) {
      await prisma.payment.update({
        where: { id: order.payments[0].id },
        data: { providerSessionId: stripeResult.sessionId },
      });
    }

    if (stripeResult.url) {
      checkoutUrl = stripeResult.url;
      paymentMessage = 'Redirecting to Stripe Checkout…';
    } else {
      paymentMessage = stripeResult.error ?? 'Stripe checkout unavailable';
    }
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
    checkoutUrl,
    paymentMessage,
    stripeEnabled: isStripeConfigured(),
  };
}
