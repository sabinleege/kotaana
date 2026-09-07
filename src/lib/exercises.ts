import { prisma } from "@/lib/db";

/** Normalize an exercise name (must match the seed's normalization). */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export type ExerciseRef = {
  id: string;
  name: string;
  bodyPart: string | null;
  equipment: string | null;
  target: string | null;
  muscleGroup: string | null;
  secondaryMuscles: string[];
  steps: string[];
  image: string | null;
  gif: string | null;
};

const SELECT = {
  id: true, name: true, bodyPart: true, equipment: true, target: true,
  muscleGroup: true, secondaryMuscles: true, steps: true, image: true, gif: true,
} as const;

/**
 * Match a batch of AI-generated exercise names to dataset entries.
 * Tries exact normalized match, then a contains match, so most suggestions
 * resolve to a real demo. Returns a map keyed by the ORIGINAL name.
 */
export async function matchExercises(names: string[]): Promise<Record<string, ExerciseRef>> {
  const out: Record<string, ExerciseRef> = {};
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return out;

  const keys = unique.map(normalizeName);
  const exact = await prisma.exercise.findMany({ where: { nameKey: { in: keys } }, select: SELECT });
  const byKey = new Map(exact.map((e) => [normalizeName(e.name), e]));

  for (const name of unique) {
    const key = normalizeName(name);
    let hit = byKey.get(key);
    if (!hit) {
      // Fallback: partial contains match on the normalized name.
      hit =
        (await prisma.exercise.findFirst({
          where: { nameKey: { contains: key } },
          select: SELECT,
        })) ?? undefined;
      if (!hit && key.includes(" ")) {
        // Try the last two words (e.g. "barbell bench press" -> "bench press").
        const tail = key.split(" ").slice(-2).join(" ");
        hit =
          (await prisma.exercise.findFirst({
            where: { nameKey: { contains: tail } },
            select: SELECT,
          })) ?? undefined;
      }
    }
    if (hit) out[name] = hit as ExerciseRef;
  }
  return out;
}

/** A compact, relevant pool of exercises to ground the AI's choices. */
export async function exercisePool(opts: {
  equipment?: string[];
  limit?: number;
}): Promise<{ id: string; name: string; bodyPart: string | null; equipment: string | null; target: string | null }[]> {
  const where =
    opts.equipment && opts.equipment.length
      ? { equipment: { in: opts.equipment } }
      : {};
  return prisma.exercise.findMany({
    where,
    select: { id: true, name: true, bodyPart: true, equipment: true, target: true },
    take: opts.limit ?? 260,
    orderBy: { id: "asc" },
  });
}
