import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

/**
 * GET /api/connections — the current user's connections, split into:
 *  - active:   confirmed connections (the coach can follow up the athlete)
 *  - incoming: pending requests awaiting MY approval
 *  - outgoing: pending requests I sent, awaiting the other person
 * Works for both coaches and athletes; the "other" party's profile is included.
 */
export const GET = route(async () => {
  const me = await requireUser();
  const iAmCoachSide = me.role === "coach" || me.role === "admin";

  const rels = await prisma.coachAthleteRelation.findMany({
    where: iAmCoachSide ? { coachId: me.id } : { athleteId: me.id },
    orderBy: { updatedAt: "desc" },
    include: {
      coach: { select: { email: true, profile: { select: { userId: true, fullName: true, avatarUrl: true } } } },
      athlete: { select: { email: true, profile: { select: { userId: true, fullName: true, avatarUrl: true } } } },
    },
  });

  const shape = (r: (typeof rels)[number]) => {
    // The "other" person from my point of view.
    const other = iAmCoachSide ? r.athlete : r.coach;
    return {
      id: r.id,
      status: r.status,
      requested_by_role: r.requestedByRole,
      my_role: iAmCoachSide ? "coach" : "athlete",
      other: {
        id: other.profile?.userId,
        full_name: other.profile?.fullName ?? "",
        email: other.email,
        avatar_url: other.profile?.avatarUrl ?? null,
      },
      created_at: r.createdAt,
    };
  };

  const active = rels.filter((r) => r.status === "active").map(shape);
  const pending = rels.filter((r) => r.status === "pending");
  const myRole = iAmCoachSide ? "coach" : "athlete";
  // I approve requests that the OTHER side initiated.
  const incoming = pending.filter((r) => r.requestedByRole !== myRole).map(shape);
  const outgoing = pending.filter((r) => r.requestedByRole === myRole).map(shape);

  return json(toSnake({ active, incoming, outgoing }));
});
