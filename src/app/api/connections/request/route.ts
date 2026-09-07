import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { resolveTarget, orientRelation } from "@/lib/connections";

const schema = z
  .object({
    email: z.string().email().optional(),
    code: z.string().min(1).optional(),
  })
  .refine((v) => v.email || v.code, { message: "Provide an email or a connect code" });

/**
 * POST /api/connections/request — send a connection request by email or code.
 * Creates a PENDING relation that the other person must approve. Either a coach
 * or an athlete can initiate; roles are oriented automatically.
 */
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { email, code } = schema.parse(await req.json());

  const target = await resolveTarget({ email, code });
  if (target.id === me.id) return json({ error: "That's your own account" }, 400);

  const { coachId, athleteId } = orientRelation({ id: me.id, role: me.role }, target);

  const existing = await prisma.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId, athleteId } },
    select: { status: true },
  });
  if (existing?.status === "active") return json({ error: "You're already connected" }, 409);
  if (existing?.status === "pending") return json({ error: "A request is already pending" }, 409);

  const myRole = me.role === "coach" || me.role === "admin" ? "coach" : "athlete";
  const rel = await prisma.coachAthleteRelation.upsert({
    where: { coachId_athleteId: { coachId, athleteId } },
    update: { status: "pending", requestedByRole: myRole },
    create: { coachId, athleteId, status: "pending", requestedByRole: myRole },
  });

  // Notify the person who needs to approve.
  const recipientId = myRole === "coach" ? athleteId : coachId;
  const meProfile = await prisma.profile.findUnique({ where: { userId: me.id }, select: { fullName: true } });
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "connection_request",
      title: "New connection request",
      message: `${meProfile?.fullName || "Someone"} wants to connect ${myRole === "coach" ? "as your coach" : "as your athlete"}.`,
      data: { relationId: rel.id },
    },
  }).catch(() => {});

  return json({ ok: true, id: rel.id, status: rel.status }, 201);
});
