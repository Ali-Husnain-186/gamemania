import type { OrderStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendOrderEmail } from './email.service';

const BRAND = {
  cyan: '#01A6C2',
  yellow: '#FFD100',
  magenta: '#E51A63',
  ink: '#0a1016',
  muted: '#5a6b75',
  border: '#d8e2e8',
  bg: '#f4f7f9',
  white: '#ffffff',
};

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

function siteUrl(path = '/') {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
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
    body: 'Your order is on its way with Royal Mail. Track it using the details below.',
  },
  DELIVERED: {
    subject: 'Your order has been delivered',
    title: 'Order delivered',
    body: 'Your order has been marked as delivered. Thanks for shopping with GameMania UK.',
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

function statusAccent(status: OrderStatus): string {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return '#159947';
    case 'SHIPPED':
    case 'PROCESSING':
      return BRAND.cyan;
    case 'CANCELLED':
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return BRAND.magenta;
    case 'AWAITING_PAYMENT':
      return '#d97706';
    default:
      return BRAND.cyan;
  }
}

function wrapEmailLayout(input: {
  preheader: string;
  title: string;
  statusBadge?: string;
  statusColor?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const badge = input.statusBadge
    ? `<span style="display:inline-block;background:${input.statusColor ?? BRAND.cyan};color:${BRAND.white};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${escapeHtml(input.statusBadge)}</span>`
    : '';

  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<tr>
          <td style="padding:8px 0 0;">
            <a href="${input.ctaUrl}" style="display:inline-block;background:${BRAND.yellow};color:${BRAND.ink};text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:10px;">
              ${escapeHtml(input.ctaLabel)}
            </a>
          </td>
        </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr>
            <td style="background:${BRAND.ink};padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;width:56px;">
                    <img src="${siteUrl('/brand/game-mania-logo-tab.png')}" alt="GAMEMANIA UK" width="48" height="48" style="display:block;border-radius:999px;border:0;" />
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;letter-spacing:0.08em;color:${BRAND.white};text-transform:uppercase;">
                    GAMEMANIA UK
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${BRAND.cyan},${BRAND.yellow},${BRAND.magenta});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
              ${badge ? `<div style="margin-bottom:14px;">${badge}</div>` : ''}
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:${BRAND.ink};">${escapeHtml(input.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};font-size:15px;line-height:1.55;">
              ${input.bodyHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                ${cta}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#eef4f7;padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};border-top:1px solid ${BRAND.border};">
              <strong style="color:${BRAND.ink};">GameMania UK</strong><br/>
              Games • Consoles • Accessories<br/>
              <a href="${siteUrl('/')}" style="color:${BRAND.cyan};text-decoration:none;">${escapeHtml(siteUrl('/'))}</a>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.muted};">
          You’re receiving this because you placed an order with GameMania UK.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function metaCard(rows: Array<{ label: string; value: string }>) {
  const cells = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.muted};width:120px;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};font-weight:700;vertical-align:top;">${row.value}</td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${BRAND.bg};border-radius:12px;padding:4px 16px;">
    ${cells}
  </table>`;
}

/** Rich paid confirmation (items + address). */
export async function emailOrderPaid(orderId: string) {
  return emailOrderStatusUpdate(orderId, 'PAID');
}

export async function emailPaymentPending(orderId: string) {
  return emailOrderStatusUpdate(orderId, 'AWAITING_PAYMENT');
}

function shopNotifyRecipients(): string[] {
  const fromEnv = String(env.ADMIN_ORDER_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const defaults = ['info@gamemaniauk.co.uk', 'husnain.code@gmail.com'];
  const merged = [...fromEnv, ...defaults];
  // Unique, keep order
  return [...new Set(merged.map((e) => e.toLowerCase()))];
}

type ShopNotifyOrder = {
  email: string;
  orderNumber: string;
  grandTotal: number;
  subtotal?: number;
  shippingTotal?: number;
  discountTotal?: number;
  notes?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  items?: Array<{ name: string; quantity: number; lineTotal: number; sku?: string }>;
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    county?: string | null;
    postcode: string;
    country?: string;
    phone?: string | null;
  } | null;
};

/** Copy every order-status email to the shop inbox (info@…). */
function notifyShopInbox(input: {
  status: OrderStatus;
  order: ShopNotifyOrder;
  customerSubject: string;
}) {
  const recipients = shopNotifyRecipients();
  if (!recipients.length) return;

  const o = input.order;
  const accent = statusAccent(input.status);
  const itemLines = (o.items ?? [])
    .map((i) => `• ${i.name}${i.sku ? ` (${i.sku})` : ''} × ${i.quantity} — ${gbp(i.lineTotal)}`)
    .join('\n');

  const address = o.shippingAddress
    ? [
        o.shippingAddress.fullName,
        o.shippingAddress.line1,
        o.shippingAddress.line2,
        [o.shippingAddress.city, o.shippingAddress.county].filter(Boolean).join(', '),
        o.shippingAddress.postcode,
        o.shippingAddress.country,
        o.shippingAddress.phone ? `Phone: ${o.shippingAddress.phone}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const subject = `[Shop] ${statusLabel(input.status)} — ${o.orderNumber}`;
  const text = [
    `Order status update (shop copy)`,
    ``,
    `Status: ${statusLabel(input.status)}`,
    `Order: ${o.orderNumber}`,
    `Customer: ${o.email}`,
    `Total: ${gbp(o.grandTotal)}`,
    o.trackingNumber
      ? `Tracking: ${o.trackingNumber} (${o.trackingCarrier || 'Royal Mail'})`
      : null,
    o.notes ? `Notes: ${o.notes}` : null,
    ``,
    `Customer email subject: ${input.customerSubject}`,
    ``,
    `Items:`,
    itemLines || '—',
    address ? `\nShipping:\n${address}` : '',
    ``,
    `Admin: ${siteUrl('/admin/orders')}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const bodyHtml = `
    <p style="margin:0 0 8px;color:${BRAND.muted};">Shop copy — customer was also emailed for this status.</p>
    ${metaCard([
      { label: 'Order', value: escapeHtml(o.orderNumber) },
      { label: 'Customer', value: escapeHtml(o.email) },
      {
        label: 'Status',
        value: `<span style="color:${accent};text-transform:capitalize;">${escapeHtml(statusLabel(input.status))}</span>`,
      },
      { label: 'Total', value: gbp(o.grandTotal) },
      ...(o.trackingNumber
        ? [
            {
              label: 'Tracking',
              value: `<span style="font-family:monospace;">${escapeHtml(o.trackingNumber)}</span> (${escapeHtml(o.trackingCarrier || 'Royal Mail')})`,
            },
          ]
        : []),
      ...(o.notes ? [{ label: 'Notes', value: escapeHtml(o.notes) }] : []),
    ])}
    <h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Items</h2>
    <p style="margin:0;white-space:pre-line;color:${BRAND.ink};font-size:14px;line-height:1.5;">${escapeHtml(itemLines || '—')}</p>
    ${
      address
        ? `<h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Shipping</h2>
           <p style="margin:0;padding:14px 16px;background:${BRAND.bg};border-radius:12px;white-space:pre-line;color:${BRAND.ink};font-size:14px;line-height:1.5;">${escapeHtml(address)}</p>`
        : ''
    }
  `;

  const html = wrapEmailLayout({
    preheader: `${statusLabel(input.status)} — ${o.orderNumber} (${o.email})`,
    title: `Order ${statusLabel(input.status)}`,
    statusBadge: statusLabel(input.status),
    statusColor: accent,
    bodyHtml,
    ctaLabel: 'Open admin orders',
    ctaUrl: siteUrl('/admin/orders'),
  });

  for (const to of recipients) {
    void sendOrderEmail({ to, subject, text, html }).then((mail) => {
      if (!mail.sent) {
        console.error('[order-email] shop notify failed', o.orderNumber, to, mail.error);
      }
    });
  }
}

/**
 * Email the customer for an order status.
 * Skips if status unchanged or no customer email.
 * Always also notifies the shop inbox (ADMIN_ORDER_NOTIFY_EMAIL).
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

  if (nextStatus === 'SHIPPED') {
    return sendShippedOrderEmail(order);
  }

  const copy = STATUS_COPY[nextStatus];
  const subject = `${copy.subject} — ${order.orderNumber}`;
  const viewUrl = order.userId ? siteUrl(`/account/orders/${order.orderNumber}`) : siteUrl('/shop');
  const accent = statusAccent(nextStatus);

  const itemLines = order.items.map((i) => `• ${i.name} × ${i.quantity}`).join('\n');
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

  const text = [
    `Hi,`,
    ``,
    copy.body,
    ``,
    `Reference: ${order.orderNumber}`,
    `Status: ${statusLabel(nextStatus)}`,
    `Total: ${gbp(order.grandTotal)}`,
    ``,
    `Items:`,
    itemLines || '—',
    address ? `\nDelivery:\n${address}` : '',
    ``,
    `View: ${viewUrl}`,
    ``,
    `— GameMania UK`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 8px;color:${BRAND.muted};">${escapeHtml(copy.body)}</p>
    ${metaCard([
      { label: 'Reference', value: escapeHtml(order.orderNumber) },
      {
        label: 'Status',
        value: `<span style="color:${accent};text-transform:capitalize;">${escapeHtml(statusLabel(nextStatus))}</span>`,
      },
      {
        label: 'Total',
        value: `<span style="color:${BRAND.magenta};">${gbp(order.grandTotal)}</span>`,
      },
    ])}
    ${
      itemLines
        ? `<h2 style="margin:18px 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Items</h2>
           <p style="margin:0;white-space:pre-line;font-size:14px;color:${BRAND.ink};">${escapeHtml(itemLines)}</p>`
        : ''
    }
  `;

  const html = wrapEmailLayout({
    preheader: `${copy.title} for ${order.orderNumber}`,
    title: copy.title,
    statusBadge: statusLabel(nextStatus),
    statusColor: accent,
    bodyHtml,
    ctaLabel: order.userId ? 'View order' : 'Continue shopping',
    ctaUrl: viewUrl,
  });

  const customerResult = await sendOrderEmail({ to: order.email, subject, text, html });
  notifyShopInbox({ status: nextStatus, order, customerSubject: subject });
  return customerResult;
}

