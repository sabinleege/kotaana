import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { generateJson } from "@/lib/ai";

const schema = z.object({ description: z.string().min(2) });

type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
};

const SYSTEM =
  "You are a registered dietitian. Estimate nutrition for described meals. Respond ONLY with JSON. Be realistic with portion sizes.";

// POST /api/ai/meal — estimate nutrition for a described meal
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const { description } = schema.parse(await req.json());

  const prompt = `Estimate the nutrition for this meal and return JSON:
{"name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "notes": string}
Meal: "${description}"`;

  const started = Date.now();
  const analysis = await generateJson<MealAnalysis>(prompt, SYSTEM);

  await prisma.aiUsage.create({
    data: { userId: me.id, functionName: "meal", status: "success", durationMs: Date.now() - started },
  }).catch(() => {});

  return json({ analysis });
});
