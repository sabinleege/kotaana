import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/profile — the signed-in user's own profile
export const GET = route(async () => {
  const me = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: me.id } });
  return json(profile ? toSnake({ ...profile, id: profile.userId }) : null);
});

// PATCH /api/profile — update own profile (self-serve athlete fields)
const patchSchema = z
  .object({
    full_name: z.string(),
    age: z.number().int(),
    gender: z.string().nullable(),
    height: z.number(),
    weight: z.number(),
    target_weight: z.number(),
    body_fat: z.number(),
    activity_level: z.string(),
    goals: z.array(z.string()),
    goal_description: z.string(),
    primary_goal: z.string().nullable(),
    injuries: z.any(),
    injuries_detailed: z.any(),
    daily_calories_target: z.number().int(),
    water_target: z.number().int(),
    water_glasses: z.number().int(),
    fitness_score: z.number().int(),
    recovery_score: z.number().int(),
    consistency_score: z.number().int(),
    heart_rate: z.number().int(),
    profession: z.string(),
    chronic_diseases: z.string(),
    past_surgeries: z.string(),
    medications: z.string(),
    pain_areas: z.string(),
    dietary_style: z.array(z.string()),
    allergies: z.array(z.string()),
    meals_per_day: z.number().int(),
    equipment: z.array(z.string()),
    training_location: z.string(),
    training_days_per_week: z.number().int(),
    session_duration_min: z.number().int(),
    onboarding_completed: z.boolean().optional(),
  momo_number: z.string().min(5).max(20).optional(),
  age_band: z.string().optional(),
  track: z.string().optional(),
  momo_name: z.string().min(1).max(80).optional(),
    // Health & life status
    health_conditions: z.any(),
    is_pregnant: z.boolean(),
    pregnancy_due_date: z.string().nullable(),
    cycle_tracking: z.boolean(),
    cycle_last_period: z.string().nullable(),
    cycle_length_days: z.number().int(),
  })
  .partial();

const CAMEL: Record<string, string> = {
  full_name: "fullName", target_weight: "targetWeight", body_fat: "bodyFat",
  activity_level: "activityLevel", goal_description: "goalDescription", primary_goal: "primaryGoal",
  injuries_detailed: "injuriesDetailed", daily_calories_target: "dailyCaloriesTarget",
  water_target: "waterTarget", water_glasses: "waterGlasses", fitness_score: "fitnessScore",
  recovery_score: "recoveryScore", consistency_score: "consistencyScore", heart_rate: "heartRate",
  chronic_diseases: "chronicDiseases", past_surgeries: "pastSurgeries", pain_areas: "painAreas",
  dietary_style: "dietaryStyle", meals_per_day: "mealsPerDay", training_location: "trainingLocation",
  training_days_per_week: "trainingDaysPerWeek", session_duration_min: "sessionDurationMin",
  onboarding_completed: "onboardingCompleted",
  momo_number: "momoNumber",
  age_band: "ageBand",
  track: "track",
  level: "level",
  momo_name: "momoName",
  health_conditions: "healthConditions", is_pregnant: "isPregnant", pregnancy_due_date: "pregnancyDueDate",
  cycle_tracking: "cycleTracking", cycle_last_period: "cycleLastPeriod", cycle_length_days: "cycleLengthDays",
};

const DATE_KEYS = new Set(["pregnancy_due_date", "cycle_last_period"]);

export const PATCH = route(async (req: Request) => {
  const me = await requireUser();
  const input = patchSchema.parse(await req.json());

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    data[CAMEL[k] ?? k] = DATE_KEYS.has(k) ? (v ? new Date(v as string) : null) : v;
  }

  const profile = await prisma.profile.upsert({
    where: { userId: me.id },
    update: { ...data, aiReportAt: null }, // force AI report rebuild on next use
    create: { userId: me.id, ...data },
  });
  return json(toSnake({ ...profile, id: profile.userId }));
});
