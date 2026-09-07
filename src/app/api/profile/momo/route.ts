/**
 * GET/PATCH athlete or coach MoMo number + name (saved in Settings).
 */
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  momoNumber: z.string().min(5).max(20),
  momoName: z.string().min(1).max(80),
});

export const GET = route(async () => {
  const me = await requireUser();
  const p = await prisma.profile.findUnique({
    where: { userId: me.id },
    select: { momoNumber: true, momoName: true },
  });
  return json({ momoNumber: p?.momoNumber || null, momoName: p?.momoName || null });
});

export const PATCH = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());
  const p = await prisma.profile.upsert({
    where: { userId: me.id },
    create: {
      userId: me.id,
      momoNumber: body.momoNumber.replace(/\s+/g, ""),
      momoName: body.momoName.trim(),
    },
    update: {
      momoNumber: body.momoNumber.replace(/\s+/g, ""),
      momoName: body.momoName.trim(),
    },
  });
  return json({ momoNumber: p.momoNumber, momoName: p.momoName });
});
