import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";

export const GET = route(async () => {
  await requireRole("admin");
  const users = await prisma.user
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    .catch(() => []);
  return json({ users });
});
