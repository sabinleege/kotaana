import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/exercises?q=&bodyPart=&equipment=&target=&limit=
// Search / browse the exercise library.
export const GET = route(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const bodyPart = url.searchParams.get("bodyPart") ?? undefined;
  const equipment = url.searchParams.get("equipment") ?? undefined;
  const target = url.searchParams.get("target") ?? undefined;
  const limit = Math.min(120, Number(url.searchParams.get("limit") ?? 60));

  const where: Record<string, unknown> = {};
  if (bodyPart) where.bodyPart = bodyPart;
  if (equipment) where.equipment = equipment;
  if (target) where.target = target;
  if (q) where.nameKey = { contains: q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() };

  const [items, total, bodyParts, equip] = await Promise.all([
    prisma.exercise.findMany({ where, take: limit, orderBy: { name: "asc" } }),
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({ distinct: ["bodyPart"], select: { bodyPart: true }, orderBy: { bodyPart: "asc" } }),
    prisma.exercise.findMany({ distinct: ["equipment"], select: { equipment: true }, orderBy: { equipment: "asc" } }),
  ]);

  return json(
    toSnake({
      items,
      total,
      facets: {
        bodyParts: bodyParts.map((b) => b.bodyPart).filter(Boolean),
        equipment: equip.map((e) => e.equipment).filter(Boolean),
      },
    }),
  );
});
