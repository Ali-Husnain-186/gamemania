-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tradeInCashPence" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tradeInCreditPence" INTEGER;

-- AlterTable cart_items for product trade-ins
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "isTradeIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "tradePayoutMethod" TEXT;

-- Replace unique (cartId, productId) with (cartId, productId, isTradeIn)
DROP INDEX IF EXISTS "cart_items_cartId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cartId_productId_isTradeIn_key" ON "cart_items"("cartId", "productId", "isTradeIn");
