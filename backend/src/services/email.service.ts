import nodemailer from 'nodemailer';
import { env } from '../config/env';

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
  return smtpConfigured();
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!smtpConfigured()) {
    if (!env.isProd) {
      console.info(`[email:skip] To=${input.to} Subject=${input.subject}`);
    }
    return { sent: false, error: 'SMTP not configured' };
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    console.error('[email:error]', message);
    return { sent: false, error: message };
  }
}
