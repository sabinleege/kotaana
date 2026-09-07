import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { guardApi, limit } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/progress-photos — own photos, newest first
export const GET = route(async () => {
  const me = await requireUser();
  const photos = await prisma.progressPhoto.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 60,
  });
  return json(toSnake(photos));
});

const createSchema = z.object({
  pose: z.enum(["front", "side", "back"]).default("front"),
  image: z.string().min(10),
  weight: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// POST /api/progress-photos — upload a progress photo (data URL)
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardApi(req, me.id);
  await limit(`upload:user:${me.id}`, 20, 3600); // max 20 uploads/hour
  const input = createSchema.parse(await req.json());

  const photo = await prisma.progressPhoto.create({
    data: {
      userId: me.id,
      pose: input.pose,
      imageUrl: input.image,
      weight: input.weight ?? null,
      notes: input.notes ?? null,
    },
  });
  return json(toSnake(photo), 201);
});
