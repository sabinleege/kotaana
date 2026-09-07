/**
 * Daily session: report + track/age/level rules + dataset → cards.
 * Hard filters always run before scoring (safe for youth, pregnancy, etc.).
 */
import { prisma } from "@/lib/db";
import { dayKey } from "@/lib/day/rollover";
import { ensureDailyReport } from "@/lib/daily/report";
import {
  ageToBand,
  goalToTrack,
  PLAYBOOKS,
  youthReps,
  isExerciseAllowedForAge,
  type AgeBand,
  type Level,
  type TrackId,
} from "@/lib/training/tracks";
import { suggestNextReps, suggestLoadNote } from "@/lib/training/progression";

export type SessionBlock = {
  phase: "warmup" | "work" | "break" | "finisher";
  exerciseId?: string;
  name: string;
  sets?: number;
  reps?: string;
  restSec?: number;
  notes?: string;
  gif?: string | null;
  steps?: string[];
  target?: string | null;
  highlightBreak?: boolean;
  progressionHint?: string;
};

export type DailySession = {
  dayKey: string;
  title: string;
  focus: string;
  track: TrackId;
  ageBand: AgeBand;
  level: Level;
  blocks: SessionBlock[];
  fromReport: boolean;
  playbookNote: string;
  estimatedMinutes?: number;
};

function scoreExercise(
  e: { name: string; bodyPart: string | null; target: string | null; equipment: string | null },
  equipment: string[],
  avoid: string[],
  playbook: (typeof PLAYBOOKS)[TrackId],
): number {
  let s = 1;
  const eq = (e.equipment || "").toLowerCase();
  const name = e.name.toLowerCase();
  const part = `${e.bodyPart || ""} ${e.target || ""}`.toLowerCase();

  if (equipment.length) {
    const ok = equipment.some(
      (x) =>
        eq.includes(x.toLowerCase()) ||
        x.toLowerCase().includes("body") ||
        eq.includes("body") ||
        eq === "" ||
        eq === "none",
    );
    if (!ok && eq && !/body|none|/.test(eq)) s -= 4;
  }
  for (const a of avoid) {
    if (a && (name.includes(a) || part.includes(a))) s -= 12;
  }
  if (playbook.preferTags.some((re) => re.test(name) || re.test(part))) s += 6;
  if (playbook.avoidTags.some((re) => re.test(name) || re.test(part))) s -= 8;
  return s;
}

