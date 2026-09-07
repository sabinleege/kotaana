/**
 * GET  /api/admin/jobs — list recent jobs
 * POST /api/admin/jobs — enqueue { name, payload?, delayMs? }
 */

import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { listJobs, enqueue, type JobName } from "@/lib/jobs/queue";
// Ensure handlers are registered
import "@/lib/jobs";

export const GET = route(async () => {
  await requireRole("admin");
  const jobs = listJobs(100);
  return json({
    jobs: jobs.map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      attempts: j.attempts,
      error: j.error,
      createdAt: j.createdAt,
      runAt: j.runAt,
      payload: j.payload,
    })),
  });
});

const postSchema = z.object({
  name: z.enum([
    "profile-report.refresh",
    "photo.comparison",
    "health.sync",
    "credit.reset",
    "notification.dispatch",
  ]),
  payload: z.record(z.unknown()).optional(),
  delayMs: z.number().int().min(0).optional(),
});

export const POST = route(async (req: Request) => {
  await requireRole("admin");
  const body = postSchema.parse(await req.json());
  const job = await enqueue(body.name as JobName, body.payload || {}, {
    delayMs: body.delayMs,
  });
  return json({ job }, 201);
});
