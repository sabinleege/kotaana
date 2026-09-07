import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { generateJsonFromImage } from "@/lib/ai";

const schema = z.object({ from_id: z.string().uuid(), to_id: z.string().uuid() });

type Comparison = {
  summary: string;
  changes: string[];
  areas: { area: string; change: "improved" | "similar" | "regressed"; note: string }[];
  encouragement: string;
};

const SYSTEM =
  "You are a supportive fitness coach comparing two progress photos of the SAME person (earlier vs later). Describe visible body-composition changes objectively and kindly — muscle definition, posture, body fat, proportions. Never body-shame; be encouraging and realistic. This is a visual estimate, not a measurement. Respond ONLY with JSON.";

// POST /api/ai/photo-compare — compare two of the user's progress photos
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const { from_id, to_id } = schema.parse(await req.json());

  const [from, to] = await Promise.all([
    prisma.progressPhoto.findUnique({ where: { id: from_id } }),
    prisma.progressPhoto.findUnique({ where: { id: to_id } }),
  ]);
  if (!from || !to || from.userId !== me.id || to.userId !== me.id) {
    return json({ error: "Photos not found" }, 404);
  }

  const spanDays = Math.round(Math.abs(to.date.getTime() - from.date.getTime()) / 86400000);
  const prompt = `Compare these two progress photos of the same person. Image 1 = EARLIER (${from.date.toISOString().slice(0, 10)}${from.weight ? `, ${from.weight}kg` : ""}), Image 2 = LATER (${to.date.toISOString().slice(0, 10)}${to.weight ? `, ${to.weight}kg` : ""}), about ${spanDays} days apart.
Return JSON: {"summary": string, "changes": string[], "areas": [{"area": string, "change": "improved"|"similar"|"regressed", "note": string}], "encouragement": string}`;

  const started = Date.now();
  const comparison = await generateJsonFromImage<Comparison>(
    prompt,
    [
      { base64: from.imageUrl, mimeType: "image/jpeg" },
      { base64: to.imageUrl, mimeType: "image/jpeg" },
    ],
    SYSTEM,
  );

  await prisma.aiUsage.create({
    data: { userId: me.id, functionName: "photo-compare", status: "success", durationMs: Date.now() - started },
  }).catch(() => {});

  return json({ comparison, span_days: spanDays });
});
