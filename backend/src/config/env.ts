import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
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
  SHIPPING_FREE_THRESHOLD_PENCE: z.coerce.number().default(6000),
  SHIPPING_FLAT_RATE_PENCE: z.coerce.number().default(395),
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
      PORT: 4000,
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
      SHIPPING_FREE_THRESHOLD_PENCE: 6000,
      SHIPPING_FLAT_RATE_PENCE: 395,
    } as z.infer<typeof envSchema>);

export const env = {
  ...data,
  corsOrigins: data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  isProd: data.NODE_ENV === 'production',
};
