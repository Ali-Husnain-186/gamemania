import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';

function resendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());
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
    return `GAME MANIA <${env.SMTP_USER}>`;
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
    console.error('[email:resend]', message);
    return { sent: false, error: message };
  }

  console.info('[email:resend] sent', input.to, input.subject);
  return { sent: true };
}

async function sendViaSmtp(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: smtpFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
  });
  console.info('[email:smtp] sent', input.to, input.subject);
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
  }

  if (smtpConfigured()) {
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
