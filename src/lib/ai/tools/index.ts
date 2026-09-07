/**
 * Tool registry — models request tools; backend executes with session user only.
 * Expand as needed; never pass raw DB credentials to models.
 */
import { prisma } from "@/lib/db";
import { getProfileReport } from "@/lib/profile-report";

export type ToolContext = { userId: string };

export const tools = {
  async get_athlete_profile(ctx: ToolContext) {
    return getProfileReport(ctx.userId);
  },
  async get_recent_workouts(ctx: ToolContext) {
    return prisma.workoutLog.findMany({
      where: { userId: ctx.userId },
      orderBy: { date: "desc" },
      take: 14,
    });
  },
  async get_available_equipment(ctx: ToolContext) {
    const p = await prisma.profile.findUnique({
      where: { userId: ctx.userId },
      select: { equipment: true },
    });
    return p?.equipment ?? [];
  },
};

export type ToolName = keyof typeof tools;

export async function executeTool(name: ToolName, ctx: ToolContext) {
  const fn = tools[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  return fn(ctx);
}
