/**
 * Lightweight job queue scaffold.
 * In production swap the in-memory runner for Inngest, BullMQ, or pg_cron.
 */

export type JobName =
  | "profile-report.refresh"
  | "photo.comparison"
  | "health.sync"
  | "credit.reset"
  | "notification.dispatch";

export type JobPayload = Record<string, unknown>;

export type Job = {
  id: string;
  name: JobName;
  payload: JobPayload;
  status: "queued" | "running" | "completed" | "failed";
  attempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  runAt: Date;
};

type Handler = (payload: JobPayload, job: Job) => Promise<void>;

const handlers = new Map<JobName, Handler>();
const queue: Job[] = [];
let processing = false;

function uid() {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Register a handler for a job name */
export function registerJob(name: JobName, handler: Handler) {
  handlers.set(name, handler);
}

/** Enqueue a job (optionally delayed) */
export async function enqueue(
  name: JobName,
  payload: JobPayload = {},
  opts?: { delayMs?: number },
): Promise<Job> {
  const job: Job = {
    id: uid(),
    name,
    payload,
    status: "queued",
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    runAt: new Date(Date.now() + (opts?.delayMs ?? 0)),
  };
  queue.push(job);
  // Kick processor
  void processQueue();
  return job;
}

export function listJobs(limit = 50): Job[] {
  return [...queue]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getJob(id: string): Job | undefined {
  return queue.find((j) => j.id === id);
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (true) {
      const now = Date.now();
      const next = queue.find((j) => j.status === "queued" && j.runAt.getTime() <= now);
      if (!next) break;

      next.status = "running";
      next.attempts += 1;
      next.updatedAt = new Date();

      const handler = handlers.get(next.name);
      if (!handler) {
        next.status = "failed";
        next.error = `No handler for ${next.name}`;
        next.updatedAt = new Date();
        continue;
      }

      try {
        await handler(next.payload, next);
        next.status = "completed";
        next.updatedAt = new Date();
      } catch (err) {
        next.status = "failed";
        next.error = err instanceof Error ? err.message : String(err);
        next.updatedAt = new Date();
        // Simple retry once
        if (next.attempts < 2) {
          next.status = "queued";
          next.runAt = new Date(Date.now() + 2000);
          next.error = undefined;
        }
      }
    }
  } finally {
    processing = false;
  }
}

/** Call once at startup to register all handlers */
export function initJobSystem() {
  // handlers registered by importing job modules
  console.log("[jobs] queue ready");
}
