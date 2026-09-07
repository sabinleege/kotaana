import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";

const schema = z.object({ code: z.string().min(1) });

// POST /api/invites/accept — an athlete accepts a coach's invite, creating the link.
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { code } = schema.parse(await req.json());

  const invite = await prisma.coachInvite.findUnique({ where: { inviteCode: code } });
  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date()) {
    return json({ error: "Invalid or expired invite" }, 400);
  }
  if (invite.email && invite.email.toLowerCase() !== (me.email ?? "").toLowerCase()) {
    return json({ error: "This invite is for a different email" }, 403);
  }
  if (invite.coachId === me.id) {
    return json({ error: "You can't accept your own invite" }, 400);
  }

  await prisma.$transaction([
    prisma.coachInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedById: me.id, acceptedAt: new Date() },
    }),
    prisma.coachAthleteRelation.upsert({
      where: { coachId_athleteId: { coachId: invite.coachId, athleteId: me.id } },
      update: { status: "active" },
      create: { coachId: invite.coachId, athleteId: me.id, status: "active" },
    }),
    prisma.notification.create({
      data: {
        userId: invite.coachId,
        type: "invite_accepted",
        title: "Invite accepted",
        message: "An athlete accepted your invitation.",
        data: { athleteId: me.id, inviteId: invite.id },
      },
    }),
  ]);

  return json({ ok: true, coachId: invite.coachId });
});
