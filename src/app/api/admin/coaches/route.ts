import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";

export const GET = route(async () => {
  await requireRole("admin");
  const coaches = await prisma.user
    .findMany({
      where: { role: "coach" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { coachRelations: true } },
      },
    })
    .catch(() => []);

  return json({
    coaches: (coaches as any[]).map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      athleteCount: c._count?.coachRelations ?? 0,
      createdAt: c.createdAt,
    })),
  });
});
