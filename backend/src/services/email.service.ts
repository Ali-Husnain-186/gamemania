import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';

function resendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

function emailDomain(address: string): string {
  const at = address.lastIndexOf('@');
  return at >= 0 ? address.slice(at + 1) : '';
}

/** Brand From (info@…) must not fall back to Gmail — Gmail rewrites From to SMTP_USER. */
function allowSmtpFallback(): boolean {
  if (!smtpConfigured()) return false;
  const fromAddr = extractEmail(env.EMAIL_FROM);
  if (fromAddr.includes('beth.t@example.com')) return true;
  const smtpUser = String(env.SMTP_USER ?? '')
    .trim()
    .toLowerCase();
  // Only fall back when From is the same mailbox as SMTP (or same domain for aliases).
  return fromAddr === smtpUser || emailDomain(fromAddr) === emailDomain(smtpUser);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export function isEmailEnabled(): boolean {
  return resendConfigured() || smtpConfigured();
}

export function getEmailProvider(): 'resend' | 'smtp' | 'none' {
  if (resendConfigured()) return 'resend';
  if (smtpConfigured()) return 'smtp';
  return 'none';
}

function smtpFromAddress(): string {
  // Resend test sender won't work over SMTP; use the Gmail account when present.
  if (env.EMAIL_FROM.includes('beth.t@example.com') && env.SMTP_USER) {
    return `GameMania UK <${env.SMTP_USER}>`;
  }
  return env.EMAIL_FROM;
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
  });

  if (error) {
    const message = error.message || 'Resend send failed';
    console.error('[email:resend]', message, { from: env.EMAIL_FROM, to: input.to });
    return { sent: false, error: message };
  }

  console.info('[email:resend] sent', {
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
  });
  return { sent: true };
}

async function sendViaSmtp(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = getTransporter();
  const from = smtpFromAddress();
  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
  });
  console.info('[email:smtp] sent', { from, to: input.to, subject: input.subject });
  return { sent: true };
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    if (!env.isProd) {
      console.info(`[email:skip] To=${input.to} Subject=${input.subject}`);
    }
    return {
      sent: false,
      error: 'Email not configured (set RESEND_API_KEY or SMTP_USER/SMTP_PASS)',
    };
  }

  const errors: string[] = [];

  if (resendConfigured()) {
    const resendResult = await sendViaResend(input);
    if (resendResult.sent) return resendResult;
    if (resendResult.error) errors.push(`resend: ${resendResult.error}`);

    if (!allowSmtpFallback()) {
      console.error(
        '[email] Resend failed and SMTP fallback skipped (EMAIL_FROM is not the Gmail SMTP account). Verify domain gamemaniaauk.co.uk in Resend.',
        resendResult.error,
      );
      return {
        sent: false,
        error:
          errors.join(' | ') +
          ' | smtp-fallback-skipped: verify gamemaniaauk.co.uk in Resend so From can be info@gamemaniaauk.co.uk',
      };
    }
  }

  if (smtpConfigured() && (!resendConfigured() || allowSmtpFallback())) {
    try {
      return await sendViaSmtp(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMTP send failed';
      console.error('[email:smtp]', message);
      errors.push(`smtp: ${message}`);
    }
  }

  return { sent: false, error: errors.join(' | ') || 'Email send failed' };
}

/** Customer-facing order email (uses order email, works for guests). */
export async function sendOrderEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  return sendMail(input);
}
