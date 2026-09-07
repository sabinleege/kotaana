-- Market-ready extensions (safe-ish additive)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weeklySummary" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weeklySummaryAt" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "goalPlanJson" JSONB;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "riskScoreJson" JSONB;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "coachPermissions" JSONB;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "nutritionAdherence" INTEGER;

ALTER TABLE "injuries" ADD COLUMN IF NOT EXISTS "restrictions" TEXT;
ALTER TABLE "injuries" ADD COLUMN IF NOT EXISTS "healingPercent" INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS "medical_documents" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "docType" TEXT NOT NULL,
  "title" TEXT,
  "fileUrl" TEXT NOT NULL,
  "ocrText" TEXT,
  "aiSummary" TEXT,
  "findings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "medical_documents_userId_idx" ON "medical_documents"("userId");

CREATE TABLE IF NOT EXISTS "recommendation_events" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source" TEXT NOT NULL,
  "itemKey" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "recommendation_events_userId_createdAt_idx" ON "recommendation_events"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "monthly_progress_reports" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "monthKey" TEXT NOT NULL,
  "summary" TEXT,
  "metrics" JSONB,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "monthKey")
);

CREATE TABLE IF NOT EXISTS "coach_learning_notes" (
  "id" TEXT PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "correction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "coach_learning_notes_athleteId_idx" ON "coach_learning_notes"("athleteId");
CREATE INDEX IF NOT EXISTS "coach_learning_notes_coachId_idx" ON "coach_learning_notes"("coachId");
