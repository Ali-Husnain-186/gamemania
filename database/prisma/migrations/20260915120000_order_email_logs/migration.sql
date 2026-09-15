-- Persist per-recipient order email delivery attempts
CREATE TYPE "OrderEmailRole" AS ENUM ('CUSTOMER', 'SHOP');

CREATE TABLE "order_email_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "role" "OrderEmailRole" NOT NULL,
    "event" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_email_logs_orderId_event_createdAt_idx" ON "order_email_logs"("orderId", "event", "createdAt");

ALTER TABLE "order_email_logs" ADD CONSTRAINT "order_email_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
