// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { generateJsonFromImage } from "@/lib/ai";

const schema = z.object({
  image: z.string().min(10), // data URL or base64
  mimeType: z.string().default("image/jpeg"),
  hint: z.string().optional(),
});

type MealAnalysis = {
  name: string;
  items: { name: string; calories: number; protein: number }[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
  notes: string;
};

const SYSTEM =
  "You are a registered dietitian analyzing a photo of a meal. Identify the foods and estimate total nutrition. Respond ONLY with JSON. Be realistic about portion sizes; if unsure, say so in confidence.";

// POST /api/ai/meal-vision — analyze a meal photo into nutrition
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const { image, mimeType, hint } = schema.parse(await req.json());

  const prompt = `Analyze this meal photo and return JSON:
{"name": string, "items": [{"name": string, "calories": number, "protein": number}], "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high"|"medium"|"low", "notes": string}
${hint ? `User hint: ${hint}` : ""}`;

  const started = Date.now();
  const analysis = await generateJsonFromImage<MealAnalysis>(prompt, { base64: image, mimeType }, SYSTEM);

  await prisma.aiUsage.create({
    data: { userId: me.id, functionName: "meal-vision", status: "success", durationMs: Date.now() - started },
  }).catch(() => {});

  return json({ analysis });
});
