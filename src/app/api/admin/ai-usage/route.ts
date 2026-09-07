import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";

export const GET = route(async () => {
  await requireRole("admin");
  const usage = await prisma.aiUsage
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        functionName: true,
        status: true,
        durationMs: true,
        createdAt: true,
      },
    })
    .catch(() => []);
  return json({ usage });
});
