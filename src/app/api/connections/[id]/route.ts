import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/authz";
import { route, json } from "@/lib/api";

const respondSchema = z.object({ action: z.enum(["approve", "decline"]) });

async function loadParticipantRelation(id: string, userId: string) {
  const rel = await prisma.coachAthleteRelation.findUnique({ where: { id } });
  if (!rel || (rel.coachId !== userId && rel.athleteId !== userId)) {
    throw new AuthError(404, "Connection not found");
  }
  return rel;
}

/**
 * POST /api/connections/:id — approve or decline a pending request.
 * Only the recipient (the side that did NOT initiate) may respond.
 */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const { action } = respondSchema.parse(await req.json());

  const rel = await loadParticipantRelation(id, me.id);
  if (rel.status !== "pending") return json({ error: "This request is no longer pending" }, 409);

  // The approver is the participant on the opposite side of the initiator.
  const approverId = rel.requestedByRole === "coach" ? rel.athleteId : rel.coachId;
  if (me.id !== approverId) throw new AuthError(403, "Only the recipient can respond to this request");

  if (action === "decline") {
    await prisma.coachAthleteRelation.delete({ where: { id } });
    return json({ ok: true, status: "declined" });
  }

  await prisma.coachAthleteRelation.update({ where: { id }, data: { status: "active" } });

  // Notify the initiator that it was accepted.
  const initiatorId = rel.requestedByRole === "coach" ? rel.coachId : rel.athleteId;
  const meProfile = await prisma.profile.findUnique({ where: { userId: me.id }, select: { fullName: true } });
  await prisma.notification.create({
    data: {
      userId: initiatorId,
      type: "connection_accepted",
      title: "Connection accepted",
      message: `${meProfile?.fullName || "Someone"} accepted your connection request.`,
      data: { relationId: rel.id },
    },
  }).catch(() => {});

  return json({ ok: true, status: "active" });
});

/**
 * DELETE /api/connections/:id — disconnect (either participant may remove an
 * active connection or cancel a pending one they're part of).
 */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  await loadParticipantRelation(id, me.id);
  await prisma.coachAthleteRelation.delete({ where: { id } });
  return json({ ok: true });
});
