/**
 * POST — log Done / Skip on AI recommendations (feeds memory + adherence).
 */
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { invalidateProfileReport } from "@/lib/profile-report";

const schema = z.object({
  source: z.enum(["workout", "meal", "ai_advice", "goal"]),
  itemKey: z.string().min(1).max(200),
  action: z.enum(["done", "skip", "accepted", "dismissed"]),
  reason: z.string().max(500).optional(),
  meta: z.record(z.unknown()).optional(),
  completionRate: z.number().min(0).max(1).optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  const event = await prisma.recommendationEvent.create({
    data: {
      userId: me.id,
      source: body.source,
      itemKey: body.itemKey,
      action: body.action,
      reason: body.reason,
      meta: body.meta as any,
    },
  });

  if (body.source === "workout" && body.action === "done") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.workoutLog.create({
      data: {
        userId: me.id,
        date: today,
        completionRate: body.completionRate ?? 1,
        notes: body.itemKey,
      },
    }).catch(() => {});
  }

  // Refresh adherence snapshot
  const since = new Date(Date.now() - 7 * 86400000);
  const logs = await prisma.workoutLog.findMany({
    where: { userId: me.id, date: { gte: since } },
    select: { completionRate: true },
  });
  if (logs.length) {
    const pct = Math.round((logs.reduce((s, l) => s + Number(l.completionRate), 0) / logs.length) * 100);
    await prisma.profile.update({ where: { userId: me.id }, data: { adherencePercentage: pct } }).catch(() => {});
  }

  await invalidateProfileReport(me.id);
  return json({ event }, 201);
});

export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(50, Number(url.searchParams.get("limit") || 20));
  const events = await prisma.recommendationEvent.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return json({ events });
});
