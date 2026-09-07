import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/authz";

/** Thrown when a limit is exceeded → mapped to HTTP 429 by the route wrapper. */
export class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window counter. Returns remaining; throws RateLimitError when exceeded.
 * `key` should identify the scope+subject (e.g. "ai:user:<id>").
 */
export async function limit(key: string, max: number, windowSec: number): Promise<void> {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const fullKey = `${key}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowSec * 1000);

  const row = await prisma.rateCounter.upsert({
    where: { key: fullKey },
    update: { count: { increment: 1 } },
    create: { key: fullKey, count: 1, expiresAt },
  });

  if (row.count > max) {
    const retryAfter = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
    throw new RateLimitError("Too many requests — please slow down.", retryAfter);
  }
}

// ── Convenience guards ─────────────────────────────────────────────

/** General per-user + per-IP API guard for a route. */
export async function guardApi(req: Request, userId: string | null, opts?: { perMin?: number }) {
  const perMin = opts?.perMin ?? 90;
  await limit(`api:ip:${clientIp(req)}`, perMin * 2, 60);
  if (userId) await limit(`api:user:${userId}`, perMin, 60);
}

/** Throttle unauthenticated auth actions (login/register/reset) by IP. */
export async function guardAuth(req: Request, action: string, opts?: { perMin?: number; perHour?: number }) {
  const ip = clientIp(req);
  await limit(`auth:${action}:ip:${ip}:min`, opts?.perMin ?? 10, 60);
  await limit(`auth:${action}:ip:${ip}:hr`, opts?.perHour ?? 40, 3600);
}

// AI usage quotas by subscription plan.
const AI_QUOTA: Record<string, { perDay: number; perMonth: number; perMin: number }> = {
  free:  { perDay: 20,  perMonth: 150,  perMin: 4 },
  pro:   { perDay: 120, perMonth: 2000, perMin: 8 },
  team:  { perDay: 300, perMonth: 6000, perMin: 12 },
  coach: { perDay: 300, perMonth: 6000, perMin: 12 },
  admin: { perDay: 100000, perMonth: 1000000, perMin: 60 },
};

/**
 * Enforce AI rate + daily/monthly quota for a user. Call before an AI request.
 * Counts existing AiUsage rows for the day/month against the plan's quota.
 */
export async function guardAi(req: Request, userId: string) {
  await limit(`ai:ip:${clientIp(req)}:min`, 15, 60);

  const [sub, roleUser] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, select: { planType: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  const plan = roleUser?.role === "admin" ? "admin" : (sub?.planType ?? "free");
  const q = AI_QUOTA[plan] ?? AI_QUOTA.free;

  await limit(`ai:user:${userId}:min`, q.perMin, 60);

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [today, month] = await Promise.all([
    prisma.aiUsage.count({ where: { userId, createdAt: { gte: dayStart } } }),
    prisma.aiUsage.count({ where: { userId, createdAt: { gte: monthStart } } }),
  ]);

  if (today >= q.perDay) {
    throw new RateLimitError(`Daily AI limit reached (${q.perDay}/day on the ${plan} plan). Upgrade for more.`, 3600);
  }
  if (month >= q.perMonth) {
    throw new RateLimitError(`Monthly AI limit reached (${q.perMonth} on the ${plan} plan). Upgrade for more.`, 3600);
  }
}

export { AuthError };
