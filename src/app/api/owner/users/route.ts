/**
 * GET  /api/owner/users — paged directory of every account, owner only.
 *      ?q=<search>&role=<user|coach|admin>&page=<n>
 * PATCH /api/owner/users — change a user's role.
 *      { userId, role }
 */
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 25;

export const GET = route(async (req: Request) => {
  await requireRole("admin");

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const role = url.searchParams.get("role") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const where = {
    ...(role === "user" || role === "coach" || role === "admin"
      ? { role: role as "user" | "coach" | "admin" }
      : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: { select: { planType: true, status: true } },
        _count: { select: { aiUsage: true } },
      },
    }),
  ]);

  return json({
    users: rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      plan: u.subscription?.planType ?? "free",
      planStatus: u.subscription?.status ?? "inactive",
      aiCalls: u._count.aiUsage,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
});

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "coach", "admin"]),
});

export const PATCH = route(async (req: Request) => {
  const me = await requireRole("admin");
  const body = patchSchema.parse(await req.json());

  // An owner must not be able to lock the platform out of its last admin.
  if (body.userId === me.id && body.role !== "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) {
      return json({ error: "You are the only owner — promote someone else first." }, 409);
    }
  }

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data: { role: body.role },
    select: { id: true, email: true, role: true },
  });

  return json({ user: updated });
});