export async function buildDailySession(userId: string): Promise<DailySession> {
  const day = dayKey();
  const report = await ensureDailyReport(userId);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const injuries = await prisma.injury.findMany({
    where: { athleteId: userId, status: { not: "resolved" } },
  });

  const age = profile?.age ?? null;
  let ageBand = (profile as any)?.ageBand as AgeBand | undefined;
  if (!ageBand) ageBand = ageToBand(age);

  let track = (profile as any)?.track as TrackId | undefined;
  if (!track) track = goalToTrack(profile?.primaryGoal || profile?.goalDescription, null);
  if (profile?.isPregnant) track = "pregnancy";

  const level = ((profile as any)?.level as Level) || "beginner";
  const playbook = PLAYBOOKS[track] || PLAYBOOKS.general;

  const equipment = (profile?.equipment as string[]) || ["body weight"];
  const avoid = injuries.map((i) => (i.bodyPart || "").toLowerCase()).filter(Boolean);
  // Coach blocks stored as JSON array of name substrings optional
  const coachBlocks: string[] = Array.isArray((profile as any)?.coachBlockedExercises)
    ? ((profile as any).coachBlockedExercises as string[])
    : [];

  const duration = profile?.sessionDurationMin ?? 45;
  let workCount = duration >= 50 ? 6 : duration >= 35 ? 5 : 4;
  if (ageBand === "youth_u12") workCount = Math.min(workCount, 4);
  if (track === "pregnancy" || track === "return_to_train") workCount = Math.min(workCount, 4);
  if (level === "beginner") workCount = Math.min(workCount, 5);

  const pool = await prisma.exercise.findMany({
    take: 400,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      bodyPart: true,
      equipment: true,
      target: true,
      steps: true,
      gif: true,
    },
  });

  const filtered = pool.filter((e) => {
    if (!isExerciseAllowedForAge(e.name, e.bodyPart, ageBand!)) return false;
    if (coachBlocks.some((b) => e.name.toLowerCase().includes(b.toLowerCase()))) return false;
    if (track === "pregnancy" && playbook.avoidTags.some((re) => re.test(e.name))) return false;
    return true;
  });

  const ranked = filtered
    .map((e) => ({ e, s: scoreExercise(e, equipment, avoid, playbook) }))
    .filter((x) => x.s > -6)
    .sort((a, b) => b.s - a.s);

  const pick = (n: number, offset = 0) => ranked.slice(offset, offset + n).map((x) => x.e);

  // Prior performances for progression hints
  const recentPerf = await prisma.exercisePerformance
    .findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 40,
    })
    .catch(() => [] as any[]);

  const lastEffortByExercise = new Map<string, string>();
  for (const row of recentPerf) {
    if (!lastEffortByExercise.has(row.exerciseId)) {
      lastEffortByExercise.set(row.exerciseId, row.effort);
    }
  }

  const warm = pick(2, 0);
  const work = pick(workCount, 2);
  const fin = pick(1, 2 + workCount);

  const repsBase = youthReps(ageBand!, playbook.workReps);
  const blocks: SessionBlock[] = [];

  for (const e of warm) {
    blocks.push({
      phase: "warmup",
      exerciseId: e.id,
      name: e.name,
      sets: 1,
      reps: ageBand!.startsWith("youth") ? "6-8 easy" : "8-10 easy",
      restSec: 30,
      gif: e.gif,
      steps: e.steps,
      target: e.target,
      notes: "Warm-up — controlled tempo",
    });
  }

  work.forEach((e, i) => {
    const effort = lastEffortByExercise.get(e.id) as any;
    const reps = suggestNextReps(repsBase, effort, level);
    const progressionHint = suggestLoadNote(effort, ageBand!);
    blocks.push({
      phase: "work",
      exerciseId: e.id,
      name: e.name,
      sets: level === "advanced" && track === "hypertrophy" ? 4 : playbook.workSets,
      reps,
      restSec: playbook.restSec,
      gif: e.gif,
      steps: e.steps,
      target: e.target,
      notes: [
        avoid.length ? `Mind: ${avoid.join(", ")}` : null,
        progressionHint,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      progressionHint,
    });
    if (i < work.length - 1) {
      blocks.push({
        phase: "break",
        name: "Break — water & breathe",
        restSec: playbook.breakSec,
        highlightBreak: true,
        notes: "Easy walk or stand. Stay hydrated.",
      });
    }
  });

  for (const e of fin) {
    blocks.push({
      phase: "finisher",
      exerciseId: e.id,
      name: e.name,
      sets: 2,
      reps: track === "fat_loss" ? "12-15" : "10-12",
      restSec: 45,
      gif: e.gif,
      steps: e.steps,
      target: e.target,
      notes: "Finisher — stop if form breaks",
    });
  }

  let estSec = 0;
  for (const b of blocks) {
    if (b.phase === "break") { estSec += b.restSec ?? 60; continue; }
    const sets = Math.max(1, b.sets ?? 1);
    estSec += sets * 40 + Math.max(0, sets - 1) * (b.restSec ?? 60) + 15;
  }
  const estimatedMinutes = Math.max(5, Math.round(estSec / 60));

  const session: DailySession = {
    dayKey: day,
    title: `${playbook.title} · ${day}`,
    focus: profile?.primaryGoal || profile?.goalDescription || playbook.title,
    track,
    ageBand: ageBand!,
    level,
    blocks,
    fromReport: report.rebuilt || !!report.text,
    playbookNote: playbook.notes,
    estimatedMinutes,
  };

  await prisma.profile.update({
    where: { userId },
    data: {
      dailySessionJson: session as any,
      track,
      ageBand,
      level,
    } as any,
  });

  return session;
}

export async function getOrBuildDailySession(userId: string): Promise<DailySession> {
  const day = dayKey();
  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { dailySessionJson: true },
  });
  const cached = p?.dailySessionJson as DailySession | null;
  if (cached && cached.dayKey === day && cached.blocks?.length) return cached;
  return buildDailySession(userId);
}
