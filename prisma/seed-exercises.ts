import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// Point media at the public jsDelivr CDN mirror of the dataset (no repo bloat).
const CDN = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main";

// Path to the downloaded dataset JSON (override with DATASET env var if needed).
const DATASET =
  process.env.DATASET ||
  "C:/Users/Ishema Toussaint/Downloads/exercises-dataset-main/exercises-dataset-main/data/exercises.json";

/** Normalize an exercise name so AI-generated names can be matched to the dataset. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cdn(rel?: string | null): string | null {
  if (!rel) return null;
  return `${CDN}/${rel.replace(/^\/+/, "")}`;
}

async function main() {
  if (!fs.existsSync(DATASET)) {
    console.error(`Dataset not found at: ${DATASET}\nSet DATASET=/path/to/exercises.json`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(DATASET, "utf8"));
  const list: any[] = Array.isArray(raw) ? raw : raw.exercises ?? [];
  console.log(`Seeding ${list.length} exercises…`);

  let n = 0;
  const BATCH = 200;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    await prisma.$transaction(
      chunk.map((e) => {
        const data = {
          id: String(e.id),
          name: e.name ?? "",
          nameKey: normalizeName(e.name ?? ""),
          category: e.category ?? null,
          bodyPart: e.body_part ?? null,
          equipment: e.equipment ?? null,
          target: e.target ?? null,
          muscleGroup: e.muscle_group ?? null,
          secondaryMuscles: Array.isArray(e.secondary_muscles) ? e.secondary_muscles : [],
          instructions: typeof e.instructions === "object" ? e.instructions.en ?? null : e.instructions ?? null,
          steps: e.instruction_steps?.en ?? [],
          image: cdn(e.image),
          gif: cdn(e.gif_url),
        };
        return prisma.exercise.upsert({ where: { id: data.id }, update: data, create: data });
      }),
    );
    n += chunk.length;
    if (n % 400 === 0 || n === list.length) console.log(`  …${n}/${list.length}`);
  }

  const total = await prisma.exercise.count();
  console.log(`Done. ${total} exercises in the library.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
