import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, listManagedAthleteIds, countActiveMembers } from "@/lib/coach/access";
import { prisma } from "@/lib/db";

export const GET = route(async () => {
  const me = await requireUser();
  await requireCoach(me.id);
  const relations = await listManagedAthleteIds(me.id, true);
  const ids = relations.map((r) => r.athleteId);
  if (!ids.length) return json({ members: [] });

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, fullName: true, email: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true },
  });

  const members = relations.map((r) => {
    const p = profiles.find((x) => x.userId === r.athleteId);
    const u = users.find((x) => x.id === r.athleteId);
    return {
      athleteId: r.athleteId,
      name: p?.fullName || u?.name || "Athlete",
      email: p?.email || u?.email,
      status: r.status,
    };
  });

  return json({ members });
});

const patchSchema = z.object({
  athleteId: z.string(),
  status: z.enum(["active", "paused", "ended"]),
});

export const PATCH = route(async (req: Request) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const body = patchSchema.parse(await req.json());

  await prisma.coachAthleteRelation.updateMany({
    where: { coachId: me.id, athleteId: body.athleteId },
    data: { status: body.status },
  });

  return json({ ok: true });
});

const postSchema = z.object({
  email: z.string().email(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const { email } = postSchema.parse(await req.json());

  const sub = await prisma.subscription.findUnique({ where: { userId: me.id } });
  const seatLimit = sub?.seatLimit ?? 100;
  const used = await countActiveMembers(me.id);
  if (seatLimit && used >= seatLimit) {
    return json({ error: "Seat limit reached. Upgrade your plan." }, 402);
  }

  // Create invite (existing CoachInvite model)
  const code = Math.random().toString(36).slice(2, 10);
  const invite = await prisma.coachInvite.create({
    data: {
      coachId: me.id,
      email: email.toLowerCase(),
      inviteCode: code,
      status: "pending",
      expiresAt: new Date(Date.now() + 14 * 86400000),
    },
  });

  return json({
    message: `Invite created for ${email}. Code: ${invite.inviteCode}`,
    inviteCode: invite.inviteCode,
  });
});
