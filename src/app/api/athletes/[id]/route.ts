import { prisma } from "@/lib/db";
import { requireRole, requireCoachOfAthlete } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/athletes/:id — detail (profile + recent tracking) for a linked athlete
export const GET = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const coach = await requireRole("coach", "admin");
    const { id } = await ctx.params;
    await requireCoachOfAthlete(coach.id, id);

    const [profile, weights, workouts, activity] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: id } }),
      prisma.weightHistory.findMany({
        where: { userId: id },
        orderBy: { recordedAt: "asc" },
        take: 12,
      }),
      prisma.workoutLog.findMany({
        where: { userId: id },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.activityData.findMany({
        where: { userId: id },
        orderBy: { date: "desc" },
        take: 14,
      }),
    ]);

    return json(
      toSnake({
        profile: profile ? { ...profile, id: profile.userId } : null,
        weights,
        workouts,
        activity,
      }),
    );
  },
);
