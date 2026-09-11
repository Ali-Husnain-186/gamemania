import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Resolve from this file so `npm run dev --workspace=backend` (cwd = repo root)
// still loads backend/.env instead of the empty Google placeholders in root .env.
const backendEnvPath = path.resolve(__dirname, '../../.env');
const repoRootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: repoRootEnvPath });
dotenv.config({ path: backendEnvPath, override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_NAME: z.string().default('GAME-MANIA API'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ADMIN_URL: z.string().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  SHIPPING_FREE_THRESHOLD_PENCE: z.coerce.number().default(6000),
  SHIPPING_FLAT_RATE_PENCE: z.coerce.number().default(395),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Gmail SMTP (no custom domain needed). Use a Google App Password.
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Prefer Resend (free tier). Falls back to SMTP if RESEND_API_KEY is empty.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('GAME MANIA <beth.t@example.com>'),
  /**
   * Shop owner inbox(es) — copy of every order status email.
   * Comma-separated allowed, e.g. info@…,husnain.code@gmail.com
   */
  ADMIN_ORDER_NOTIFY_EMAIL: z
    .string()
    .min(3)
    .default('info@gamemaniaauk.co.uk,husnain.code@gmail.com'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== 'test') {
    // Allow boot with placeholders during scaffold; harden in production
    console.warn('Continuing with partial env — set backend/.env before production use.');
  }
}

const data = parsed.success
  ? parsed.data
  : ({
      NODE_ENV: 'development',
      PORT: 5000,
      APP_NAME: 'GAME-MANIA API',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me_32chars',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me_32char',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      FRONTEND_URL: 'http://localhost:3000',
      ADMIN_URL: 'http://localhost:3001',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
      COOKIE_DOMAIN: 'localhost',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      SHIPPING_FREE_THRESHOLD_PENCE: 6000,
      SHIPPING_FLAT_RATE_PENCE: 395,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM ?? 'GAME MANIA <beth.t@example.com>',
      ADMIN_ORDER_NOTIFY_EMAIL:
        process.env.ADMIN_ORDER_NOTIFY_EMAIL ?? 'info@gamemaniaauk.co.uk,husnain.code@gmail.com',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    } as z.infer<typeof envSchema>);

export const env = {
  ...data,
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  isProd: data.NODE_ENV === 'production',
};
