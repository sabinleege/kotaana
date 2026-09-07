import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/invites — coach's invites
export const GET = route(async () => {
  const coach = await requireRole("coach", "admin");
  const invites = await prisma.coachInvite.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });
  return json(toSnake(invites));
});

const createSchema = z.object({ email: z.string().email().nullable().optional() });

// POST /api/invites
export const POST = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const { email } = createSchema.parse(await req.json().catch(() => ({})));

  const created = await prisma.coachInvite.create({
    data: {
      coachId: coach.id,
      email: email || null,
      inviteCode: randomBytes(6).toString("hex"),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });
  return json(toSnake(created), 201);
});
