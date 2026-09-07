/**
 * Job: daily AI credit window is rolling (24h), but this job can
 * emit notifications or clear stale RateCounter keys.
 */

import { registerJob, enqueue } from "./queue";
import { prisma } from "@/lib/db";

registerJob("credit.reset", async () => {
  // Clean expired rate counters
  const now = new Date();
  await prisma.rateCounter.deleteMany({
    where: { expiresAt: { lt: now } },
  }).catch(() => {});
});

/** Schedule a credit/rate-counter cleanup (e.g. hourly) */
export function scheduleCreditReset(delayMs = 0) {
  return enqueue("credit.reset", {}, { delayMs });
}
