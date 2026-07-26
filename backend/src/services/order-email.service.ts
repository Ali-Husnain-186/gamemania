import type { OrderStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendOrderEmail } from './email.service';

function gbp(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(status: OrderStatus) {
  return status.replace(/_/g, ' ').toLowerCase();
}

const STATUS_COPY: Record<OrderStatus, { subject: string; title: string; body: string }> = {
  PENDING: {
    subject: 'Order update — pending',
    title: 'Order pending',
    body: 'Your order is pending and will be updated soon.',
  },
  AWAITING_PAYMENT: {
    subject: 'Complete your payment',
    title: 'Payment needed',
    body: 'Your order is waiting for payment. Please complete checkout to confirm it.',
  },
  PAID: {
    subject: 'Order confirmed — payment received',
    title: 'Payment received',
    body: 'Thanks — we’ve received your payment and will start preparing your order.',
  },
  PROCESSING: {
    subject: 'Order is being prepared',
    title: 'Processing your order',
    body: 'Good news — your order is now being prepared.',
  },
  SHIPPED: {
    subject: 'Your order has shipped',
    title: 'Order shipped',
    body: 'Your order is on its way. You’ll get another update when it’s delivered.',
  },
  DELIVERED: {
    subject: 'Your order has been delivered',
    title: 'Order delivered',
    body: 'Your order has been marked as delivered. Thanks for shopping with GAME MANIA.',
  },
  CANCELLED: {
    subject: 'Order cancelled',
    title: 'Order cancelled',
    body: 'Your order has been cancelled. If you paid and expect a refund, contact support.',
  },
  REFUNDED: {
    subject: 'Order refunded',
    title: 'Refund complete',
    body: 'A refund for your order has been processed.',
  },
  PARTIALLY_REFUNDED: {
    subject: 'Partial refund processed',
    title: 'Partial refund',
    body: 'A partial refund for your order has been processed.',
  },
};

/** Rich paid confirmation (items + address). */
export async function emailOrderPaid(orderId: string) {
  return emailOrderStatusUpdate(orderId, 'PAID');
}

export async function emailPaymentPending(orderId: string) {
  return emailOrderStatusUpdate(orderId, 'AWAITING_PAYMENT');
}

/**
 * Email the customer for an order status.
 * Skips if status unchanged or no customer email.
 */
export async function emailOrderStatusUpdate(
  orderId: string,
  status?: OrderStatus,
  previousStatus?: OrderStatus | null,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      shippingAddress: true,
    },
  });
  if (!order?.email) return { sent: false as const, error: 'No order email' };

  const nextStatus = status ?? order.status;
  if (previousStatus && previousStatus === nextStatus) {
    return { sent: false as const, error: 'Status unchanged' };
  }

  if (nextStatus === 'PAID') {
    return sendPaidOrderEmail(order);
  }

  const copy = STATUS_COPY[nextStatus];
  const subject = `${copy.subject} — ${order.orderNumber}`;
  const viewUrl = order.userId
    ? `${env.FRONTEND_URL.replace(/\/$/, '')}/account/orders/${order.orderNumber}`
    : `${env.FRONTEND_URL.replace(/\/$/, '')}/shop`;

  const text = [
    `Hi,`,
    ``,
    copy.body,
    ``,
    `Reference: ${order.orderNumber}`,
    `Status: ${statusLabel(nextStatus)}`,
    `Total: ${gbp(order.grandTotal)}`,
    ``,
    `View: ${viewUrl}`,
    ``,
    `— GAME MANIA`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(copy.title)}</h1>
      <p>${escapeHtml(copy.body)}</p>
      <p><strong>Reference:</strong> ${escapeHtml(order.orderNumber)}<br/>
      <strong>Status:</strong> ${escapeHtml(statusLabel(nextStatus))}<br/>
      <strong>Total:</strong> ${gbp(order.grandTotal)}</p>
      <p><a href="${viewUrl}">View order details</a></p>
      <p style="margin-top:24px">— GAME MANIA</p>
    </div>
  `;

  return sendOrderEmail({ to: order.email, subject, text, html });
}

async function sendPaidOrderEmail(order: {
  email: string;
  orderNumber: string;
  grandTotal: number;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
  } | null;
}) {
  const lines = order.items
    .map((i) => `• ${i.name} × ${i.quantity} — ${gbp(i.lineTotal)}`)
    .join('\n');

  const address = order.shippingAddress
    ? [
        order.shippingAddress.fullName,
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        `${order.shippingAddress.city} ${order.shippingAddress.postcode}`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const subject = `Order confirmed — ${order.orderNumber}`;
  const text = [
    `Thanks for your order with GAME MANIA.`,
    ``,
    `Reference: ${order.orderNumber}`,
    `Total paid: ${gbp(order.grandTotal)}`,
    ``,
    `Items:`,
    lines || '—',
    address ? `\nDelivery to:\n${address}` : '',
    ``,
    `We’ll email you again when your order status changes.`,
    ``,
    `— GAME MANIA`,
    env.FRONTEND_URL,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:22px;margin:0 0 12px">Order confirmed</h1>
      <p>Thanks for your order with <strong>GAME MANIA</strong>.</p>
      <p><strong>Reference:</strong> ${escapeHtml(order.orderNumber)}<br/>
      <strong>Total paid:</strong> ${gbp(order.grandTotal)}</p>
      <h2 style="font-size:16px;margin:20px 0 8px">Items</h2>
      <ul>${order.items
        .map((i) => `<li>${escapeHtml(i.name)} × ${i.quantity} — ${gbp(i.lineTotal)}</li>`)
        .join('')}</ul>
      ${
        address
          ? `<h2 style="font-size:16px;margin:20px 0 8px">Delivery</h2><p style="white-space:pre-line">${escapeHtml(address)}</p>`
          : ''
      }
      <p style="margin-top:24px;color:#555">We’ll email you again when your order status changes.</p>
      <p>— GAME MANIA</p>
    </div>
  `;

  return sendOrderEmail({ to: order.email, subject, text, html });
}
