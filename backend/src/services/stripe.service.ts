import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { createNotification } from './notification.service';
import { cancelUnpaidOrder } from './order-cancel.service';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}

export async function createCheckoutSession(input: {
  orderId: string;
  orderNumber: string;
  grandTotalPence: number;
  email: string;
}): Promise<{ url: string | null; sessionId: string | null; error?: string }> {
  if (!isStripeConfigured() || input.grandTotalPence <= 0) {
    return { url: null, sessionId: null };
  }

  try {
    const stripe = getStripe();
    const successBase = env.FRONTEND_URL.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.email,
      success_url: `${successBase}/checkout?paid=1&order=${encodeURIComponent(input.orderNumber)}&email=${encodeURIComponent(input.email)}`,
      cancel_url: `${successBase}/checkout?cancelled=1&order=${encodeURIComponent(input.orderNumber)}&email=${encodeURIComponent(input.email)}`,
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `GAME MANIA order ${input.orderNumber}`,
              description: 'Games, consoles & accessories',
            },
            unit_amount: input.grandTotalPence,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
      },
    });

    return { url: session.url, sessionId: session.id };
  } catch (err) {
    return {
      url: null,
      sessionId: null,
      error: err instanceof Error ? err.message : 'Stripe session failed',
    };
  }
}

export async function markOrderPaidFromStripe(input: {
  orderId?: string | null;
  orderNumber?: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  rawPayload: unknown;
}) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        ...(input.orderId ? [{ id: input.orderId }] : []),
        ...(input.orderNumber ? [{ orderNumber: input.orderNumber }] : []),
        ...(input.sessionId
          ? [{ payments: { some: { providerSessionId: input.sessionId } } }]
          : []),
      ],
    },
    include: { payments: true, user: { select: { id: true } } },
  });

  if (!order) return { ok: false as const, reason: 'ORDER_NOT_FOUND' };

  const payment = order.payments.find((p) => p.provider === 'STRIPE') ?? order.payments[0];
  if (!payment) return { ok: false as const, reason: 'PAYMENT_NOT_FOUND' };

  if (payment.status === 'SUCCEEDED' && order.status === 'PAID') {
    return { ok: true as const, alreadyPaid: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        providerPaymentId: input.paymentIntentId ?? payment.providerPaymentId,
        providerSessionId: input.sessionId ?? payment.providerSessionId,
        paidAt: new Date(),
        rawPayload: input.rawPayload as object,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
    });
  });

  if (order.userId) {
    await createNotification(
      order.userId,
      'ORDER',
      'Payment received',
      `Payment for order ${order.orderNumber} was successful. We’ll start processing it soon.`,
      `/account/orders/${order.orderNumber}`,
    );
  }

  return { ok: true as const, alreadyPaid: false };
}

async function cancelOrderFromStripeSession(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findFirst({
    where: { providerSessionId: session.id },
    include: { order: true },
  });

  const orderId =
    payment?.orderId ??
    session.metadata?.orderId ??
    (
      await prisma.order.findFirst({
        where: { orderNumber: session.metadata?.orderNumber ?? '' },
        select: { id: true },
      })
    )?.id;

  if (!orderId) return;

  if (payment && payment.status === 'PENDING') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED', rawPayload: session as object },
    });
  }

  // Restore stock; keep cart cleared so user uses retry-payment for same order
  await cancelUnpaidOrder(orderId, { restoreCart: false });
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  if (!signature) {
    throw new Error('Missing Stripe-Signature header');
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid' || session.status === 'complete') {
      await markOrderPaidFromStripe({
        orderId: session.metadata?.orderId,
        orderNumber: session.metadata?.orderNumber,
        sessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
        rawPayload: session,
      });
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    await cancelOrderFromStripeSession(session);
  }

  return { received: true, type: event.type };
}
