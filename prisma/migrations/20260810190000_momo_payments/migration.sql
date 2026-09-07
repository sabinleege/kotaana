ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "momoNumber" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "momoName" TEXT;

CREATE TABLE IF NOT EXISTS "payment_requests" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "planType" TEXT NOT NULL,
  "amountLabel" TEXT,
  "payerNumber" TEXT NOT NULL,
  "payerName" TEXT NOT NULL,
  "payToCode" TEXT NOT NULL DEFAULT '8787',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "approvedById" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "payment_requests_userId_status_idx" ON "payment_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "payment_requests_status_idx" ON "payment_requests"("status");
