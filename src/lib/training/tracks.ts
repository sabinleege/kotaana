/**
 * Tracks + age bands for "everyone" programming.
 * Hard rules run before dataset scoring — AI cannot bypass these.
 */

export type AgeBand = "youth_u12" | "youth_u14" | "youth_u17" | "adult" | "masters";
export type TrackId =
  | "football"
  | "hypertrophy"
  | "fat_loss"
  | "general"
  | "endurance"
  | "pregnancy"
  | "return_to_train";
export type Level = "beginner" | "intermediate" | "advanced";

export function ageToBand(age: number | null | undefined): AgeBand {
  if (age == null || Number.isNaN(age)) return "adult";
  if (age < 12) return "youth_u12";
  if (age < 14) return "youth_u14";
  if (age < 18) return "youth_u17";
  if (age >= 40) return "masters";
  return "adult";
}

export function goalToTrack(goal: string | null | undefined, explicit?: string | null): TrackId {
  if (explicit && ["football", "hypertrophy", "fat_loss", "general", "endurance", "pregnancy", "return_to_train"].includes(explicit)) {
    return explicit as TrackId;
  }
  const g = (goal || "").toLowerCase();
  if (/pregnan/.test(g)) return "pregnancy";
  if (/football|soccer|futbol|athlete.*sport/.test(g)) return "football";
  if (/muscle|hypertrophy|bodybuild|bulk|gain muscle/.test(g)) return "hypertrophy";
  if (/lose weight|fat loss|cut|slim/.test(g)) return "fat_loss";
  if (/endurance|run|cardio|marathon/.test(g)) return "endurance";
  if (/return|rehab|recover/.test(g)) return "return_to_train";
  return "general";
}

/** Name/keyword patterns blocked per age band (applied on exercise name + body part). */
export const AGE_BLOCK_PATTERNS: Record<AgeBand, RegExp[]> = {
  youth_u12: [
    /barbell|deadlift|back squat|bench press|clean|snatch|overhead press|max\b|1rm|heavy/i,
    /smith|leg press|hack squat/i,
  ],
  youth_u14: [/clean|snatch|1rm|max effort|heavy single/i],
  youth_u17: [/1rm|max single/i],
  adult: [],
  masters: [],
};

export type Playbook = {
  id: TrackId;
  title: string;
  focusMuscles: string[];
  preferTags: RegExp[];
  avoidTags: RegExp[];
  workSets: number;
  workReps: string;
  restSec: number;
  breakSec: number;
  notes: string;
};

export const PLAYBOOKS: Record<TrackId, Playbook> = {
  football: {
    id: "football",
    title: "Football / athletic",
    focusMuscles: ["legs", "core", "glutes", "cardio"],
    preferTags: [/lunge|sprint|squat|plank|push.?up|bridge|jump|step|burpee|mountain|shuffle|core|twist/i],
    avoidTags: [/isolation curl|preacher|pec deck/i],
    workSets: 3,
    workReps: "6-10 athletic",
    restSec: 75,
    breakSec: 60,
    notes: "Athletic movement, change of direction prep, body control — not bodybuilding isolation.",
  },
  hypertrophy: {
    id: "hypertrophy",
    title: "Muscle growth",
    focusMuscles: ["chest", "back", "legs", "shoulders", "arms"],
    preferTags: [/press|row|squat|curl|extension|fly|raise|pull|hinge|deadlift|lunge/i],
    avoidTags: [],
    workSets: 3,
    workReps: "8-12",
    restSec: 90,
    breakSec: 75,
    notes: "Progressive hypertrophy. Add reps or load when sets feel easy.",
  },
  fat_loss: {
    id: "fat_loss",
    title: "Fat loss / conditioning",
    focusMuscles: ["full body"],
    preferTags: [/squat|lunge|push|row|burpee|mountain|jumping|plank|swing/i],
    avoidTags: [],
    workSets: 3,
    workReps: "10-15",
    restSec: 45,
    breakSec: 45,
    notes: "Keep rest short; full-body density.",
  },
  general: {
    id: "general",
    title: "General fitness",
    focusMuscles: ["full body"],
    preferTags: [/squat|hinge|push|pull|lunge|plank|row|press/i],
    avoidTags: [],
    workSets: 3,
    workReps: "8-12",
    restSec: 60,
    breakSec: 60,
    notes: "Balanced strength and movement quality.",
  },
  endurance: {
    id: "endurance",
    title: "Endurance base",
    focusMuscles: ["legs", "cardio", "core"],
    preferTags: [/run|walk|cycle|jump|lunge|squat|plank|step/i],
    avoidTags: [/heavy|max/i],
    workSets: 2,
    workReps: "12-20",
    restSec: 40,
    breakSec: 40,
    notes: "Aerobic-friendly volume; leave heavy max work out.",
  },
  pregnancy: {
    id: "pregnancy",
    title: "Pregnancy-safe movement",
    focusMuscles: ["glutes", "core", "back"],
    preferTags: [/walk|bridge|clam|bird.?dog|cat.?cow|wall|seated|side.?lying|band/i],
    avoidTags: [/crunch|sit.?up|jump|v.?up|lying.?supine|heavy|barbell|contact/i],
    workSets: 2,
    workReps: "8-12 easy",
    restSec: 60,
    breakSec: 90,
    notes: "Prenatal-safe only. Stop with pain, dizziness, or bleeding — contact a clinician.",
  },
  return_to_train: {
    id: "return_to_train",
    title: "Return to train",
    focusMuscles: ["full body"],
    preferTags: [/walk|mobility|bridge|bird|dead.?bug|wall|band|isometric/i],
    avoidTags: [/plyo|jump|sprint|max|heavy/i],
    workSets: 2,
    workReps: "6-10 easy",
    restSec: 90,
    breakSec: 90,
    notes: "Conservative loading. Pain-free range only.",
  },
};

export function youthReps(band: AgeBand, base: string): string {
  if (band === "youth_u12") return "6-10 easy (bodyweight focus)";
  if (band === "youth_u14") return "6-10 controlled";
  if (band === "youth_u17") return base;
  return base;
}

export function isExerciseAllowedForAge(name: string, bodyPart: string | null, band: AgeBand): boolean {
  const text = `${name} ${bodyPart || ""}`;
  for (const re of AGE_BLOCK_PATTERNS[band]) {
    if (re.test(text)) return false;
  }
  return true;
}
