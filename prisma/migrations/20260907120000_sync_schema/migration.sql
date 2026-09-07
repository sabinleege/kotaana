-- DropForeignKey
ALTER TABLE "exercise_performances" DROP CONSTRAINT "exercise_performances_userId_fkey";

-- DropForeignKey
ALTER TABLE "medical_documents" DROP CONSTRAINT "medical_documents_userId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_progress_reports" DROP CONSTRAINT "monthly_progress_reports_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment_requests" DROP CONSTRAINT "payment_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_events" DROP CONSTRAINT "recommendation_events_userId_fkey";

-- AlterTable
ALTER TABLE "app_config" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "coach_athlete_relations" ADD COLUMN     "requestedByRole" TEXT NOT NULL DEFAULT 'coach';

-- AlterTable
ALTER TABLE "injuries" ADD COLUMN     "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "medical_documents" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_requests" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "aiReport" TEXT,
ADD COLUMN     "aiReportAt" TIMESTAMP(3),
ADD COLUMN     "connectCode" TEXT,
ADD COLUMN     "cycleLastPeriod" DATE,
ADD COLUMN     "cycleLengthDays" INTEGER DEFAULT 28,
ADD COLUMN     "cycleTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "healthConditions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "isPregnant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pregnancyDueDate" DATE,
ALTER COLUMN "coachBlockedExercises" SET NOT NULL;

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "energy" INTEGER NOT NULL DEFAULT 3,
    "soreness" INTEGER NOT NULL DEFAULT 1,
    "mood" INTEGER NOT NULL DEFAULT 3,
    "sleepHours" DOUBLE PRECISION,
    "feeling" TEXT NOT NULL DEFAULT 'ok',
    "symptoms" TEXT,
    "notes" TEXT,
    "readiness" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "category" TEXT,
    "bodyPart" TEXT,
    "equipment" TEXT,
    "target" TEXT,
    "muscleGroup" TEXT,
    "secondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image" TEXT,
    "gif" TEXT,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pose" TEXT NOT NULL DEFAULT 'front',
    "imageUrl" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_counters" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_counters_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "run_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activityType" TEXT NOT NULL DEFAULT 'run',
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "avgPaceSec" INTEGER,
    "path" JSONB,
    "source" TEXT NOT NULL DEFAULT 'gps',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_userId_date_key" ON "daily_checkins"("userId", "date");

-- CreateIndex
CREATE INDEX "exercises_nameKey_idx" ON "exercises"("nameKey");

-- CreateIndex
CREATE INDEX "exercises_bodyPart_idx" ON "exercises"("bodyPart");

-- CreateIndex
CREATE INDEX "exercises_equipment_idx" ON "exercises"("equipment");

-- CreateIndex
CREATE INDEX "exercises_target_idx" ON "exercises"("target");

-- CreateIndex
CREATE INDEX "progress_photos_userId_date_idx" ON "progress_photos"("userId", "date");

-- CreateIndex
CREATE INDEX "rate_counters_expiresAt_idx" ON "rate_counters"("expiresAt");

-- CreateIndex
CREATE INDEX "run_activities_userId_date_idx" ON "run_activities"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_connectCode_key" ON "profiles"("connectCode");

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_activities" ADD CONSTRAINT "run_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_progress_reports" ADD CONSTRAINT "monthly_progress_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_performances" ADD CONSTRAINT "exercise_performances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

