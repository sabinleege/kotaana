/**
 * Goal Planner engine — structured plan from athlete goal (not only chat).
 */
import { prisma } from "@/lib/db";
import { tdee, macroTargets } from "@/lib/metrics";
import { generateJson } from "@/lib/ai";
import { getAiMemoryContext } from "@/lib/memory/weekly-summary";

export type GoalPlan = {
  goal: string;
  timelineWeeks: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sessionsPerWeek: number;
  milestones: { week: number; target: string }[];
  risks: string[];
  notes: string;
};

export async function buildGoalPlan(userId: string): Promise<GoalPlan> {
  const p = await prisma.profile.findUnique({ where: { userId } });
  if (!p) throw new Error("Profile required");

  const calories =
    tdee({
      weightKg: p.weight,
      heightCm: p.height,
      age: p.age,
      gender: p.gender,
      activityLevel: p.activityLevel,
    }) || p.dailyCaloriesTarget || 2150;

  const goal = (p.primaryGoal || p.goalDescription || "general fitness").toLowerCase();
  let adj = calories;
  if (goal.includes("lose") || goal.includes("fat")) adj = calories - 400;
  if (goal.includes("gain") || goal.includes("muscle")) adj = calories + 250;
  const macros = macroTargets(adj);

  const sessions = p.trainingDaysPerWeek ?? 3;
  const memory = await getAiMemoryContext(userId);

  let aiExtra: Partial<GoalPlan> = {};
  try {
    aiExtra = await generateJson<Partial<GoalPlan>>(
      `${memory}\n\nCreate milestones and risks for goal "${p.primaryGoal || goal}" over ${p.timeline || "12 weeks"}. Return JSON: milestones [{week,target}], risks string[], notes string, timelineWeeks number.`,
      "You are a fitness goal planner. JSON only.",
    );
  } catch {
    aiExtra = {
      timelineWeeks: 12,
      milestones: [
        { week: 4, target: "Habit consistency 80%+" },
        { week: 8, target: "Mid-point body check" },
        { week: 12, target: "Reassess goal weight/performance" },
      ],
      risks: p.isPregnant ? ["Pregnancy — medical clearance required"] : [],
      notes: "Plan auto-adjusted from profile metrics.",
    };
  }

  const plan: GoalPlan = {
    goal: p.primaryGoal || p.goalDescription || "General fitness",
    timelineWeeks: aiExtra.timelineWeeks || 12,
    dailyCalories: Math.round(adj),
    proteinG: macros.protein,
    carbsG: macros.carbs,
    fatG: macros.fat,
    sessionsPerWeek: sessions,
    milestones: aiExtra.milestones || [],
    risks: aiExtra.risks || [],
    notes: aiExtra.notes || "",
  };

  await prisma.profile.update({
    where: { userId },
    data: {
      goalPlanJson: plan as any,
      dailyCaloriesTarget: plan.dailyCalories,
    },
  }).catch(() => {});

  return plan;
}
