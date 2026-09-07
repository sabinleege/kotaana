import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/notifications — current user's notifications (newest first)
export const GET = route(async () => {
  const me = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return json(toSnake(items));
});

const patchSchema = z.object({
  id: z.string().uuid().optional(),
  markAllRead: z.boolean().optional(),
});

// PATCH /api/notifications — mark one (id) or all read
export const PATCH = route(async (req: Request) => {
  const me = await requireUser();
  const { id, markAllRead } = patchSchema.parse(await req.json());
  if (markAllRead) {
    await prisma.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } });
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId: me.id }, data: { read: true } });
  }
  return json({ ok: true });
});
