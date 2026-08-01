-- AlterTable
ALTER TABLE "trade_requests" ALTER COLUMN "optionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "manualCategory" TEXT;
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "manualDescription" TEXT;
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT;
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "bankSortCode" TEXT;
ALTER TABLE "trade_requests" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