function royalMailTrackUrl(trackingNumber: string) {
  const code = encodeURIComponent(trackingNumber.trim());
  return `https://www.royalmail.com/track-your-item#/tracking-results/${code}`;
}

function carrierTrackUrl(carrier: string | null | undefined, trackingNumber: string) {
  const name = (carrier || 'Royal Mail').toLowerCase();
  if (name.includes('royal')) return royalMailTrackUrl(trackingNumber);
  // Generic fallback — still useful in email
  return royalMailTrackUrl(trackingNumber);
}

async function sendShippedOrderEmail(order: {
  email: string;
  orderNumber: string;
  grandTotal: number;
  userId: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  items: Array<{ name: string; quantity: number; lineTotal: number; sku: string }>;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    country: string;
    phone: string | null;
  } | null;
}) {
  const carrier = order.trackingCarrier?.trim() || 'Royal Mail';
  const tracking = order.trackingNumber?.trim() || null;
  const trackUrl = tracking ? carrierTrackUrl(carrier, tracking) : null;

  const address = order.shippingAddress
    ? [
        order.shippingAddress.fullName,
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        [order.shippingAddress.city, order.shippingAddress.county].filter(Boolean).join(', '),
        order.shippingAddress.postcode,
        order.shippingAddress.country,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const itemLines = order.items.map((i) => `• ${i.name} × ${i.quantity}`).join('\n');

  const subject = tracking
    ? `Your order has shipped — tracking ${tracking}`
    : `Your order has shipped — ${order.orderNumber}`;

  const viewUrl = order.userId ? siteUrl(`/account/orders/${order.orderNumber}`) : siteUrl('/shop');

  const text = [
    `Good news — your GameMania UK order is on its way.`,
    ``,
    `Order: ${order.orderNumber}`,
    `Carrier: ${carrier}`,
    tracking ? `Tracking number: ${tracking}` : 'Tracking number: we’ll update you when available.',
    trackUrl ? `Track parcel: ${trackUrl}` : null,
    ``,
    `Items:`,
    itemLines || '—',
    address ? `\nDelivering to:\n${address}` : '',
    ``,
    `We’ll email you again when your order is delivered.`,
    ``,
    `— GameMania UK`,
    siteUrl('/'),
  ]
    .filter((line) => line !== null)
    .join('\n');

  const bodyHtml = `
    <p style="margin:0 0 8px;color:${BRAND.muted};">Good news — your order from <strong style="color:${BRAND.ink};">GameMania UK</strong> has been dispatched.</p>
    ${metaCard([
      { label: 'Order', value: escapeHtml(order.orderNumber) },
      { label: 'Status', value: `<span style="color:${BRAND.cyan};">Shipped</span>` },
      { label: 'Carrier', value: escapeHtml(carrier) },
      {
        label: 'Tracking',
        value: tracking
          ? `<span style="font-family:monospace;">${escapeHtml(tracking)}</span>`
          : 'Pending — you’ll get another email when available',
      },
    ])}
    ${
      trackUrl
        ? `<p style="margin:8px 0 0;"><a href="${trackUrl}" style="color:${BRAND.cyan};font-weight:700;">Track your parcel on Royal Mail →</a></p>`
        : ''
    }
    <h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Items</h2>
    <p style="margin:0;white-space:pre-line;color:${BRAND.ink};font-size:14px;line-height:1.5;">${escapeHtml(itemLines || '—')}</p>
    ${
      address
        ? `<h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Delivering to</h2>
           <p style="margin:0;padding:14px 16px;background:${BRAND.bg};border-radius:12px;white-space:pre-line;color:${BRAND.ink};font-size:14px;line-height:1.5;">${escapeHtml(address)}</p>`
        : ''
    }
  `;

  const html = wrapEmailLayout({
    preheader: tracking
      ? `Shipped — tracking ${tracking}`
      : `Your order ${order.orderNumber} has shipped`,
    title: 'Your order has shipped',
    statusBadge: 'Shipped',
    statusColor: BRAND.cyan,
    bodyHtml,
    ctaLabel: trackUrl ? 'Track parcel' : order.userId ? 'View order' : 'Continue shopping',
    ctaUrl: trackUrl ?? viewUrl,
  });

  const customerResult = await sendOrderEmail({ to: order.email, subject, text, html });
  notifyShopInbox({ status: 'SHIPPED', order, customerSubject: subject });
  return customerResult;
}

async function sendPaidOrderEmail(order: {
  email: string;
  orderNumber: string;
  grandTotal: number;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  notes: string | null;
  userId: string | null;
  items: Array<{ name: string; quantity: number; lineTotal: number; sku: string }>;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    country: string;
    phone: string | null;
  } | null;
}) {
  const lines = order.items
    .map((i) => `• ${i.name} (${i.sku}) × ${i.quantity} — ${gbp(i.lineTotal)}`)
    .join('\n');

  const addressLines = order.shippingAddress
    ? [
        order.shippingAddress.fullName,
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        [order.shippingAddress.city, order.shippingAddress.county].filter(Boolean).join(', '),
        `${order.shippingAddress.postcode}`,
        order.shippingAddress.country,
        order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : null,
      ].filter(Boolean)
    : [];
  const address = addressLines.join('\n');

  const subject = `Order confirmed — ${order.orderNumber}`;
  const viewUrl = order.userId ? siteUrl(`/account/orders/${order.orderNumber}`) : siteUrl('/shop');

  const text = [
    `Thanks for your order with GameMania UK.`,
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
    `— GameMania UK`,
    siteUrl('/'),
  ].join('\n');

  const itemRows = order.items
    .map(
      (i, index) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};">
          <strong>${escapeHtml(i.name)}</strong><br/>
          <span style="color:${BRAND.muted};font-size:12px;">SKU ${escapeHtml(i.sku)} · Qty ${i.quantity}</span>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;font-weight:700;color:${BRAND.ink};white-space:nowrap;">
          ${gbp(i.lineTotal)}
        </td>
      </tr>${index === order.items.length - 1 ? '' : ''}`,
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 8px;color:${BRAND.muted};">Thanks for your order with <strong style="color:${BRAND.ink};">GameMania UK</strong>. We’ve received your payment.</p>
    ${metaCard([
      { label: 'Reference', value: escapeHtml(order.orderNumber) },
      { label: 'Status', value: `<span style="color:#159947;">Paid</span>` },
      {
        label: 'Total paid',
        value: `<span style="color:${BRAND.magenta};font-size:18px;">${gbp(order.grandTotal)}</span>`,
      },
    ])}
    <h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Items</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows || `<tr><td style="padding:12px 0;color:${BRAND.muted};">No items</td></tr>`}
    </table>
    ${
      address
        ? `<h2 style="margin:22px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.cyan};">Delivery</h2>
           <p style="margin:0;padding:14px 16px;background:${BRAND.bg};border-radius:12px;white-space:pre-line;color:${BRAND.ink};font-size:14px;line-height:1.5;">${escapeHtml(address)}</p>`
        : ''
    }
    <p style="margin:20px 0 0;color:${BRAND.muted};font-size:13px;">We’ll email you again when your order status changes.</p>
  `;

  const html = wrapEmailLayout({
    preheader: `Order confirmed ${order.orderNumber} — ${gbp(order.grandTotal)}`,
    title: 'Order confirmed',
    statusBadge: 'Paid',
    statusColor: '#159947',
    bodyHtml,
    ctaLabel: order.userId ? 'View order' : 'Continue shopping',
    ctaUrl: viewUrl,
  });

  const customerResult = await sendOrderEmail({ to: order.email, subject, text, html });
  notifyShopInbox({ status: 'PAID', order, customerSubject: subject });
  return customerResult;
}
