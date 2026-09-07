ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "track" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "ageBand" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "level" TEXT DEFAULT 'beginner';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "coachBlockedExercises" JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS "exercise_performances" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exerciseId" TEXT NOT NULL,
  "exerciseName" TEXT,
  "date" DATE NOT NULL,
  "setsDone" INTEGER,
  "repsDone" TEXT,
  "effort" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "exercise_performances_userId_date_idx" ON "exercise_performances"("userId", "date");
CREATE INDEX IF NOT EXISTS "exercise_performances_userId_exerciseId_idx" ON "exercise_performances"("userId", "exerciseId");
