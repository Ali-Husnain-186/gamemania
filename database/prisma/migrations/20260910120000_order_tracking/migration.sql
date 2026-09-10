-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingCarrier" TEXT DEFAULT 'Royal Mail';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);
