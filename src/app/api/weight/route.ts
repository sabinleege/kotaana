import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/weight — own weight history (oldest first)
export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.weightHistory.findMany({
    where: { userId: me.id },
    orderBy: { recordedAt: "asc" },
    take: 52,
  });
  return json(toSnake(rows));
});

const createSchema = z.object({
  week_label: z.string().min(1),
  weight: z.number().positive(),
});

// POST /api/weight — log a weight entry (and sync profile.weight)
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { week_label, weight } = createSchema.parse(await req.json());
  const row = await prisma.weightHistory.create({
    data: { userId: me.id, weekLabel: week_label, weight },
  });
  await prisma.profile.update({ where: { userId: me.id }, data: { weight } }).catch(() => {});
  return json(toSnake(row), 201);
});
