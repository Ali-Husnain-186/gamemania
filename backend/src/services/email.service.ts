import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';

function resendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
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
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
  });
  return { sent: true };
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const provider = getEmailProvider();

  if (provider === 'none') {
    if (!env.isProd) {
      console.info(`[email:skip] To=${input.to} Subject=${input.subject}`);
    }
    return { sent: false, error: 'Email not configured (set RESEND_API_KEY)' };
  }

  try {
    if (provider === 'resend') {
      return await sendViaResend(input);
    }
    return await sendViaSmtp(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    console.error('[email:error]', message);
    return { sent: false, error: message };
  }
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
