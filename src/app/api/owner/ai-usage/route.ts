/**
 * GET /api/owner/ai-usage — AI spend and reliability, owner only.
 *     ?days=<1|7|30>
 */
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = route(async (req: Request) => {
  await requireRole("admin");

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || 7)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totals, byFunction, byStatus, topUsers, recentErrors] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { createdAt: { gte: since } },
      _count: true,
      _sum: { tokensIn: true, tokensOut: true },
      _avg: { durationMs: true },
    }),
    prisma.aiUsage.groupBy({
      by: ["functionName"],
      where: { createdAt: { gte: since } },
      _count: true,
      _sum: { tokensIn: true, tokensOut: true },
    }),
    prisma.aiUsage.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.aiUsage.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    prisma.aiUsage.findMany({
      where: { createdAt: { gte: since }, status: { not: "success" } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, functionName: true, status: true, errorMessage: true, createdAt: true },
    }),
  ]);

  // Resolve the heavy users into something readable.
  const userIds = topUsers.map((u) => u.userId);
  const people = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, role: true },
      })
    : [];
  const byId = new Map(people.map((p) => [p.id, p]));

  // Daily series for the sparkline.
  const rows = await prisma.aiUsage.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = r.createdAt.toISOString().slice(0, 10);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
  }

  const failed = byStatus.filter((s) => s.status !== "success").reduce((n, s) => n + s._count, 0);

  return json({
    days,
    totalCalls: totals._count,
    tokensIn: totals._sum.tokensIn ?? 0,
    tokensOut: totals._sum.tokensOut ?? 0,
    avgDurationMs: Math.round(totals._avg.durationMs ?? 0),
    failed,
    successRate: totals._count ? Math.round(((totals._count - failed) / totals._count) * 100) : 100,
    byFunction: byFunction
      .map((f) => ({
        name: f.functionName,
        calls: f._count,
        tokens: (f._sum.tokensIn ?? 0) + (f._sum.tokensOut ?? 0),
      }))
      .sort((a, b) => b.calls - a.calls),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      calls: u._count,
      email: byId.get(u.userId)?.email ?? "(deleted)",
      name: byId.get(u.userId)?.name ?? null,
      role: byId.get(u.userId)?.role ?? "user",
    })),
    series: [...buckets.entries()].map(([date, count]) => ({ date, count })),
    recentErrors,
  });
});
