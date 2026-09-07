import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { guardAi } from "@/lib/rate-limit";
import { exercisePool, matchExercises } from "@/lib/exercises";

type PlanExercise = { name: string; sets: number; reps_or_time: string; rest_seconds?: number; notes?: string; ref?: unknown };
type Plan = {
  summary: string;
  safetyNote: string;
  days: { day_name: string; focus: string; duration_min: number; exercises: PlanExercise[] }[];
};

const SYSTEM =
  "You are an elite strength & conditioning coach with clinical exercise knowledge. Build safe, personalized 7-day workout plans following ACSM, NSCA and ISSN guidelines. SAFETY IS FIRST: strictly respect injuries, illnesses, pregnancy and today's readiness — never include contraindicated movements, always provide safe modifications, and scale intensity down when the athlete is unwell, sore, low-energy or pregnant. For pregnancy, avoid supine work after the first trimester, contact/fall risk, and Valsalva; keep intensity moderate. Respond ONLY with JSON matching the requested shape.";

// POST /api/ai/workout — generate a 7-day plan adapted to profile, conditions & today's check-in
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const p = await prisma.profile.findUnique({ where: { userId: me.id } });

  const today = new Date(new Date().toISOString().slice(0, 10));
  const [checkin, activeInjuries] = await Promise.all([
    prisma.dailyCheckin.findUnique({ where: { userId_date: { userId: me.id, date: today } } }),
    prisma.injury.findMany({ where: { athleteId: me.id, status: { not: "resolved" } } }),
  ]);

  const injuryText = activeInjuries.length
    ? activeInjuries.map((i) => `${i.bodyPart} (${i.injuryType}, severity ${i.severity}/5, ${i.status})`).join("; ")
    : "none reported";
  const conditions = JSON.stringify(p?.healthConditions ?? []);
  const readiness = checkin
    ? `Today's readiness ${checkin.readiness}/100 — energy ${checkin.energy}/5, soreness ${checkin.soreness}/5, mood ${checkin.mood}/5, feeling "${checkin.feeling}"${checkin.symptoms ? `, symptoms: ${checkin.symptoms}` : ""}. Adjust today's session accordingly (deload/rest if low or unwell).`
    : "No check-in today — assume normal readiness.";
  const pregnancy = p?.isPregnant
    ? `PREGNANT${p.pregnancyDueDate ? ` (due ${p.pregnancyDueDate.toISOString().slice(0, 10)})` : ""} — use prenatal-safe programming.`
    : "";

  // Ground the AI in our real exercise library (each of these has a demo GIF + steps).
  const pool = await exercisePool({ equipment: p?.equipment ?? [], limit: 240 });
  const poolText = pool.map((e) => e.name).join("; ");

  const prompt = `Create a 7-day workout plan as JSON with this exact shape:
{"summary": string, "safetyNote": string, "days": [{"day_name": "Monday".."Sunday", "focus": string, "duration_min": number, "exercises": [{"name": string, "sets": number, "reps_or_time": string, "rest_seconds": number, "notes": string}]}]}

Athlete profile:
- Age: ${p?.age ?? "unknown"}, Weight: ${p?.weight ?? "?"}kg, Target: ${p?.targetWeight ?? "?"}kg, Gender: ${p?.gender ?? "unknown"}
- Activity level: ${p?.activityLevel ?? "moderate"}
- Primary goal: ${p?.primaryGoal || p?.goalDescription || "general fitness"}
- Training days/week: ${p?.trainingDaysPerWeek ?? 3}, Session length: ${p?.sessionDurationMin ?? 45} min
- Equipment: ${(p?.equipment ?? []).join(", ") || "bodyweight + basic gym"}
- Injuries (respect strictly): ${injuryText}
- Health conditions/medications: ${conditions}
- ${pregnancy}
- ${readiness}

IMPORTANT: For each exercise, use an exact name from THIS library where it fits (these have video demos). Prefer these names:
${poolText}
If a needed movement is not in the list, you may use a standard name.

Exactly 7 days (include rest/active-recovery days). Put the safety rationale (injuries, conditions, readiness) in "safetyNote".`;

  const started = Date.now();
  const plan = await generateJson<Plan>(prompt, SYSTEM);

  // Attach a real demo (gif + steps + muscles) to every exercise we can match.
  const allNames = plan.days.flatMap((d) => (d.exercises ?? []).map((e) => e.name)).filter(Boolean);
  const refs = await matchExercises(allNames);
  for (const day of plan.days ?? []) {
    for (const ex of day.exercises ?? []) {
      const r = refs[ex.name];
      if (r) ex.ref = { id: r.id, name: r.name, gif: r.gif, image: r.image, steps: r.steps, target: r.target, equipment: r.equipment, body_part: r.bodyPart, muscle_group: r.muscleGroup, secondary_muscles: r.secondaryMuscles };
    }
  }

  await prisma.aiUsage.create({
    data: { userId: me.id, functionName: "workout", status: "success", durationMs: Date.now() - started },
  }).catch(() => {});

  // Persist as the active plan.
  await prisma.workoutPlan.updateMany({ where: { userId: me.id, isActive: true }, data: { isActive: false } }).catch(() => {});
  await prisma.workoutPlan.create({
    data: {
      userId: me.id,
      weekStart: new Date(),
      planData: plan as object,
      isActive: true,
      profileHash: p?.profileHash ?? null,
    },
  }).catch(() => {});

  return json({ plan });
});
