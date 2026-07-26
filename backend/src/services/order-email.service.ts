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

export async function emailOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      shippingAddress: true,
    },
  });
  if (!order?.email) return { sent: false as const, error: 'No order email' };

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
    `We’ll email you again when it ships.`,
    ``,
    `— GAME MANIA`,
    env.FRONTEND_URL,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:22px;margin:0 0 12px">Order confirmed</h1>
      <p>Thanks for your order with <strong>GAME MANIA</strong>.</p>
      <p><strong>Reference:</strong> ${order.orderNumber}<br/>
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
      <p style="margin-top:24px;color:#555">We’ll email you again when it ships.</p>
      <p>— GAME MANIA</p>
    </div>
  `;

  return sendOrderEmail({ to: order.email, subject, text, html });
}

export async function emailPaymentPending(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.email) return { sent: false as const, error: 'No order email' };

  const payUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/checkout?cancelled=1&order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`;

  return sendOrderEmail({
    to: order.email,
    subject: `Complete payment — ${order.orderNumber}`,
    text: [
      `Your GAME MANIA order ${order.orderNumber} is waiting for payment.`,
      `Total due: ${gbp(order.grandTotal)}`,
      ``,
      `Complete payment: ${payUrl}`,
      ``,
      `— GAME MANIA`,
    ].join('\n'),
  });
}
