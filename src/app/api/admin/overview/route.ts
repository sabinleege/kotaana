/**
 * GET /api/admin/overview — platform stats (admin only)
 */

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { listUserOrganizations } from "@/lib/orgs";

export const GET = route(async () => {
  await requireRole("admin");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [users, coaches, athletes, activeSubscriptions, aiCalls24h] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { role: "coach" } }).catch(() => 0),
    prisma.user.count({ where: { role: "user" } }).catch(() => 0),
    prisma.subscription.count({ where: { status: "active" } }).catch(() => 0),
    prisma.aiUsage.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
  ]);

  // Orgs are still in-memory in the scaffold
  const orgs = 0;

  return json({
    users,
    coaches,
    athletes,
    activeSubscriptions,
    aiCalls24h,
    orgs,
  });
});
